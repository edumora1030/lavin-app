const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/ingreso', [
  body('nomina').trim().notEmpty().withMessage('Nómina requerida.'),
  body('password').optional(),
], ctrl.ingreso);

router.post('/establecer-password', [
  body('nomina').trim().notEmpty(),
  body('passwordNueva').isLength({ min: 8 }),
], ctrl.establecerPassword);

router.post('/login', [
  body('nomina').trim().notEmpty().withMessage('Nómina requerida.'),
  body('password').notEmpty().withMessage('Contraseña requerida.'),
], ctrl.login);

router.post('/cambiar-password', authRequired, [
  body('passwordActual').notEmpty(),
  body('passwordNueva').isLength({ min: 8 }),
], ctrl.cambiarPassword);

router.get('/me', authRequired, ctrl.me);
router.put('/me', authRequired, ctrl.actualizarPerfil);

module.exports = router;
