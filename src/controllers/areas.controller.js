const prisma = require('../config/db');
const { Errores } = require('../utils/errores');

exports.listar = async (req, res) => {
  const areas = await prisma.area.findMany({ orderBy: { nombre: 'asc' } });
  return res.json(areas);
};

exports.crear = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return Errores.validacion(res, [{ campo: 'nombre', mensaje: 'El nombre es obligatorio.' }]);

  const existe = await prisma.area.findUnique({ where: { nombre } });
  if (existe) return Errores.validacion(res, [{ campo: 'nombre', mensaje: 'Ya existe un área con ese nombre.' }]);

  const area = await prisma.area.create({ data: { nombre } });
  return res.status(201).json(area);
};

exports.actualizar = async (req, res) => {
  const { nombre, activo } = req.body;
  try {
    const area = await prisma.area.update({ where: { id: req.params.id }, data: { nombre, activo } });
    return res.json(area);
  } catch {
    return Errores.noEncontrado(res, 'Área');
  }
};

exports.eliminar = async (req, res) => {
  try {
    await prisma.area.update({ where: { id: req.params.id }, data: { activo: false } });
    return res.json({ ok: true });
  } catch {
    return Errores.noEncontrado(res, 'Área');
  }
};
