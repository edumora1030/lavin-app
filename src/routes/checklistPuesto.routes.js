const express = require('express');
const ctrl = require('../controllers/checklistPuesto.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/items', ctrl.listarItems);
router.get('/mi-progreso', requireRol('empleado', 'admin'), ctrl.miProgreso);
router.post('/toggle', requireRol('empleado'), ctrl.toggleItem);
router.put('/notas', requireRol('empleado'), ctrl.guardarNotas);

router.post('/items', requireRol('admin'), ctrl.crearItem);
router.put('/items/:id', requireRol('admin'), ctrl.actualizarItem);
router.delete('/items/:id', requireRol('admin'), ctrl.eliminarItem);

module.exports = router;
