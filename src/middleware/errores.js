const ApiError = require('../utils/ApiError');
const { esProduccion } = require('../config/env');

/**
 * 404: se ejecuta cuando ninguna ruta coincidió.
 * Para rutas /api responde JSON; para el resto, deja que el
 * frontend muestre su página (no existe aquí, así que también JSON).
 */
const rutaNoEncontrada = (req, _res, next) => {
  next(ApiError.notFound(`La ruta ${req.method} ${req.originalUrl} no existe.`));
};

/**
 * Middleware central de manejo de errores (4 parámetros).
 * Debe registrarse al final de la cadena de middlewares.
 * Traduce errores de Mongoose, JWT y JSON a respuestas claras.
 */
// eslint-disable-next-line no-unused-vars
const manejadorErrores = (err, req, res, next) => {
  // Si ya se enviaron los encabezados, delegar al manejador por defecto
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let mensaje = err.message || 'Error interno del servidor';
  let detalles = err.detalles || null;

  if (err instanceof ApiError) {
    // ya trae status y mensaje
  } else if (err.name === 'TokenExpiredError') {
    status = 401; mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401; mensaje = 'Token inválido.';
  } else if (err.name === 'CastError') {
    status = 400; mensaje = `El identificador "${err.value}" no es válido.`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    mensaje = 'Los datos enviados no son válidos.';
    detalles = Object.values(err.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    const campo = Object.keys(err.keyValue || {})[0] || 'campo';
    mensaje = `Ya existe un registro con ese ${campo}.`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400; mensaje = 'El cuerpo de la petición no es un JSON válido.';
  }

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.error(err.stack);
    if (esProduccion) mensaje = 'Error interno del servidor';
  }

  res.status(status).json({
    ok: false,
    error: { status, mensaje, ...(detalles && { detalles }) },
  });
};

module.exports = { rutaNoEncontrada, manejadorErrores };
