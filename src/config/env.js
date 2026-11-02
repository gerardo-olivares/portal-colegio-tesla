/**
 * Carga y valida las variables de entorno con dotenv.
 * Si falta una variable obligatoria, la aplicación se detiene con un
 * mensaje claro en lugar de fallar más adelante de forma confusa.
 */
require('dotenv').config({ quiet: true });

const obligatorias = ['MONGODB_URI', 'JWT_SECRET'];
const faltantes = obligatorias.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error(`✖ Faltan variables de entorno: ${faltantes.join(', ')}`);
  console.error('  Copia .env.example como .env y completa los valores.');
  process.exit(1);
}

const esProduccion = process.env.NODE_ENV === 'production';

if (esProduccion && process.env.JWT_SECRET.length < 32) {
  console.error('✖ JWT_SECRET debe tener al menos 32 caracteres en producción.');
  process.exit(1);
}

module.exports = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  esProduccion,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
  admin: {
    nombre: process.env.ADMIN_NOMBRE || 'Administración',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
});
