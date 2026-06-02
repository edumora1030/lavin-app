const express = require('express');
const ctrl = require('../controllers/notificaciones.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/mias', requireRol('empleado'), ctrl.misSolicitudes);
router.post('/solicitar', requireRol('empleado'), ctrl.solicitar);
router.get('/pendientes/count', requireRol('admin'), ctrl.contarPendientes);
router.get('/', requireRol('admin'), ctrl.listar);
router.put('/:id/atender', requireRol('admin'), ctrl.atender);

module.exports = router;
