const Usuario = require('../models/Usuario');
const { admin } = require('./env');

/**
 * Si la base de datos no tiene usuarios, crea el administrador inicial
 * con los datos ADMIN_* de las variables de entorno.
 * Así el primer despliegue en la nube ya tiene con quién iniciar sesión.
 */
const asegurarAdmin = async () => {
  const hayUsuarios = await Usuario.exists({});
  if (hayUsuarios) return null;

  if (!admin.email || !admin.password) {
    console.warn('⚠ No hay usuarios y faltan ADMIN_EMAIL / ADMIN_PASSWORD: no se creó el administrador.');
    return null;
  }

  const usuario = await Usuario.create({
    nombre: admin.nombre,
    email: admin.email,
    password: admin.password,
    rol: 'admin',
  });
  console.log(`✔ Administrador inicial creado: ${usuario.email}`);
  return usuario;
};

module.exports = asegurarAdmin;
