const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/solicitudes.controller');
const v = require('../validators');
const validar = require('../middleware/validar');
const { proteger } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// Evita que alguien inunde el formulario público con solicitudes falsas
const limiteEnvios = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: { status: 429, mensaje: 'Has enviado demasiadas solicitudes. Inténtalo más tarde.' } },
});

/* Pública: los padres envían solicitudes de informes */
router.post('/', limiteEnvios, v.crearSolicitud, validar, asyncHandler(ctrl.crear));

/* Protegidas: solo el personal del colegio las consulta y gestiona */
router.get('/', proteger, v.listarSolicitudes, validar, asyncHandler(ctrl.listar));
router.patch('/:id', proteger, v.actualizarEstado, validar, asyncHandler(ctrl.actualizarEstado));
router.delete('/:id', proteger, v.idValido, validar, asyncHandler(ctrl.eliminar));

module.exports = router;
