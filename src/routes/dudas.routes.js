const express = require('express');
const ctrl = require('../controllers/dudas.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.post('/', ctrl.crear);
router.get('/pendientes/count', requireRol('admin'), ctrl.countPendientes);
router.get('/mias', ctrl.listarMias);
router.get('/', requireRol('admin'), ctrl.listar);
router.put('/:id', requireRol('admin'), ctrl.responder);

module.exports = router;
