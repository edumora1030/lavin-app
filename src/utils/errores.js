// Respuestas de error consistentes
function errorResponse(res, status, codigo, mensaje, extra = {}) {
  return res.status(status).json({
    error: true,
    codigo,
    mensaje,
    status,
    ...extra,
  });
}

const Errores = {
  tokenInvalido: (res) => errorResponse(res, 401, 'TOKEN_INVALIDO', 'Token inválido.'),
  tokenExpirado: (res) => errorResponse(res, 401, 'TOKEN_EXPIRADO', 'Tu sesión ha expirado. Vuelve a iniciar sesión.'),
  sinPermiso: (res) => errorResponse(res, 403, 'SIN_PERMISO', 'No tienes permiso para realizar esta acción.'),
  noEncontrado: (res, recurso = 'Recurso') => errorResponse(res, 404, 'NO_ENCONTRADO', `${recurso} no encontrado.`),
  validacion: (res, campos) => errorResponse(res, 422, 'VALIDACION_FALLIDA', 'Datos inválidos.', { campos }),
  credenciales: (res) => errorResponse(res, 401, 'CREDENCIALES_INCORRECTAS', 'Nómina o contraseña incorrectas.'),
  intentosAgotados: (res) => errorResponse(res, 409, 'INTENTOS_AGOTADOS', 'Se agotaron los intentos disponibles para este examen. Contacta a RR.HH.'),
  archivoGrande: (res) => errorResponse(res, 413, 'ARCHIVO_DEMASIADO_GRANDE', 'El archivo excede el tamaño máximo permitido.'),
  formato: (res) => errorResponse(res, 415, 'FORMATO_NO_PERMITIDO', 'Formato de archivo no permitido.'),
  generico: (res, mensaje = 'Error interno del servidor.') => errorResponse(res, 500, 'ERROR_INTERNO', mensaje),
};

module.exports = { errorResponse, Errores };
