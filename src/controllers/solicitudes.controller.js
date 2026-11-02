const Solicitud = require('../models/Solicitud');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/solicitudes   (pública)
 * La usan los padres desde el formulario de contacto del sitio.
 */
const crear = async (req, res) => {
  const { nombre, email, telefono, nivel, mensaje } = req.body;
  const solicitud = await Solicitud.create({ nombre, email, telefono, nivel, mensaje });
  res.status(201).json({
    ok: true,
    data: { id: solicitud.id },
    mensaje: '¡Gracias! Recibimos tu solicitud y te contactaremos pronto.',
  });
};

/**
 * GET /api/solicitudes   (protegida)
 * Filtro opcional: ?estado=nueva
 */
const listar = async (req, res) => {
  const filtro = req.query.estado ? { estado: req.query.estado } : {};
  const [solicitudes, nuevas] = await Promise.all([
    Solicitud.find(filtro).sort({ createdAt: -1 }),
    Solicitud.countDocuments({ estado: 'nueva' }),
  ]);
  res.json({ ok: true, data: solicitudes, resumen: { total: solicitudes.length, nuevas } });
};

/**
 * PATCH /api/solicitudes/:id   (protegida)
 * Cambia el estado: nueva -> contactada -> cerrada
 */
const actualizarEstado = async (req, res) => {
  const solicitud = await Solicitud.findByIdAndUpdate(
    req.params.id,
    { estado: req.body.estado },
    { returnDocument: 'after', runValidators: true }
  );
  if (!solicitud) throw ApiError.notFound('La solicitud no existe.');
  res.json({ ok: true, data: solicitud });
};

/**
 * DELETE /api/solicitudes/:id   (protegida)
 */
const eliminar = async (req, res) => {
  const solicitud = await Solicitud.findByIdAndDelete(req.params.id);
  if (!solicitud) throw ApiError.notFound('La solicitud no existe.');
  res.json({ ok: true, data: { id: solicitud.id }, mensaje: 'Solicitud eliminada.' });
};

module.exports = { crear, listar, actualizarEstado, eliminar };
