const prisma = require('../config/db');
const { Errores } = require('../utils/errores');

exports.crear = async (req, res) => {
  const { moduloId, texto } = req.body;
  if (!moduloId || !texto) {
    return Errores.validacion(res, [{ campo: 'texto', mensaje: 'El módulo y el texto son obligatorios.' }]);
  }

  const modulo = await prisma.modulo.findUnique({ where: { id: moduloId } });
  if (!modulo) return Errores.noEncontrado(res, 'Módulo');

  const duda = await prisma.duda.create({
    data: { usuarioId: req.usuario.id, moduloId, texto },
  });
  return res.status(201).json(duda);
};

exports.listar = async (req, res) => {
  const { estado, moduloId } = req.query;
  const where = {};
  if (estado) where.estado = estado;
  if (moduloId) where.moduloId = moduloId;

  const dudas = await prisma.duda.findMany({
    where,
    orderBy: { creadoEn: 'desc' },
    include: {
      usuario: { select: { id: true, nombre: true, nomina: true, area: true, areaId: true } },
      modulo: { select: { id: true, nombre: true, slug: true } },
    },
  });
  return res.json(dudas);
};

exports.responder = async (req, res) => {
  const { respuesta } = req.body;
  if (!respuesta) return Errores.validacion(res, [{ campo: 'respuesta', mensaje: 'La respuesta es obligatoria.' }]);

  try {
    const duda = await prisma.duda.update({
      where: { id: req.params.id },
      data: { respuesta, estado: 'respondida', respondidoEn: new Date() },
    });
    return res.json(duda);
  } catch {
    return Errores.noEncontrado(res, 'Duda');
  }
};
