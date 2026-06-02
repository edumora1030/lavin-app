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

async function nuncaEstablecioPassword(usuarioId) {
  const log = await prisma.logAuditoria.findFirst({
    where: { usuarioId, accion: 'password_establecida' },
  });
  return !log;
}

async function debeCrearPassword(usuario) {
  if (!usuario || usuario.rol !== 'empleado') return false;
  return usuario.primerLogin || (await nuncaEstablecioPassword(usuario.id));
}

async function buscarPorNomina(nomina) {
  return prisma.usuario.findFirst({
    where: { nomina: { equals: nomina, mode: 'insensitive' } },
  });
}

function pareceNominaAdmin(nomina) {
  return /^admin/i.test(String(nomina).trim());
}

async function responderCrearPassword(res, usuario) {
  if (!usuario.primerLogin) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { primerLogin: true },
    });
  }
  return errorResponse(res, 401, 'REQUIERE_ESTABLECER_PASSWORD', 'Debes crear tu contraseña para continuar.', {
    nomina: usuario.nomina,
    nombre: usuario.nombre,
  });
}

exports.ingreso = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return Errores.validacion(res, errors.array().map(e => ({ campo: e.path, mensaje: e.msg })));

  const nomina = String(req.body.nomina).trim();
  const password = req.body.password;
  let usuario = await buscarPorNomina(nomina);

  if (usuario && !usuario.activo) {
    await auditar({ accion: 'login_fallido', detalle: { nomina }, ip: req.ip });
    return Errores.credenciales(res);
  }

  if (usuario && pareceNominaAdmin(nomina) && usuario.rol === 'empleado') {
    await auditar({ accion: 'login_fallido', detalle: { nomina, motivo: 'nomina_admin_incorrecta' }, ip: req.ip });
    return errorResponse(
      res,
      401,
      'CREDENCIALES_INCORRECTAS',
      'Esa nómina no es de administrador. Para RR.HH. usa ADMIN001.',
    );
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
    if (pareceNominaAdmin(nomina)) {
      await auditar({ accion: 'login_fallido', detalle: { nomina }, ip: req.ip });
      return errorResponse(
        res,
        401,
        'CREDENCIALES_INCORRECTAS',
        'Nómina de administrador no encontrada. Usa ADMIN001 (credenciales en README).',
      );
    }
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
    return errorResponse(res, 401, 'REQUIERE_ESTABLECER_PASSWORD', 'Debes crear tu contraseña para continuar.', {
      nomina: usuario.nomina,
      nombre: usuario.nombre,
    });
  }

  if (await debeCrearPassword(usuario)) {
    return responderCrearPassword(res, usuario);
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
  const usuario = await buscarPorNomina(nomina);

  if (!usuario || !usuario.activo || usuario.rol !== 'empleado') {
    return Errores.credenciales(res);
  }

  const puedeEstablecer = usuario.primerLogin || (await nuncaEstablecioPassword(usuario.id));
  if (!puedeEstablecer) {
    return Errores.validacion(res, [{
      campo: 'nomina',
      mensaje: 'Tu contraseña ya fue configurada. Si la olvidaste, contacta a RR.HH.',
    }]);
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
  const usuario = await buscarPorNomina(String(nomina).trim());

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

exports.solicitarRecuperacionPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return Errores.validacion(res, errors.array().map((e) => ({ campo: e.path, mensaje: e.msg })));

  const nomina = String(req.body.nomina).trim();
  const usuario = await buscarPorNomina(nomina);

  const mensajeExito = {
    ok: true,
    mensaje: 'Hemos notificado a RR.HH. Te contactarán para restablecer tu contraseña.',
  };

  if (!usuario || !usuario.activo || usuario.rol !== 'empleado') {
    return res.json(mensajeExito);
  }

  if (await debeCrearPassword(usuario)) {
    return Errores.validacion(res, [{
      campo: 'nomina',
      mensaje: 'Aún no has creado tu contraseña. Usa la opción «¿Es tu primer acceso?» para configurarla.',
    }]);
  }

  const pendiente = await prisma.notificacionRH.findFirst({
    where: { usuarioId: usuario.id, tipo: 'recuperar_password', estado: 'pendiente' },
  });

  if (pendiente) {
    return res.json({ ...mensajeExito, yaEnviada: true });
  }

  await prisma.notificacionRH.create({
    data: { usuarioId: usuario.id, tipo: 'recuperar_password' },
  });

  await auditar({
    usuarioId: usuario.id,
    accion: 'solicitud_recuperar_password',
    detalle: { nomina },
    ip: req.ip,
  });

  return res.status(201).json(mensajeExito);
};
