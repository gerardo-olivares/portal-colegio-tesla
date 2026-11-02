/**
 * Envuelve un controlador async y pasa cualquier error a next(),
 * para que llegue al middleware de errores en lugar de tumbar el servidor.
 * (Equivale a escribir try/catch + next(err) en cada ruta.)
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
