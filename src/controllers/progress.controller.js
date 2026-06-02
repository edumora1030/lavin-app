const prisma = require('../config/db');
const { Errores } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');
const { MODULOS_EMPRESA } = require('../../scripts/programs-data');
const SLUGS_EMPRESA = MODULOS_EMPRESA.map((m) => m.slug);

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

class ProgresoError extends Error {
  constructor(code, campo, mensaje) {
    super(mensaje);
    this.code = code;
    this.campo = campo;
  }
}

async function marcarItemsVistos(usuarioId, moduloId, items) {
  for (const item of items) {
    await prisma.progreso.upsert({
      where: {
        usuarioId_moduloId_itemId_tipo: {
          usuarioId,
          moduloId,
          itemId: item.id,
          tipo: 'item_visto',
        },
      },
      update: { completado: true, fechaCompletado: new Date() },
      create: {
        usuarioId,
        moduloId,
        itemId: item.id,
        tipo: 'item_visto',
        completado: true,
        fechaCompletado: new Date(),
      },
    });
  }
}

async function completarModuloUsuario(usuarioId, moduloId, {
  validarOrden = true,
  validarExamen = true,
  forzarMarcarItems = false,
  rol = 'empleado',
} = {}) {
  const modulo = await prisma.modulo.findUnique({
    where: { id: moduloId },
    include: { items: { where: { activo: true } }, examenes: { where: { activo: true } } },
  });
  if (!modulo) throw new ProgresoError('NOT_FOUND', 'modulo', 'Módulo no encontrado');

  if (validarOrden && rol === 'empleado') {
    const slugs = SLUGS_EMPRESA;
    const idx = slugs.indexOf(modulo.slug);
    if (idx > 0) {
      const prevMod = await prisma.modulo.findUnique({ where: { slug: slugs[idx - 1] } });
      if (prevMod) {
        const prevComplete = await prisma.progreso.findFirst({
          where: {
            usuarioId,
            moduloId: prevMod.id,
            tipo: 'modulo_completado',
            completado: true,
          },
        });
        if (!prevComplete) {
          throw new ProgresoError('VALIDATION', 'modulo', 'Completa el módulo anterior primero.');
        }
      }
    }
  }

  const vistos = await prisma.progreso.count({
    where: { usuarioId, moduloId, tipo: 'item_visto', completado: true },
  });
  if (vistos < modulo.items.length) {
    if (vistos === 0 && !forzarMarcarItems) {
      throw new ProgresoError('VALIDATION', 'items', 'Debes ver el contenido del módulo antes de finalizar.');
    }
    await marcarItemsVistos(usuarioId, moduloId, modulo.items);
  }

  if (validarExamen && modulo.requiereExamen && modulo.examenes.length > 0) {
    const aprobado = await prisma.intentoExamen.findFirst({
      where: { usuarioId, examenId: modulo.examenes[0].id, aprobado: true },
    });
    if (!aprobado) {
      throw new ProgresoError('VALIDATION', 'examen', 'Debes aprobar el examen para finalizar.');
    }
  }

  const existente = await prisma.progreso.findFirst({
    where: { usuarioId, moduloId, tipo: 'modulo_completado' },
  });
  const p = existente
    ? await prisma.progreso.update({
        where: { id: existente.id },
        data: { completado: true, fechaCompletado: new Date() },
      })
    : await prisma.progreso.create({
        data: {
          usuarioId,
          moduloId,
          tipo: 'modulo_completado',
          completado: true,
          fechaCompletado: new Date(),
        },
      });

  await auditar({ usuarioId, accion: 'modulo_completado', detalle: { moduloId } });
  return p;
}

exports.completarModuloUsuario = completarModuloUsuario;

exports.finalizarModulo = async (req, res) => {
  const { moduloId } = req.body;
  try {
    const p = await completarModuloUsuario(req.usuario.id, moduloId, { rol: req.usuario.rol });
    return res.json(p);
  } catch (err) {
    if (err instanceof ProgresoError) {
      if (err.code === 'NOT_FOUND') return Errores.noEncontrado(res, 'Módulo');
      return Errores.validacion(res, [{ campo: err.campo, mensaje: err.message }]);
    }
    throw err;
  }
};

exports.recorridoPlanta = async (req, res) => {
  req.body = { tipo: 'recorrido_planta' };
  return require('./notificaciones.controller').solicitar(req, res);
};

const {
  listarEmpleadosResumen,
  mapEmpleadoResumen,
  mapEmpleadosResumen,
  toCsv,
  CSV_COLUMNAS,
} = require('../utils/progresoResumen');

exports.resumen = async (req, res) => {
  const { empleados, modulosEmpresa, checklistPuestoTotal, checklistPorUsuario } = await listarEmpleadosResumen(req);

  const data = empleados.map(({ password, progresos, ...e }) => ({
    ...e,
    ...mapEmpleadoResumen({ ...e, progresos }, modulosEmpresa, checklistPuestoTotal, checklistPorUsuario),
  }));
  return res.json(data);
};

exports.resumenCsv = async (req, res) => {
  const { empleados, modulosEmpresa, checklistPuestoTotal, checklistPorUsuario } = await listarEmpleadosResumen(req);
  const rows = mapEmpleadosResumen(empleados, modulosEmpresa, checklistPuestoTotal, checklistPorUsuario);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="progreso-empleados.csv"');
  res.send(toCsv(rows, CSV_COLUMNAS));
};
