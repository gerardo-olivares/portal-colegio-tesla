const mongoose = require('mongoose');

const CATEGORIAS = ['general', 'preescolar', 'primaria', 'evento', 'administrativo'];

const avisoSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    contenido: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    categoria: { type: String, enum: CATEGORIAS, default: 'general' },
    fechaEvento: { type: Date, default: null },
    fijado: { type: Boolean, default: false },
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  },
  { timestamps: true }
);

avisoSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Aviso', avisoSchema);
module.exports.CATEGORIAS = CATEGORIAS;
