const prisma = require('../config/db');
const { Errores } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

exports.obtenerPorModulo = async (req, res) => {
  const examen = await prisma.examen.findFirst({
    where: { moduloId: req.params.moduloId, activo: true },
    include: { preguntas: { where: { activo: true }, include: { opciones: true } } },
  });
  if (!examen) return Errores.noEncontrado(res, 'Examen');

  const intentosUsados = await prisma.intentoExamen.count({
    where: { usuarioId: req.usuario.id, examenId: examen.id, finalizadoEn: { not: null } },
  });
  const aprobado = await prisma.intentoExamen.findFirst({
    where: { usuarioId: req.usuario.id, examenId: examen.id, aprobado: true },
  });

  const preguntasMezcladas = shuffle(examen.preguntas).map(p => ({
    id: p.id,
    texto: p.texto,
    tipo: p.tipo,
    opciones: shuffle(p.opciones).map(o => ({ id: o.id, texto: o.texto })),
  }));

  return res.json({
    id: examen.id,
    titulo: examen.titulo,
    descripcion: examen.descripcion,
    intentosPermitidos: examen.intentosPermitidos,
    intentosUsados,
    intentosRestantes: Math.max(0, examen.intentosPermitidos - intentosUsados),
    calificacionMinima: examen.calificacionMinima,
    yaAprobado: !!aprobado,
    preguntas: preguntasMezcladas,
  });
};

exports.iniciar = async (req, res) => {
  const examen = await prisma.examen.findUnique({ where: { id: req.params.id } });
  if (!examen) return Errores.noEncontrado(res, 'Examen');

  const intentosUsados = await prisma.intentoExamen.count({
    where: { usuarioId: req.usuario.id, examenId: examen.id, finalizadoEn: { not: null } },
  });
  if (intentosUsados >= examen.intentosPermitidos) return Errores.intentosAgotados(res);

  const intento = await prisma.intentoExamen.create({
    data: { usuarioId: req.usuario.id, examenId: examen.id, respuestas: {} },
  });
  return res.status(201).json({ intentoId: intento.id, iniciadoEn: intento.iniciadoEn });
};

exports.enviar = async (req, res) => {
  const { intentoId, respuestas } = req.body;
  const examen = await prisma.examen.findUnique({
    where: { id: req.params.id },
    include: { preguntas: { include: { opciones: true } } },
  });
  if (!examen) return Errores.noEncontrado(res, 'Examen');

  const intento = await prisma.intentoExamen.findUnique({ where: { id: intentoId } });
  if (!intento || intento.usuarioId !== req.usuario.id) return Errores.noEncontrado(res, 'Intento');
  if (intento.finalizadoEn) return Errores.validacion(res, [{ campo: 'intento', mensaje: 'Intento ya finalizado.' }]);

  const total = examen.preguntas.length;
  let correctas = 0;
  const detalle = examen.preguntas.map(p => {
    const opcionMarcada = respuestas[p.id];
    const opcionCorrecta = p.opciones.find(o => o.esCorrecta);
    const esCorrecta = opcionMarcada === opcionCorrecta?.id;
    if (esCorrecta) correctas++;
    return { preguntaId: p.id, opcionMarcada, opcionCorrectaId: opcionCorrecta?.id, esCorrecta };
  });

  const calificacion = total === 0 ? 0 : Math.round((correctas / total) * 100);
  const aprobado = calificacion >= examen.calificacionMinima;
  const ahora = new Date();
  const duracion = Math.round((ahora - new Date(intento.iniciadoEn)) / 1000);

  await prisma.intentoExamen.update({
    where: { id: intento.id },
    data: { respuestas, calificacion, aprobado, finalizadoEn: ahora, duracionSegundos: duracion },
  });

  await auditar({
    usuarioId: req.usuario.id,
    accion: aprobado ? 'examen_aprobado' : 'examen_reprobado',
    detalle: { examenId: examen.id, calificacion },
  });

  return res.json({ calificacion, aprobado, correctas, total, calificacionMinima: examen.calificacionMinima, detalle });
};

exports.misIntentos = async (req, res) => {
  const intentos = await prisma.intentoExamen.findMany({
    where: { usuarioId: req.usuario.id, examenId: req.params.id },
    orderBy: { iniciadoEn: 'desc' },
    select: { id: true, calificacion: true, aprobado: true, iniciadoEn: true, finalizadoEn: true, duracionSegundos: true },
  });
  return res.json(intentos);
};

// === ADMIN ===
exports.crearExamen = async (req, res) => {
  const e = await prisma.examen.create({ data: req.body });
  return res.status(201).json(e);
};

exports.actualizarExamen = async (req, res) => {
  try {
    const e = await prisma.examen.update({ where: { id: req.params.id }, data: req.body });
    return res.json(e);
  } catch { return Errores.noEncontrado(res, 'Examen'); }
};

exports.agregarPregunta = async (req, res) => {
  const { texto, tipo, orden, opciones } = req.body;
  const pregunta = await prisma.pregunta.create({
    data: {
      examenId: req.params.id, texto, tipo: tipo || 'opcion_multiple', orden: orden || 0,
      opciones: { create: (opciones || []).map((o, i) => ({ texto: o.texto, esCorrecta: !!o.esCorrecta, orden: o.orden ?? i })) },
    },
    include: { opciones: true },
  });
  return res.status(201).json(pregunta);
};

exports.actualizarPregunta = async (req, res) => {
  const { texto, tipo, orden, activo, opciones } = req.body;
  try {
    await prisma.pregunta.update({
      where: { id: req.params.preguntaId },
      data: { texto, tipo, orden, activo },
    });
    if (Array.isArray(opciones)) {
      await prisma.opcionPregunta.deleteMany({ where: { preguntaId: req.params.preguntaId } });
      await prisma.opcionPregunta.createMany({
        data: opciones.map((o, i) => ({ preguntaId: req.params.preguntaId, texto: o.texto, esCorrecta: !!o.esCorrecta, orden: o.orden ?? i })),
      });
    }
    const pregunta = await prisma.pregunta.findUnique({ where: { id: req.params.preguntaId }, include: { opciones: true } });
    return res.json(pregunta);
  } catch (e) {
    console.error(e);
    return Errores.noEncontrado(res, 'Pregunta');
  }
};

exports.eliminarPregunta = async (req, res) => {
  try {
    await prisma.pregunta.delete({ where: { id: req.params.preguntaId } });
    return res.json({ ok: true });
  } catch { return Errores.noEncontrado(res, 'Pregunta'); }
};
