const prisma = require('../config/db');

async function auditar({ usuarioId = null, accion, detalle = null, ip = null }) {
  try {
    await prisma.logAuditoria.create({
      data: { usuarioId, accion, detalle, ip },
    });
  } catch (e) {
    console.error('Error guardando log de auditoría:', e.message);
  }
}

module.exports = { auditar };
