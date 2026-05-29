const prisma = require('../config/db');
const { Errores } = require('../utils/errores');

exports.listarPreguntas = async (req, res) => {
  const preguntas = await prisma.encuestaPregunta.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  });
  return res.json(preguntas);
};

exports.listarTodasPreguntas = async (req, res) => {
  const preguntas = await prisma.encuestaPregunta.findMany({ orderBy: { orden: 'asc' } });
  return res.json(preguntas);
};

exports.crearPregunta = async (req, res) => {
  const { texto, orden } = req.body;
  if (!texto) return Errores.validacion(res, [{ campo: 'texto', mensaje: 'El texto es obligatorio.' }]);

  const maxOrden = await prisma.encuestaPregunta.aggregate({ _max: { orden: true } });
  const pregunta = await prisma.encuestaPregunta.create({
    data: { texto, orden: orden ?? (maxOrden._max.orden || 0) + 1 },
  });
  return res.status(201).json(pregunta);
};

exports.actualizarPregunta = async (req, res) => {
  const { texto, orden, activo } = req.body;
  try {
    const pregunta = await prisma.encuestaPregunta.update({
      where: { id: req.params.id },
      data: { texto, orden, activo },
    });
    return res.json(pregunta);
  } catch {
    return Errores.noEncontrado(res, 'Pregunta');
  }
};

exports.eliminarPregunta = async (req, res) => {
  try {
    await prisma.encuestaPregunta.update({ where: { id: req.params.id }, data: { activo: false } });
    return res.json({ ok: true });
  } catch {
    return Errores.noEncontrado(res, 'Pregunta');
  }
};

exports.enviarRespuestas = async (req, res) => {
  const { respuestas } = req.body;
  if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
    return Errores.validacion(res, [{ campo: 'respuestas', mensaje: 'Se requieren respuestas.' }]);
  }

  const results = [];
  for (const r of respuestas) {
    if (!r.preguntaId || !r.valor) continue;
    const resp = await prisma.encuestaRespuesta.upsert({
      where: { usuarioId_preguntaId: { usuarioId: req.usuario.id, preguntaId: r.preguntaId } },
      update: { valor: r.valor },
      create: { usuarioId: req.usuario.id, preguntaId: r.preguntaId, valor: r.valor },
    });
    results.push(resp);
  }
  return res.json(results);
};

exports.listarRespuestas = async (req, res) => {
  const respuestas = await prisma.encuestaRespuesta.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      usuario: { select: { id: true, nombre: true, nomina: true, area: true } },
      pregunta: { select: { id: true, texto: true, orden: true } },
    },
  });
  return res.json(respuestas);
};
