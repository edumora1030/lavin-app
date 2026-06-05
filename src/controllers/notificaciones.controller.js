const prisma = require('../config/db');
const { Errores } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');
const { MODULOS_EMPRESA } = require('../../scripts/programs-data');

const TIPOS_EMPRESA = ['recorrido_planta', 'sistemas'];
const TIPOS_PUESTO = ['induccion_puesto_completada'];

async function checklistPuestoCompleto(usuarioId) {
  const items = await prisma.checklistPuestoItem.findMany({
    where: { activo: true },
    select: { id: true },
  });
  if (!items.length) return false;

  const completados = await prisma.checklistPuestoProgreso.count({
    where: {
      usuarioId,
      completado: true,
      itemId: { in: items.map((i) => i.id) },
    },
  });

  return completados >= items.length;
}

async function modulosEmpresaCompletos(usuarioId) {
  const slugs = MODULOS_EMPRESA.map((m) => m.slug);
  const modulos = await prisma.modulo.findMany({
    where: { slug: { in: slugs }, activo: true },
    select: { id: true },
  });
  if (!modulos.length) return false;

  const completados = await prisma.progreso.count({
    where: {
      usuarioId,
      tipo: 'modulo_completado',
      completado: true,
      moduloId: { in: modulos.map((m) => m.id) },
    },
  });

  return completados >= modulos.length;
}

exports.misSolicitudes = async (req, res) => {
  const list = await prisma.notificacionRH.findMany({
    where: { usuarioId: req.usuario.id },
    orderBy: { creadoEn: 'desc' },
  });
  return res.json(list);
};

exports.solicitar = async (req, res) => {
  const { tipo } = req.body;

  const esEmpresa = TIPOS_EMPRESA.includes(tipo);
  const esPuesto = TIPOS_PUESTO.includes(tipo);

  if (!esEmpresa && !esPuesto) {
    return Errores.validacion(res, [{ campo: 'tipo', mensaje: 'Tipo de solicitud no válido.' }]);
  }

  if (esPuesto) {
    if (!req.usuario.induccionPuestoHabilitada) {
      return Errores.validacion(res, [{ campo: 'induccion', mensaje: 'La inducción al puesto no está habilitada.' }]);
    }
    if (!(await checklistPuestoCompleto(req.usuario.id))) {
      return Errores.validacion(res, [
        { campo: 'checklist', mensaje: 'Debes completar todas las actividades del checklist primero.' },
      ]);
    }
  } else if (!(await modulosEmpresaCompletos(req.usuario.id))) {
    return Errores.validacion(res, [{ campo: 'modulos', mensaje: 'Debes completar todos los módulos primero.' }]);
  }

  const pendiente = await prisma.notificacionRH.findFirst({
    where: { usuarioId: req.usuario.id, tipo, estado: 'pendiente' },
  });

  if (pendiente) {
    return res.json({ ok: true, yaEnviada: true, notificacion: pendiente });
  }

  const notificacion = await prisma.notificacionRH.create({
    data: { usuarioId: req.usuario.id, tipo },
  });

  await auditar({
    usuarioId: req.usuario.id,
    accion: `solicitud_${tipo}`,
    detalle: { notificacionId: notificacion.id },
    ip: req.ip,
  });

  return res.status(201).json({ ok: true, notificacion });
};

exports.contarPendientes = async (req, res) => {
  const total = await prisma.notificacionRH.count({ where: { estado: 'pendiente' } });
  return res.json({ total });
};

exports.listar = async (req, res) => {
  const where = {};
  if (req.query.estado === 'pendiente' || req.query.estado === 'atendida') {
    where.estado = req.query.estado;
  }

  const list = await prisma.notificacionRH.findMany({
    where,
    include: {
      usuario: {
        select: {
          id: true,
          nombre: true,
          nomina: true,
          area: true,
          programa: true,
          areaRel: { select: { nombre: true } },
        },
      },
    },
    orderBy: { creadoEn: 'desc' },
  });

  return res.json(list);
};

exports.atender = async (req, res) => {
  try {
    const notificacion = await prisma.notificacionRH.update({
      where: { id: req.params.id },
      data: { estado: 'atendida', atendidaEn: new Date() },
      include: {
        usuario: { select: { id: true, nombre: true, nomina: true } },
      },
    });

    await auditar({
      usuarioId: req.usuario.id,
      accion: 'notificacion_atendida',
      detalle: { notificacionId: notificacion.id, tipo: notificacion.tipo },
    });

    return res.json(notificacion);
  } catch {
    return Errores.noEncontrado(res, 'Notificación');
  }
};
