const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { corsOrigins, esProduccion } = require('./config/env');
const { rutaNoEncontrada, manejadorErrores } = require('./middleware/errores');

const app = express();

/* ---------- Configuración general ---------- */
app.disable('x-powered-by');                 // no revelar que usamos Express
app.set('trust proxy', 1);                   // necesario detrás del proxy de Render

/* ---------- CORS ----------
   Permite peticiones del mismo origen (el frontend en /public) y de los
   orígenes listados en CORS_ORIGINS (ej. el sitio del colegio en GitHub Pages). */
app.use(cors({
  origin: (origen, callback) => {
    if (!origen || corsOrigins.includes(origen)) return callback(null, true);
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ---------- Lectura del cuerpo JSON ---------- */
app.use(express.json({ limit: '20kb' }));

/* ---------- Registro simple de peticiones (solo en desarrollo) ---------- */
if (!esProduccion) {
  app.use('/api', (req, _res, next) => {
    console.log(`${new Date().toLocaleTimeString('es-MX')}  ${req.method} ${req.originalUrl}`);
    next();
  });
}

/* ---------- Rutas de la API ---------- */
app.get('/api/health', (_req, res) => {
  const estados = ['desconectada', 'conectada', 'conectando', 'desconectando'];
  res.json({
    ok: true,
    servicio: 'API Portal Colegio Tesla',
    baseDeDatos: estados[mongoose.connection.readyState] || 'desconocido',
    hora: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/avisos', require('./routes/avisos.routes'));
app.use('/api/solicitudes', require('./routes/solicitudes.routes'));

/* ---------- Frontend estático ---------- */
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ---------- Manejo de errores (siempre al final) ---------- */
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
