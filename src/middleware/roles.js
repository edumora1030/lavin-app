const { Errores } = require('../utils/errores');

function requireRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return Errores.sinPermiso(res);
    if (!rolesPermitidos.includes(req.usuario.rol)) return Errores.sinPermiso(res);
    next();
  };
}

module.exports = { requireRol };
