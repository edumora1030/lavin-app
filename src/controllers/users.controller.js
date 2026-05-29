const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { Errores } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');

function passwordInicial(nomina) {
  const ult4 = String(nomina).slice(-4).padStart(4, '0');
  return `${ult4}Lavin2024`;
}

function sanitizar(u) {
  if (!u) return null;
  const { password, ...resto } = u;
  return resto;
}

exports.listar = async (req, res) => {
  const { rol, activo, programa, q } = req.query;
  const where = {};
  if (rol) where.rol = rol;
  if (typeof activo !== 'undefined') where.activo = activo === 'true';
  if (programa) where.programa = programa;
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: 'insensitive' } },
      { nomina: { contains: q, mode: 'insensitive' } },
    ];
  }
  const usuarios = await prisma.usuario.findMany({ where, orderBy: { creadoEn: 'desc' } });
  return res.json(usuarios.map(sanitizar));
};

exports.crear = async (req, res) => {
  const { nombre, nomina, email, rol = 'empleado', programa, alcance, area, areaId, induccionEmpresaHabilitada, induccionPuestoHabilitada } = req.body;
  if (!nombre || !nomina) return Errores.validacion(res, [{ campo: 'nomina', mensaje: 'Nombre y nómina son obligatorios.' }]);

  const existe = await prisma.usuario.findUnique({ where: { nomina } });
  if (existe) return Errores.validacion(res, [{ campo: 'nomina', mensaje: 'La nómina ya está registrada.' }]);

  const hash = await bcrypt.hash(passwordInicial(nomina), 10);
  const usuario = await prisma.usuario.create({
    data: {
      nombre, nomina, email, rol, programa, alcance, area, areaId,
      induccionEmpresaHabilitada: induccionEmpresaHabilitada ?? false,
      induccionPuestoHabilitada: induccionPuestoHabilitada ?? false,
      password: hash, creadoPor: req.usuario.id, primerLogin: true,
    },
  });

  await auditar({ usuarioId: req.usuario.id, accion: 'usuario_creado', detalle: { creado: usuario.id, nomina } });
  return res.status(201).json(sanitizar(usuario));
};

exports.detalle = async (req, res) => {
  const u = await prisma.usuario.findUnique({ where: { id: req.params.id } });
  if (!u) return Errores.noEncontrado(res, 'Usuario');
  return res.json(sanitizar(u));
};

exports.actualizar = async (req, res) => {
  const { nombre, email, rol, programa, alcance, area, areaId, activo, induccionEmpresaHabilitada, induccionPuestoHabilitada } = req.body;
  try {
    const u = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { nombre, email, rol, programa, alcance, area, areaId, activo, induccionEmpresaHabilitada, induccionPuestoHabilitada },
    });
    await auditar({ usuarioId: req.usuario.id, accion: 'usuario_actualizado', detalle: { id: u.id } });
    return res.json(sanitizar(u));
  } catch (e) {
    return Errores.noEncontrado(res, 'Usuario');
  }
};

exports.desactivar = async (req, res) => {
  await prisma.usuario.update({ where: { id: req.params.id }, data: { activo: false } });
  await auditar({ usuarioId: req.usuario.id, accion: 'usuario_desactivado', detalle: { id: req.params.id } });
  return res.json({ ok: true });
};

exports.resetPassword = async (req, res) => {
  const u = await prisma.usuario.findUnique({ where: { id: req.params.id } });
  if (!u) return Errores.noEncontrado(res, 'Usuario');
  const hash = await bcrypt.hash(passwordInicial(u.nomina), 10);
  await prisma.usuario.update({ where: { id: u.id }, data: { password: hash, primerLogin: true } });
  await auditar({ usuarioId: req.usuario.id, accion: 'password_reseteada', detalle: { id: u.id } });
  return res.json({ ok: true, mensaje: 'Contraseña restablecida al valor inicial.' });
};

exports.reporte = async (req, res) => {
  const u = await prisma.usuario.findUnique({
    where: { id: req.params.id },
    include: {
      progresos: { include: { modulo: true, item: true } },
      intentos: { include: { examen: { include: { modulo: true } } }, orderBy: { iniciadoEn: 'desc' } },
    },
  });
  if (!u) return Errores.noEncontrado(res, 'Usuario');
  return res.json(sanitizar(u));
};
