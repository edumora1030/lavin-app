const express = require('express');
const ctrl = require('../controllers/users.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired, requireRol('admin'));

router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.get('/:id/reporte', ctrl.reporte);
router.get('/:id/evidencia/pdf/empresa', ctrl.evidenciaPdfEmpresa);
router.get('/:id/evidencia/pdf/puesto', ctrl.evidenciaPdfPuesto);
router.get('/:id/evidencia', ctrl.evidencia);
router.get('/:id', ctrl.detalle);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);
router.post('/:id/reset-password', ctrl.resetPassword);

module.exports = router;
