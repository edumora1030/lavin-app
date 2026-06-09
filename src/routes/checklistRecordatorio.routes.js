const express = require('express');
const ctrl = require('../controllers/checklistRecordatorio.controller');
const { authRequired } = require('../middleware/auth');
const { requireRol } = require('../middleware/roles');

const router = express.Router();
router.use(authRequired);

router.get('/mi-progreso', requireRol('empleado', 'admin'), ctrl.miProgreso);
router.post('/toggle', requireRol('empleado'), ctrl.toggleItem);

module.exports = router;
