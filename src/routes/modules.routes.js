const express = require('express');
const ctrl = require('../controllers/modules.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.detalle);

router.post('/', requireRol('admin'), ctrl.crear);
router.put('/:id', requireRol('admin'), ctrl.actualizar);
router.delete('/:id', requireRol('admin'), ctrl.eliminar);
router.post('/:id/items', requireRol('admin'), ctrl.agregarItem);
router.put('/:id/items/:itemId', requireRol('admin'), ctrl.actualizarItem);
router.delete('/:id/items/:itemId', requireRol('admin'), ctrl.eliminarItem);

module.exports = router;
