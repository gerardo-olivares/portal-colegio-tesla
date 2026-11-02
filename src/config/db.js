const mongoose = require('mongoose');

/**
 * Conecta a MongoDB usando la URI de las variables de entorno.
 */
const conectarDB = async (uri) => {
  mongoose.connection.on('connected', () => console.log('✔ Conectado a MongoDB'));
  mongoose.connection.on('error', (err) => console.error('✖ Error de MongoDB:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('⚠ MongoDB desconectado'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
};

const desconectarDB = () => mongoose.disconnect();

module.exports = { conectarDB, desconectarDB };
