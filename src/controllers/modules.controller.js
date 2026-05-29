const prisma = require('../config/db');
const { Errores } = require('../utils/errores');
const { MODULOS_EMPRESA } = require('../../scripts/programs-data');

const SLUGS_EMPRESA = MODULOS_EMPRESA.map((m) => m.slug);

exports.listar = async (req, res) => {
  const { programa, rol, induccionEmpresaHabilitada, induccionPuestoHabilitada } = req.usuario;
  const where = {};

  if (rol !== 'admin') where.activo = true;

  // Query param ?alcance=empresa|puesto to filter scope
  const alcanceSolicitado = req.query.alcance;

  if (rol === 'empleado') {
    if (!programa) return res.json([]);

    const alcancesPermitidos = [];
    if (induccionEmpresaHabilitada) alcancesPermitidos.push('empresa');
    if (induccionPuestoHabilitada && programa === 'administrativo') alcancesPermitidos.push('puesto');
    if (alcancesPermitidos.length === 0) return res.json([]);

    const alcanceFiltro = alcanceSolicitado && alcancesPermitidos.includes(alcanceSolicitado)
      ? alcanceSolicitado
      : alcancesPermitidos[0];

    where.OR = [
      { programa, alcance: alcanceFiltro },
      { programa, alcance: 'ambos' },
      { programa: 'ambos', alcance: alcanceFiltro },
      { programa: 'ambos', alcance: 'ambos' },
    ];

    if (alcanceFiltro === 'empresa') {
      where.slug = { in: SLUGS_EMPRESA };
    }
  }
  const modulos = await prisma.modulo.findMany({
    where,
    orderBy: { orden: 'asc' },
    include: {
      items: { where: { activo: true }, orderBy: { orden: 'asc' } },
      examenes: { select: { id: true } },
      videos: {
        where: { activo: true },
        orderBy: { subidoEn: 'desc' },
        take: 1,
        select: { id: true, titulo: true },
      },
    },
  });
  return res.json(modulos);
};

exports.detalle = async (req, res) => {
  const m = await prisma.modulo.findUnique({
    where: { id: req.params.id },
    include: { items: { where: { activo: true }, orderBy: { orden: 'asc' } }, examenes: true, videos: { where: { activo: true } } },
  });
  if (!m) return Errores.noEncontrado(res, 'Módulo');
  return res.json(m);
};

exports.crear = async (req, res) => {
  const m = await prisma.modulo.create({ data: req.body });
  return res.status(201).json(m);
};

exports.actualizar = async (req, res) => {
  try {
    const m = await prisma.modulo.update({ where: { id: req.params.id }, data: req.body });
    return res.json(m);
  } catch { return Errores.noEncontrado(res, 'Módulo'); }
};

exports.agregarItem = async (req, res) => {
  const item = await prisma.itemModulo.create({ data: { ...req.body, moduloId: req.params.id } });
  return res.status(201).json(item);
};

exports.actualizarItem = async (req, res) => {
  try {
    const it = await prisma.itemModulo.update({ where: { id: req.params.itemId }, data: req.body });
    return res.json(it);
  } catch { return Errores.noEncontrado(res, 'Ítem'); }
};

exports.eliminarItem = async (req, res) => {
  try {
    await prisma.itemModulo.delete({ where: { id: req.params.itemId } });
    return res.json({ ok: true });
  } catch { return Errores.noEncontrado(res, 'Ítem'); }
};

exports.eliminar = async (req, res) => {
  try {
    const m = await prisma.modulo.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    return res.json(m);
  } catch {
    return Errores.noEncontrado(res, 'Módulo');
  }
};
