const express = require('express');
const ctrl = require('../controllers/encuesta.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/preguntas', ctrl.listarPreguntas);
router.get('/preguntas/admin', requireRol('admin'), ctrl.listarTodasPreguntas);
router.post('/preguntas', requireRol('admin'), ctrl.crearPregunta);
router.put('/preguntas/:id', requireRol('admin'), ctrl.actualizarPregunta);
router.delete('/preguntas/:id', requireRol('admin'), ctrl.eliminarPregunta);

router.post('/respuestas', ctrl.enviarRespuestas);
router.get('/respuestas', requireRol('admin'), ctrl.listarRespuestas);

module.exports = router;
