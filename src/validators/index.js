const { body, param, query } = require('express-validator');
const { CATEGORIAS } = require('../models/Aviso');
const { NIVELES, ESTADOS } = require('../models/Solicitud');
const { ROLES } = require('../models/Usuario');

/* ---------- Reutilizables ---------- */
const idValido = param('id').isMongoId().withMessage('El identificador no es válido.');

/* ---------- Autenticación ---------- */
const login = [
  body('email').trim().isEmail().withMessage('Escribe un correo electrónico válido.').toLowerCase(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
];

const registro = [
  body('nombre').trim().isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres.'),
  body('email').trim().isEmail().withMessage('Escribe un correo electrónico válido.').toLowerCase(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número.')
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra.'),
  body('rol').optional().isIn(ROLES).withMessage(`El rol debe ser: ${ROLES.join(', ')}.`),
];

/* ---------- Avisos ---------- */
const reglasAviso = (opcional = false) => {
  const campo = (nombre) => (opcional ? body(nombre).optional() : body(nombre));
  return [
    campo('titulo').trim().isLength({ min: 3, max: 120 }).withMessage('El título debe tener entre 3 y 120 caracteres.'),
    campo('contenido').trim().isLength({ min: 10, max: 2000 }).withMessage('El contenido debe tener entre 10 y 2000 caracteres.'),
    body('categoria').optional().isIn(CATEGORIAS).withMessage(`La categoría debe ser: ${CATEGORIAS.join(', ')}.`),
    body('fechaEvento').optional({ values: 'null' }).isISO8601().withMessage('La fecha del evento no es válida (formato AAAA-MM-DD).'),
    body('fijado').optional().isBoolean().withMessage('"fijado" debe ser true o false.').toBoolean(),
  ];
};

const crearAviso = reglasAviso(false);
const actualizarAviso = [idValido, ...reglasAviso(true)];

const listarAvisos = [
  query('categoria').optional().isIn(CATEGORIAS).withMessage('Categoría no válida.'),
  query('pagina').optional().isInt({ min: 1 }).withMessage('"pagina" debe ser un número mayor a 0.').toInt(),
  query('limite').optional().isInt({ min: 1, max: 50 }).withMessage('"limite" debe estar entre 1 y 50.').toInt(),
  query('q').optional().trim().isLength({ max: 60 }).withMessage('La búsqueda es demasiado larga.'),
];

/* ---------- Solicitudes de informes ---------- */
const crearSolicitud = [
  body('nombre').trim().isLength({ min: 3, max: 80 }).withMessage('El nombre debe tener entre 3 y 80 caracteres.'),
  body('email').trim().isEmail().withMessage('Escribe un correo electrónico válido.').toLowerCase(),
  body('telefono').optional({ values: 'falsy' }).trim()
    .matches(/^[\d\s+()-]{8,20}$/).withMessage('El teléfono no es válido.'),
  body('nivel').optional().isIn(NIVELES).withMessage(`El nivel debe ser: ${NIVELES.join(', ')}.`),
  body('mensaje').trim().isLength({ min: 10, max: 1000 }).withMessage('El mensaje debe tener entre 10 y 1000 caracteres.'),
];

const actualizarEstado = [
  idValido,
  body('estado').isIn(ESTADOS).withMessage(`El estado debe ser: ${ESTADOS.join(', ')}.`),
];

const listarSolicitudes = [
  query('estado').optional().isIn(ESTADOS).withMessage('Estado no válido.'),
];

module.exports = {
  idValido,
  login,
  registro,
  crearAviso,
  actualizarAviso,
  listarAvisos,
  crearSolicitud,
  actualizarEstado,
  listarSolicitudes,
};
