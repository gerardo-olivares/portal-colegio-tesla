/**
 * Script de datos iniciales:  npm run seed
 * - Crea el usuario administrador (con los datos ADMIN_* del .env)
 * - Si no hay avisos, crea algunos de ejemplo
 * Se puede ejecutar varias veces sin duplicar datos.
 */
const env = require('../config/env');
const { conectarDB, desconectarDB } = require('../config/db');
const Usuario = require('../models/Usuario');
const Aviso = require('../models/Aviso');

const avisosEjemplo = [
  {
    titulo: 'Inscripciones abiertas para el próximo ciclo escolar',
    contenido: 'Ya están abiertas las inscripciones para preescolar y primaria. Agenda una visita para conocer nuestras instalaciones y resolver tus dudas.',
    categoria: 'administrativo',
    fijado: true,
  },
  {
    titulo: 'Festival de fin de año',
    contenido: 'Los invitamos al festival de fin de año, donde los alumnos presentarán los bailables y canciones que prepararon en sus clases de música y zumba.',
    categoria: 'evento',
    fechaEvento: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  },
  {
    titulo: 'Junta de padres de familia de primaria',
    contenido: 'Se convoca a los padres de familia de primaria a la junta informativa sobre el avance del bimestre. Su asistencia es muy importante.',
    categoria: 'primaria',
  },
  {
    titulo: 'Material para el taller de ciencias de preescolar',
    contenido: 'Para el taller de ciencias de la próxima semana, los alumnos de preescolar deberán traer una lupa y un frasco de plástico con tapa.',
    categoria: 'preescolar',
  },
];

const sembrar = async () => {
  if (!env.admin.email || !env.admin.password) {
    console.error('✖ Define ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env');
    process.exit(1);
  }

  await conectarDB(env.mongoUri);

  let admin = await Usuario.findOne({ email: env.admin.email.toLowerCase() });
  if (admin) {
    console.log(`• El administrador ${admin.email} ya existe.`);
  } else {
    admin = await Usuario.create({
      nombre: env.admin.nombre,
      email: env.admin.email,
      password: env.admin.password,
      rol: 'admin',
    });
    console.log(`✔ Administrador creado: ${admin.email}`);
  }

  const totalAvisos = await Aviso.countDocuments();
  if (totalAvisos === 0) {
    await Aviso.insertMany(avisosEjemplo.map((a) => ({ ...a, autor: admin._id })));
    console.log(`✔ ${avisosEjemplo.length} avisos de ejemplo creados.`);
  } else {
    console.log(`• Ya hay ${totalAvisos} avisos; no se agregaron ejemplos.`);
  }

  await desconectarDB();
};

sembrar().catch(async (error) => {
  console.error('✖ Error al sembrar datos:', error.message);
  await desconectarDB();
  process.exit(1);
});
