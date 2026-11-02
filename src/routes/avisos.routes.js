const { Router } = require('express');
const ctrl = require('../controllers/avisos.controller');
const v = require('../validators');
const validar = require('../middleware/validar');
const { proteger } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

/* Lectura abierta: cualquier persona puede consultar los avisos */
router.get('/', v.listarAvisos, validar, asyncHandler(ctrl.listar));
router.get('/:id', v.idValido, validar, asyncHandler(ctrl.obtener));

/* Escritura protegida: requiere iniciar sesión (token JWT) */
router.post('/', proteger, v.crearAviso, validar, asyncHandler(ctrl.crear));
router.put('/:id', proteger, v.actualizarAviso, validar, asyncHandler(ctrl.actualizar));
router.delete('/:id', proteger, v.idValido, validar, asyncHandler(ctrl.eliminar));

module.exports = router;
