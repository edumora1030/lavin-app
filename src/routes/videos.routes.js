const express = require('express');
const ctrl = require('../controllers/videos.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/', ctrl.listar);
router.post('/subir', requireRol('admin'), ctrl.uploader.single('archivo'), ctrl.subir);
router.put('/:id', requireRol('admin'), ctrl.actualizar);
router.delete('/:id', requireRol('admin'), ctrl.eliminar);
router.get('/:id/stream', ctrl.stream);

module.exports = router;
