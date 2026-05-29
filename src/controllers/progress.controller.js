const prisma = require('../config/db');
const { Errores } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');
const { MODULOS_EMPRESA } = require('../../scripts/programs-data');

exports.miProgreso = async (req, res) => {
  const progresos = await prisma.progreso.findMany({
    where: { usuarioId: req.usuario.id },
    include: { modulo: { select: { id: true, slug: true, nombre: true } } },
  });
  return res.json(progresos);
};

exports.marcarItem = async (req, res) => {
  const { itemId, moduloId } = req.body;
  if (!itemId || !moduloId) return Errores.validacion(res, [{ campo: 'itemId', mensaje: 'Requerido.' }]);

  const p = await prisma.progreso.upsert({
    where: { usuarioId_moduloId_itemId_tipo: { usuarioId: req.usuario.id, moduloId, itemId, tipo: 'item_visto' } },
    update: { completado: true, fechaCompletado: new Date() },
    create: { usuarioId: req.usuario.id, moduloId, itemId, tipo: 'item_visto', completado: true, fechaCompletado: new Date() },
  });
  return res.json(p);
};

exports.finalizarModulo = async (req, res) => {
  const { moduloId } = req.body;
  const modulo = await prisma.modulo.findUnique({
    where: { id: moduloId },
    include: { items: { where: { activo: true } }, examenes: { where: { activo: true } } },
  });
  if (!modulo) return Errores.noEncontrado(res, 'Módulo');

  if (req.usuario.rol === 'empleado') {
    const slugs = MODULOS_EMPRESA.map((m) => m.slug);
    const idx = slugs.indexOf(modulo.slug);
    if (idx > 0) {
      const prevMod = await prisma.modulo.findUnique({ where: { slug: slugs[idx - 1] } });
      if (prevMod) {
        const prevComplete = await prisma.progreso.findFirst({
          where: {
            usuarioId: req.usuario.id,
            moduloId: prevMod.id,
            tipo: 'modulo_completado',
            completado: true,
          },
        });
        if (!prevComplete) {
          return Errores.validacion(res, [{ campo: 'modulo', mensaje: 'Completa el módulo anterior primero.' }]);
        }
      }
    }
  }

  // Validar que todos los ítems están vistos (o marcar los faltantes al finalizar)
  const vistos = await prisma.progreso.count({
    where: { usuarioId: req.usuario.id, moduloId, tipo: 'item_visto', completado: true },
  });
  if (vistos < modulo.items.length) {
    if (vistos === 0) {
      return Errores.validacion(res, [{ campo: 'items', mensaje: 'Debes ver el contenido del módulo antes de finalizar.' }]);
    }
    for (const item of modulo.items) {
      await prisma.progreso.upsert({
        where: {
          usuarioId_moduloId_itemId_tipo: {
            usuarioId: req.usuario.id,
            moduloId,
            itemId: item.id,
            tipo: 'item_visto',
          },
        },
        update: { completado: true, fechaCompletado: new Date() },
        create: {
          usuarioId: req.usuario.id,
          moduloId,
          itemId: item.id,
          tipo: 'item_visto',
          completado: true,
          fechaCompletado: new Date(),
        },
      });
    }
  }

  // Si requiere examen, validar aprobación
  if (modulo.requiereExamen && modulo.examenes.length > 0) {
    const aprobado = await prisma.intentoExamen.findFirst({
      where: { usuarioId: req.usuario.id, examenId: modulo.examenes[0].id, aprobado: true },
    });
    if (!aprobado) return Errores.validacion(res, [{ campo: 'examen', mensaje: 'Debes aprobar el examen para finalizar.' }]);
  }

  // findFirst + update/create manual (Prisma no soporta null en unique compuesto con upsert)
  const existente = await prisma.progreso.findFirst({
    where: { usuarioId: req.usuario.id, moduloId, tipo: 'modulo_completado' },
  });
  const p = existente
    ? await prisma.progreso.update({ where: { id: existente.id }, data: { completado: true, fechaCompletado: new Date() } })
    : await prisma.progreso.create({
        data: { usuarioId: req.usuario.id, moduloId, tipo: 'modulo_completado', completado: true, fechaCompletado: new Date() },
      });

  await auditar({ usuarioId: req.usuario.id, accion: 'modulo_completado', detalle: { moduloId } });
  return res.json(p);
};

exports.recorridoPlanta = async (req, res) => {
  req.body = { tipo: 'recorrido_planta' };
  return require('./notificaciones.controller').solicitar(req, res);
};

exports.resumen = async (req, res) => {
  const userWhere = { rol: 'empleado', activo: true };

  // Supervisors only see employees from their area
  if (req.usuario.rol === 'supervisor' && req.usuario.areaId) {
    userWhere.areaId = req.usuario.areaId;
  }

  const empleados = await prisma.usuario.findMany({
    where: userWhere,
    include: {
      progresos: { where: { tipo: 'modulo_completado', completado: true }, select: { moduloId: true } },
      areaRel: { select: { id: true, nombre: true } },
    },
  });

  // Count total modules relevant to each employee
  const totalModulosEmpresa = await prisma.modulo.count({
    where: { activo: true, alcance: { in: ['empresa', 'ambos'] } },
  });

  const data = empleados.map(({ password, ...e }) => ({
    ...e,
    modulosCompletados: e.progresos.length,
    totalModulos: e.induccionPuestoHabilitada ? totalModulosEmpresa + 0 : totalModulosEmpresa,
  }));
  return res.json(data);
};

exports.resumenCsv = async (req, res) => {
  const userWhere = { rol: 'empleado', activo: true };
  if (req.usuario.rol === 'supervisor' && req.usuario.areaId) {
    userWhere.areaId = req.usuario.areaId;
  }

  const empleados = await prisma.usuario.findMany({
    where: userWhere,
    include: {
      progresos: { where: { tipo: 'modulo_completado', completado: true }, select: { moduloId: true } },
      areaRel: { select: { nombre: true } },
    },
  });

  const rows = empleados.map(({ password, progresos, areaRel, ...e }) => ({
    nomina: e.nomina,
    nombre: e.nombre,
    programa: e.programa || '',
    area: areaRel?.nombre || e.area || '',
    modulosCompletados: progresos.length,
    activo: e.activo ? 'Sí' : 'No',
  }));

  const cols = ['nomina', 'nombre', 'programa', 'area', 'modulosCompletados', 'activo'];
  const header = cols.join(',');
  const lines = rows.map(r => cols.map(c => {
    const v = r[c] ?? '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(','));

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="progreso-equipo.csv"');
  res.send([header, ...lines].join('\n'));
};
