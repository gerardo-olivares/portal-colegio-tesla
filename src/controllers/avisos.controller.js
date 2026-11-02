const Aviso = require('../models/Aviso');
const ApiError = require('../utils/ApiError');

/* Escapa caracteres especiales para usar texto del usuario en una RegExp */
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/avisos   (pública)
 * Filtros opcionales: ?categoria=primaria&q=junta&pagina=1&limite=10
 */
const listar = async (req, res) => {
  const { categoria, q } = req.query;
  const pagina = req.query.pagina || 1;
  const limite = req.query.limite || 20;

  const filtro = {};
  if (categoria) filtro.categoria = categoria;
  if (q) {
    const regex = new RegExp(escaparRegex(q), 'i');
    filtro.$or = [{ titulo: regex }, { contenido: regex }];
  }

  const [avisos, total] = await Promise.all([
    Aviso.find(filtro)
      .sort({ fijado: -1, createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .populate('autor', 'nombre'),
    Aviso.countDocuments(filtro),
  ]);

  res.json({
    ok: true,
    data: avisos,
    paginacion: { pagina, limite, total, paginas: Math.ceil(total / limite) },
  });
};

/**
 * GET /api/avisos/:id   (pública)
 */
const obtener = async (req, res) => {
  const aviso = await Aviso.findById(req.params.id).populate('autor', 'nombre');
  if (!aviso) throw ApiError.notFound('El aviso no existe.');
  res.json({ ok: true, data: aviso });
};

/**
 * POST /api/avisos   (protegida)
 */
const crear = async (req, res) => {
  const { titulo, contenido, categoria, fechaEvento, fijado } = req.body;
  const aviso = await Aviso.create({
    titulo, contenido, categoria, fechaEvento, fijado,
    autor: req.usuario.id,
  });
  await aviso.populate('autor', 'nombre');
  res.status(201).json({ ok: true, data: aviso });
};

/**
 * PUT /api/avisos/:id   (protegida)
 * Actualiza solo los campos enviados.
 */
const actualizar = async (req, res) => {
  const permitidos = ['titulo', 'contenido', 'categoria', 'fechaEvento', 'fijado'];
  const cambios = Object.fromEntries(
    Object.entries(req.body).filter(([campo]) => permitidos.includes(campo))
  );

  if (Object.keys(cambios).length === 0) {
    throw ApiError.badRequest('No se envió ningún campo para actualizar.');
  }

  const aviso = await Aviso.findByIdAndUpdate(req.params.id, cambios, {
    returnDocument: 'after',
    runValidators: true,
  }).populate('autor', 'nombre');

  if (!aviso) throw ApiError.notFound('El aviso no existe.');
  res.json({ ok: true, data: aviso });
};

/**
 * DELETE /api/avisos/:id   (protegida)
 */
const eliminar = async (req, res) => {
  const aviso = await Aviso.findByIdAndDelete(req.params.id);
  if (!aviso) throw ApiError.notFound('El aviso no existe.');
  res.json({ ok: true, data: { id: aviso.id }, mensaje: 'Aviso eliminado.' });
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
