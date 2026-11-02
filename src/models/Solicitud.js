const mongoose = require('mongoose');

const NIVELES = ['preescolar', 'primaria', 'sin-definir'];
const ESTADOS = ['nueva', 'contactada', 'cerrada'];

/**
 * Solicitud de informes que envían los padres de familia desde el
 * formulario de contacto del sitio del colegio.
 */
const solicitudSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    telefono: { type: String, trim: true, maxlength: 20, default: '' },
    nivel: { type: String, enum: NIVELES, default: 'sin-definir' },
    mensaje: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    estado: { type: String, enum: ESTADOS, default: 'nueva' },
  },
  { timestamps: true }
);

solicitudSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Solicitud', solicitudSchema, 'solicitudes');
module.exports.NIVELES = NIVELES;
module.exports.ESTADOS = ESTADOS;
