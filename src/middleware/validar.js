const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware de validación personalizado.
 * Se coloca después de las reglas de express-validator: si alguna regla
 * falló, responde 400 con la lista de errores por campo.
 */
const validar = (req, _res, next) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();

  const detalles = resultado.array().map(({ path, msg }) => ({ campo: path, mensaje: msg }));
  next(ApiError.badRequest('Los datos enviados no son válidos.', detalles));
};

module.exports = validar;
