const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../config/db');
const { errorResponse, Errores } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');
const {
  obtenerEvidenciaInduccion,
  esInduccionEmpresaCompleta,
  esInduccionPuestoCompleta,
} = require('../utils/evidenciaInduccion');
const { generarPdfEvidencia } = require('../utils/generarPdfEvidencia');

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

  const esEmpleado = rol === 'empleado';
  const passwordPlano = esEmpleado ? null : passwordInicial(nomina);
  const hash = esEmpleado
    ? await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
    : await bcrypt.hash(passwordPlano, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nombre, nomina, email, rol, programa, alcance, area, areaId,
      induccionEmpresaHabilitada: induccionEmpresaHabilitada ?? false,
      induccionPuestoHabilitada: induccionPuestoHabilitada ?? false,
      password: hash,
      creadoPor: req.usuario.id,
      primerLogin: esEmpleado,
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

exports.eliminar = async (req, res) => {
  const { id } = req.params;

  if (id === req.usuario.id) {
    return errorResponse(res, 400, 'ELIMINACION_NO_PERMITIDA', 'No puedes eliminar tu propia cuenta.');
  }

  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u) return Errores.noEncontrado(res, 'Usuario');

  if (u.rol === 'admin') {
    const otrosAdmins = await prisma.usuario.count({
      where: { rol: 'admin', activo: true, id: { not: id } },
    });
    if (otrosAdmins === 0) {
      return errorResponse(res, 400, 'ELIMINACION_NO_PERMITIDA', 'No puedes eliminar el último administrador activo.');
    }
  }

  try {
    await prisma.$transaction([
      prisma.usuario.updateMany({ where: { creadoPor: id }, data: { creadoPor: null } }),
      prisma.video.updateMany({ where: { subidoPor: id }, data: { subidoPor: req.usuario.id } }),
      prisma.usuario.delete({ where: { id } }),
    ]);
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    return errorResponse(res, 500, 'ERROR_ELIMINACION', 'No se pudo eliminar el usuario.');
  }

  await auditar({
    usuarioId: req.usuario.id,
    accion: 'usuario_eliminado',
    detalle: { id, nomina: u.nomina, nombre: u.nombre },
  });
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

exports.evidencia = async (req, res) => {
  const data = await obtenerEvidenciaInduccion(req.params.id);
  if (!data) return Errores.noEncontrado(res, 'Usuario');
  return res.json(data);
};

async function enviarPdfEvidencia(req, res, tipo) {
  try {
    const data = await obtenerEvidenciaInduccion(req.params.id);
    if (!data) return Errores.noEncontrado(res, 'Usuario');

    const completa = tipo === 'empresa'
      ? esInduccionEmpresaCompleta(data)
      : esInduccionPuestoCompleta(data);

    if (!completa) {
      const mensaje = tipo === 'empresa'
        ? 'La hoja de evidencia de empresa solo está disponible cuando el colaborador completó la inducción a la empresa.'
        : 'La hoja de evidencia de puesto solo está disponible cuando el colaborador completó la inducción al puesto.';
      return res.status(422).json({
        error: true,
        codigo: 'INDUCCION_INCOMPLETA',
        mensaje,
        status: 422,
      });
    }

    const pdf = await generarPdfEvidencia(data, tipo);
    const suffix = tipo === 'empresa' ? 'empresa' : 'puesto';
    const filename = `evidencia-induccion-${suffix}-${data.empleado.nomina}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    console.error(`Error generando PDF de evidencia (${tipo}):`, err);
    return res.status(500).json({
      error: true,
      codigo: 'PDF_ERROR',
      mensaje: 'No se pudo generar el PDF de evidencia.',
      status: 500,
    });
  }
}

exports.evidenciaPdfEmpresa = (req, res) => enviarPdfEvidencia(req, res, 'empresa');
exports.evidenciaPdfPuesto = (req, res) => enviarPdfEvidencia(req, res, 'puesto');
