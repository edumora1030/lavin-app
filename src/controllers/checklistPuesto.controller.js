const prisma = require('../config/db');
const { Errores } = require('../utils/errores');

exports.listarItems = async (req, res) => {
  const soloActivos = req.usuario.rol !== 'admin';
  const items = await prisma.checklistPuestoItem.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { orden: 'asc' },
  });
  return res.json(items);
};

exports.miProgreso = async (req, res) => {
  const [items, progresos, usuario] = await Promise.all([
    prisma.checklistPuestoItem.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
    prisma.checklistPuestoProgreso.findMany({
      where: { usuarioId: req.usuario.id, completado: true },
    }),
    prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { comentariosInduccionPuesto: true, temasPuesto: true },
    }),
  ]);
  const completadosSet = new Set(progresos.map((p) => p.itemId));
  const total = items.length;
  const completados = items.filter((i) => completadosSet.has(i.id)).length;
  return res.json({
    items,
    progresos,
    completados,
    total,
    pct: total ? Math.round((completados / total) * 100) : 0,
    comentarios: usuario?.comentariosInduccionPuesto || '',
    temasPuesto: usuario?.temasPuesto || '',
  });
};

exports.toggleItem = async (req, res) => {
  const { itemId, completado } = req.body;
  if (!itemId || typeof completado !== 'boolean') {
    return Errores.validacion(res, [{ campo: 'itemId', mensaje: 'itemId y completado son requeridos.' }]);
  }

  const item = await prisma.checklistPuestoItem.findFirst({
    where: { id: itemId, activo: true },
  });
  if (!item) return Errores.noEncontrado(res, 'Actividad');

  if (completado) {
    await prisma.checklistPuestoProgreso.upsert({
      where: { usuarioId_itemId: { usuarioId: req.usuario.id, itemId } },
      update: { completado: true, fechaCompletado: new Date() },
      create: {
        usuarioId: req.usuario.id,
        itemId,
        completado: true,
        fechaCompletado: new Date(),
      },
    });
  } else {
    await prisma.checklistPuestoProgreso.deleteMany({
      where: { usuarioId: req.usuario.id, itemId },
    });
  }

  const [items, progresos] = await Promise.all([
    prisma.checklistPuestoItem.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
    prisma.checklistPuestoProgreso.findMany({
      where: { usuarioId: req.usuario.id, completado: true },
    }),
  ]);
  const completadosSet = new Set(progresos.map((p) => p.itemId));
  const total = items.length;
  const completados = items.filter((i) => completadosSet.has(i.id)).length;

  return res.json({
    completado,
    completados,
    total,
    pct: total ? Math.round((completados / total) * 100) : 0,
  });
};

exports.guardarNotas = async (req, res) => {
  const comentarios = typeof req.body.comentarios === 'string' ? req.body.comentarios : '';
  const temasPuesto = typeof req.body.temasPuesto === 'string' ? req.body.temasPuesto : '';
  const u = await prisma.usuario.update({
    where: { id: req.usuario.id },
    data: { comentariosInduccionPuesto: comentarios, temasPuesto },
    select: { comentariosInduccionPuesto: true, temasPuesto: true },
  });
  return res.json({
    comentarios: u.comentariosInduccionPuesto || '',
    temasPuesto: u.temasPuesto || '',
  });
};

exports.crearItem = async (req, res) => {
  const { titulo, orden } = req.body;
  if (!titulo?.trim()) {
    return Errores.validacion(res, [{ campo: 'titulo', mensaje: 'El título es obligatorio.' }]);
  }
  const maxOrden = await prisma.checklistPuestoItem.aggregate({ _max: { orden: true } });
  const item = await prisma.checklistPuestoItem.create({
    data: {
      titulo: titulo.trim(),
      orden: orden ?? (maxOrden._max.orden ?? 0) + 1,
    },
  });
  return res.status(201).json(item);
};

exports.actualizarItem = async (req, res) => {
  const data = {};
  if (req.body.titulo !== undefined) data.titulo = String(req.body.titulo).trim();
  if (req.body.orden !== undefined) data.orden = req.body.orden;
  if (req.body.activo !== undefined) data.activo = !!req.body.activo;
  try {
    const item = await prisma.checklistPuestoItem.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(item);
  } catch {
    return Errores.noEncontrado(res, 'Actividad');
  }
};

exports.eliminarItem = async (req, res) => {
  try {
    await prisma.checklistPuestoProgreso.deleteMany({ where: { itemId: req.params.id } });
    await prisma.checklistPuestoItem.delete({ where: { id: req.params.id } });
    return res.json({ ok: true });
  } catch {
    return Errores.noEncontrado(res, 'Actividad');
  }
};
