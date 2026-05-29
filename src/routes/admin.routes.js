const express = require('express');
const ctrl = require('../controllers/admin.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired, requireRol('admin'));

router.get('/dashboard', ctrl.dashboard);
router.get('/reportes/empleados', ctrl.reporteEmpleados);
router.get('/reportes/examenes', ctrl.reporteExamenes);

module.exports = router;
