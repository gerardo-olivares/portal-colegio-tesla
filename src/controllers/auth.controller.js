const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const ApiError = require('../utils/ApiError');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

/* Genera un JWT firmado con el id y el rol del usuario */
const generarToken = (usuario) =>
  jwt.sign({ sub: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

/**
 * POST /api/auth/login
 * Verifica las credenciales y devuelve un token JWT.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // +password porque el modelo la oculta por defecto (select: false)
  const usuario = await Usuario.findOne({ email }).select('+password');

  // Mismo mensaje si el correo no existe o la contraseña es incorrecta,
  // para no revelar qué correos están registrados.
  if (!usuario || !(await usuario.compararPassword(password))) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos.');
  }
  if (!usuario.activo) {
    throw ApiError.forbidden('Tu cuenta está desactivada. Contacta a la administración.');
  }

  res.json({
    ok: true,
    data: { token: generarToken(usuario), usuario },
  });
};

/**
 * POST /api/auth/registro   (solo admin)
 * Crea una cuenta para personal del colegio.
 */
const registro = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  const existe = await Usuario.exists({ email });
  if (existe) throw ApiError.conflict('Ya existe una cuenta con ese correo.');

  const usuario = await Usuario.create({ nombre, email, password, rol });
  res.status(201).json({ ok: true, data: { usuario } });
};

/**
 * GET /api/auth/perfil   (protegida)
 * Devuelve los datos del usuario autenticado.
 */
const perfil = (req, res) => {
  res.json({ ok: true, data: { usuario: req.usuario } });
};

module.exports = { login, registro, perfil };
