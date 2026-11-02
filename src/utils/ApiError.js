/**
 * Error personalizado con código de estado HTTP.
 * Se lanza desde controladores y middlewares; el errorHandler lo convierte
 * en una respuesta JSON consistente.
 */
class ApiError extends Error {
  constructor(status, mensaje, detalles = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }

  static badRequest(mensaje = 'Solicitud inválida', detalles = null) { return new ApiError(400, mensaje, detalles); }
  static unauthorized(mensaje = 'No autenticado') { return new ApiError(401, mensaje); }
  static forbidden(mensaje = 'No tienes permiso para realizar esta acción') { return new ApiError(403, mensaje); }
  static notFound(mensaje = 'Recurso no encontrado') { return new ApiError(404, mensaje); }
  static conflict(mensaje = 'El recurso ya existe') { return new ApiError(409, mensaje); }
}

module.exports = ApiError;
