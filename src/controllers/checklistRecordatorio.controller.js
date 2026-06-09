const prisma = require('../config/db');
const { Errores } = require('../utils/errores');

async function notificarRecorridoSiAplica(usuarioId, item) {
  if (item.slug !== 'recorrido_planta') return;

  const pendiente = await prisma.notificacionRH.findFirst({
    where: { usuarioId, tipo: 'recorrido_planta', estado: 'pendiente' },
  });
  if (pendiente) return;

  const previa = await prisma.notificacionRH.findFirst({
    where: { usuarioId, tipo: 'recorrido_planta' },
  });
  if (previa) return;

  await prisma.notificacionRH.create({
    data: { usuarioId, tipo: 'recorrido_planta' },
  });
}

exports.miProgreso = async (req, res) => {
  const [items, progresos] = await Promise.all([
    prisma.checklistRecordatorioItem.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
    prisma.checklistRecordatorioProgreso.findMany({
      where: { usuarioId: req.usuario.id, completado: true },
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
    completa: total > 0 && completados >= total,
    pct: total ? Math.round((completados / total) * 100) : 0,
  });
};

exports.toggleItem = async (req, res) => {
  const { itemId, completado } = req.body;
  if (!itemId || typeof completado !== 'boolean') {
    return Errores.validacion(res, [{ campo: 'itemId', mensaje: 'itemId y completado son requeridos.' }]);
  }

  const item = await prisma.checklistRecordatorioItem.findFirst({
    where: { id: itemId, activo: true },
  });
  if (!item) return Errores.noEncontrado(res, 'Recordatorio');

  if (completado) {
    await prisma.checklistRecordatorioProgreso.upsert({
      where: { usuarioId_itemId: { usuarioId: req.usuario.id, itemId } },
      update: { completado: true, fechaCompletado: new Date() },
      create: {
        usuarioId: req.usuario.id,
        itemId,
        completado: true,
        fechaCompletado: new Date(),
      },
    });
    await notificarRecorridoSiAplica(req.usuario.id, item);
  } else {
    await prisma.checklistRecordatorioProgreso.deleteMany({
      where: { usuarioId: req.usuario.id, itemId },
    });
  }

  const [items, progresos] = await Promise.all([
    prisma.checklistRecordatorioItem.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } }),
    prisma.checklistRecordatorioProgreso.findMany({
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
    completa: total > 0 && completados >= total,
    pct: total ? Math.round((completados / total) * 100) : 0,
  });
};
