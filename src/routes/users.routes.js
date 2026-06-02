const express = require('express');
const ctrl = require('../controllers/users.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired, requireRol('admin'));

router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.get('/:id/reporte', ctrl.reporte);
router.get('/:id/evidencia/pdf', ctrl.evidenciaPdf);
router.get('/:id/evidencia', ctrl.evidencia);
router.get('/:id', ctrl.detalle);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.desactivar);
router.post('/:id/reset-password', ctrl.resetPassword);

module.exports = router;
