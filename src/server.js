const env = require('./config/env');
const app = require('./app');
const { conectarDB, desconectarDB } = require('./config/db');
const asegurarAdmin = require('./config/adminInicial');

const iniciar = async () => {
  try {
    await conectarDB(env.mongoUri);
    await asegurarAdmin();   // crea el admin solo si la base de datos está vacía
    const servidor = app.listen(env.port, () => {
      console.log(`✔ Servidor en http://localhost:${env.port}  (${env.nodeEnv})`);
    });

    // Cierre ordenado (Ctrl+C o cuando Render reinicia el servicio)
    const cerrar = (senal) => {
      console.log(`\n${senal} recibido. Cerrando servidor...`);
      servidor.close(async () => {
        await desconectarDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', cerrar);
    process.on('SIGTERM', cerrar);
  } catch (error) {
    console.error('✖ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

iniciar();
