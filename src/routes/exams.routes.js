const express = require('express');
const ctrl = require('../controllers/exams.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/:moduloId', ctrl.obtenerPorModulo);
router.post('/:id/iniciar', ctrl.iniciar);
router.post('/:id/enviar', ctrl.enviar);
router.get('/:id/intentos', ctrl.misIntentos);

// Admin
router.post('/', requireRol('admin'), ctrl.crearExamen);
router.put('/:id', requireRol('admin'), ctrl.actualizarExamen);
router.post('/:id/preguntas', requireRol('admin'), ctrl.agregarPregunta);
router.put('/:id/preguntas/:preguntaId', requireRol('admin'), ctrl.actualizarPregunta);
router.delete('/:id/preguntas/:preguntaId', requireRol('admin'), ctrl.eliminarPregunta);

module.exports = router;
