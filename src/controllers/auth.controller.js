const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../config/db');
const { firmarToken } = require('../utils/jwt');
const { Errores, errorResponse } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');

function serializarUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    nomina: usuario.nomina,
    email: usuario.email,
    rol: usuario.rol,
    primerLogin: usuario.primerLogin,
    programa: usuario.programa,
    alcance: usuario.alcance,
    area: usuario.area,
    areaId: usuario.areaId,
    induccionEmpresaHabilitada: usuario.induccionEmpresaHabilitada,
    induccionPuestoHabilitada: usuario.induccionPuestoHabilitada,
  };
}

async function emitirSesion(res, usuario, req) {
  const token = firmarToken({ sub: usuario.id, rol: usuario.rol });
  await auditar({ usuarioId: usuario.id, accion: 'login_exitoso', ip: req.ip });
  return res.json({ token, usuario: serializarUsuario(usuario) });
}

exports.ingreso = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return Errores.validacion(res, errors.array().map(e => ({ campo: e.path, mensaje: e.msg })));

  const nomina = String(req.body.nomina).trim();
  const password = req.body.password;
  let usuario = await prisma.usuario.findUnique({ where: { nomina } });

  if (usuario && !usuario.activo) {
    await auditar({ accion: 'login_fallido', detalle: { nomina }, ip: req.ip });
    return Errores.credenciales(res);
  }

  const requierePassword = usuario && (usuario.rol === 'admin' || usuario.rol === 'supervisor');

  if (requierePassword) {
    if (!password) {
      return errorResponse(res, 401, 'REQUIERE_PASSWORD', 'Esta cuenta requiere contraseña.', { rol: usuario.rol });
    }
    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) {
      await auditar({ usuarioId: usuario.id, accion: 'login_fallido', detalle: { nomina }, ip: req.ip });
      return Errores.credenciales(res);
    }
    return emitirSesion(res, usuario, req);
  }

  if (!usuario) {
    const hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    usuario = await prisma.usuario.create({
      data: {
        nombre: `Colaborador ${nomina}`,
        nomina,
        password: hash,
        rol: 'empleado',
        primerLogin: true,
        activo: true,
      },
    });
    await auditar({ usuarioId: usuario.id, accion: 'usuario_auto_creado', detalle: { nomina }, ip: req.ip });
  }

  if (usuario.rol === 'empleado' && usuario.primerLogin) {
    return errorResponse(res, 401, 'REQUIERE_ESTABLECER_PASSWORD', 'Debes establecer tu contraseña.', {
      nomina: usuario.nomina,
      nombre: usuario.nombre,
    });
  }

  if (usuario.rol === 'empleado') {
    if (!password) {
      return errorResponse(res, 401, 'REQUIERE_PASSWORD', 'Ingresa tu contraseña.', { rol: 'empleado' });
    }
    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) {
      await auditar({ usuarioId: usuario.id, accion: 'login_fallido', detalle: { nomina }, ip: req.ip });
      return Errores.credenciales(res);
    }
    return emitirSesion(res, usuario, req);
  }

  return emitirSesion(res, usuario, req);
};

exports.establecerPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return Errores.validacion(res, errors.array().map((e) => ({ campo: e.path, mensaje: e.msg })));

  const nomina = String(req.body.nomina).trim();
  const { passwordNueva } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { nomina } });

  if (!usuario || !usuario.activo || usuario.rol !== 'empleado') {
    return Errores.credenciales(res);
  }

  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(passwordNueva)) {
    return Errores.validacion(res, [{
      campo: 'passwordNueva',
      mensaje: 'Mínimo 8 caracteres, una mayúscula y un número.',
    }]);
  }

  const hash = await bcrypt.hash(passwordNueva, 10);
  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { password: hash, primerLogin: false },
  });

  await auditar({ usuarioId: usuario.id, accion: 'password_establecida', ip: req.ip });
  return emitirSesion(res, actualizado, req);
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return Errores.validacion(res, errors.array().map(e => ({ campo: e.path, mensaje: e.msg })));

  const { nomina, password } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { nomina: String(nomina).trim() } });

  if (!usuario || !usuario.activo) {
    await auditar({ accion: 'login_fallido', detalle: { nomina }, ip: req.ip });
    return Errores.credenciales(res);
  }

  const ok = await bcrypt.compare(password, usuario.password);
  if (!ok) {
    await auditar({ usuarioId: usuario.id, accion: 'login_fallido', detalle: { nomina }, ip: req.ip });
    return Errores.credenciales(res);
  }

  const token = firmarToken({ sub: usuario.id, rol: usuario.rol });
  await auditar({ usuarioId: usuario.id, accion: 'login_exitoso', ip: req.ip });

  return res.json({ token, usuario: serializarUsuario(usuario) });
};

exports.cambiarPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return Errores.validacion(res, errors.array().map(e => ({ campo: e.path, mensaje: e.msg })));

  const { passwordActual, passwordNueva } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });

  const ok = await bcrypt.compare(passwordActual, usuario.password);
  if (!ok) return Errores.credenciales(res);

  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(passwordNueva)) {
    return Errores.validacion(res, [{ campo: 'passwordNueva', mensaje: 'Mínimo 8 caracteres, una mayúscula y un número.' }]);
  }

  const hash = await bcrypt.hash(passwordNueva, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { password: hash, primerLogin: false },
  });

  await auditar({ usuarioId: usuario.id, accion: 'password_cambiada', ip: req.ip });
  return res.json({ ok: true });
};

exports.me = async (req, res) => {
  return res.json(serializarUsuario(req.usuario));
};

exports.actualizarPerfil = async (req, res) => {
  const { programa, alcance } = req.body;
  if (programa && !['administrativo', 'operativo'].includes(programa)) return Errores.validacion(res, [{ campo: 'programa', mensaje: 'Inválido.' }]);
  if (alcance && !['empresa', 'puesto'].includes(alcance)) return Errores.validacion(res, [{ campo: 'alcance', mensaje: 'Inválido.' }]);

  const usuario = await prisma.usuario.update({
    where: { id: req.usuario.id },
    data: { programa: programa || req.usuario.programa, alcance: alcance || req.usuario.alcance },
  });
  return res.json({ ok: true, usuario: { programa: usuario.programa, alcance: usuario.alcance } });
};
