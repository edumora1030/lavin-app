const express = require('express');
const ctrl = require('../controllers/progress.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/', ctrl.miProgreso);
router.post('/item', ctrl.marcarItem);
router.post('/modulo', ctrl.finalizarModulo);
router.post('/recorrido', ctrl.recorridoPlanta);
router.get('/resumen', requireRol('admin', 'supervisor'), ctrl.resumen);
router.get('/resumen/csv', requireRol('admin', 'supervisor'), ctrl.resumenCsv);

module.exports = router;
