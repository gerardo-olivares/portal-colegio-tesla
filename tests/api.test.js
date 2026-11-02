/**
 * Pruebas automáticas de la API:  npm test
 * Usan una base de datos separada (colegio_tesla_test) que se borra al final.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'clave_de_prueba_solo_para_tests_1234567890';
process.env.MONGODB_URI = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/colegio_tesla')
  .replace(/\/([^/?]+)(\?|$)/, '/colegio_tesla_test$2');

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Usuario = require('../src/models/Usuario');

let token;
let idAviso;
let idSolicitud;

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await Usuario.create({ nombre: 'Admin Prueba', email: 'admin@test.mx', password: 'Prueba2026', rol: 'admin' });
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Salud y rutas', () => {
  test('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.baseDeDatos, 'conectada');
  });

  test('una ruta inexistente responde 404 en JSON', async () => {
    const res = await request(app).get('/api/no-existe');
    assert.equal(res.status, 404);
    assert.equal(res.body.ok, false);
  });
});

describe('Autenticación', () => {
  test('rechaza credenciales incorrectas', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.mx', password: 'mala' });
    assert.equal(res.status, 401);
  });

  test('valida el formato del correo', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'no-es-correo', password: 'x' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.detalles[0].campo, 'email');
  });

  test('inicia sesión y devuelve un token sin exponer la contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.mx', password: 'Prueba2026' });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.usuario.password, undefined);
    token = res.body.data.token;
  });

  test('rechaza un token inválido', async () => {
    const res = await request(app).get('/api/auth/perfil').set('Authorization', 'Bearer token.falso.123');
    assert.equal(res.status, 401);
  });
});

describe('CRUD de avisos', () => {
  test('crear sin token responde 401', async () => {
    const res = await request(app).post('/api/avisos').send({ titulo: 'Prueba', contenido: 'Contenido de prueba' });
    assert.equal(res.status, 401);
  });

  test('crear con datos inválidos responde 400', async () => {
    const res = await request(app).post('/api/avisos').set('Authorization', `Bearer ${token}`).send({ titulo: 'ab' });
    assert.equal(res.status, 400);
  });

  test('CREATE: crea un aviso', async () => {
    const res = await request(app).post('/api/avisos').set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Festival de primavera', contenido: 'Los esperamos en el festival de primavera.', categoria: 'evento' });
    assert.equal(res.status, 201);
    idAviso = res.body.data._id;
  });

  test('READ: la lista es pública', async () => {
    const res = await request(app).get('/api/avisos');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
  });

  test('UPDATE: actualiza el aviso', async () => {
    const res = await request(app).put(`/api/avisos/${idAviso}`).set('Authorization', `Bearer ${token}`).send({ fijado: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.fijado, true);
  });

  test('id con formato inválido responde 400', async () => {
    const res = await request(app).get('/api/avisos/123');
    assert.equal(res.status, 400);
  });

  test('DELETE: elimina el aviso y después ya no existe', async () => {
    const res = await request(app).delete(`/api/avisos/${idAviso}`).set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    const res2 = await request(app).get(`/api/avisos/${idAviso}`);
    assert.equal(res2.status, 404);
  });
});

describe('Solicitudes de informes', () => {
  test('cualquiera puede enviar una solicitud', async () => {
    const res = await request(app).post('/api/solicitudes')
      .send({ nombre: 'Padre de Prueba', email: 'padre@test.mx', nivel: 'primaria', mensaje: 'Quiero informes de inscripción.' });
    assert.equal(res.status, 201);
    idSolicitud = res.body.data.id;
  });

  test('listar solicitudes requiere sesión', async () => {
    const res = await request(app).get('/api/solicitudes');
    assert.equal(res.status, 401);
  });

  test('el personal cambia el estado de una solicitud', async () => {
    const res = await request(app).patch(`/api/solicitudes/${idSolicitud}`).set('Authorization', `Bearer ${token}`).send({ estado: 'contactada' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.estado, 'contactada');
  });
});
