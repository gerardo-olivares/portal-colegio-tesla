const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'personal'];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Correo electrónico no válido'],
    },
    // select: false -> la contraseña nunca se devuelve en las consultas por defecto
    password: { type: String, required: true, minlength: 8, select: false },
    rol: { type: String, enum: ROLES, default: 'personal' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* Antes de guardar, cifra la contraseña con bcrypt (solo si cambió) */
usuarioSchema.pre('save', async function cifrarPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* Compara una contraseña en texto plano contra el hash guardado */
usuarioSchema.methods.compararPassword = function compararPassword(passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

/* Al convertir a JSON, nunca incluir la contraseña ni campos internos */
usuarioSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Usuario', usuarioSchema);
module.exports.ROLES = ROLES;
