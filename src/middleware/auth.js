const { verificarToken } = require('../utils/jwt');
const { Errores } = require('../utils/errores');
const prisma = require('../config/db');

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return Errores.tokenInvalido(res);

    let payload;
    try {
      payload = verificarToken(token);
    } catch (e) {
      if (e.name === 'TokenExpiredError') return Errores.tokenExpirado(res);
      return Errores.tokenInvalido(res);
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!usuario || !usuario.activo) return Errores.tokenInvalido(res);

    req.usuario = usuario;
    next();
  } catch (e) {
    console.error(e);
    return Errores.generico(res);
  }
}

module.exports = { authRequired };
