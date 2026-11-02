const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const Usuario = require('../models/Usuario');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware de autenticación.
 * Lee el token del encabezado:  Authorization: Bearer <token>
 * Si es válido, agrega el usuario a req.usuario y continúa.
 */
const proteger = asyncHandler(async (req, _res, next) => {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Debes iniciar sesión para realizar esta acción.');
  }

  // jwt.verify lanza TokenExpiredError o JsonWebTokenError si el token no es válido;
  // el errorHandler los convierte en respuestas 401 claras.
  const payload = jwt.verify(token, jwtSecret);

  const usuario = await Usuario.findById(payload.sub);
  if (!usuario || !usuario.activo) {
    throw ApiError.unauthorized('El usuario del token ya no existe o está desactivado.');
  }

  req.usuario = usuario;
  next();
});

/**
 * Middleware de autorización por rol.
 * Uso: router.post('/', proteger, permitir('admin'), controlador)
 */
const permitir = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    return next(ApiError.forbidden());
  }
  next();
};

module.exports = { proteger, permitir };
