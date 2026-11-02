const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const v = require('../validators');
const validar = require('../middleware/validar');
const { proteger, permitir } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// Limita los intentos de inicio de sesión para frenar ataques de fuerza bruta
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: { status: 429, mensaje: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' } },
});

router.post('/login', limiteLogin, v.login, validar, asyncHandler(ctrl.login));
router.post('/registro', proteger, permitir('admin'), v.registro, validar, asyncHandler(ctrl.registro));
router.get('/perfil', proteger, ctrl.perfil);

module.exports = router;
