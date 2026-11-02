/* =============================================================
   api.js — Cliente para comunicarse con la API REST
   Centraliza fetch, el token JWT y el manejo de errores.
   ============================================================= */
'use strict';

const CLAVE_TOKEN = 'tesla_token';
const CLAVE_USUARIO = 'tesla_usuario';

/* La API vive en el mismo servidor que el frontend */
const API_BASE = '/api';

/* ---------- Sesión ---------- */
const Sesion = {
  get token() { return localStorage.getItem(CLAVE_TOKEN); },
  get usuario() {
    try { return JSON.parse(localStorage.getItem(CLAVE_USUARIO)); } catch { return null; }
  },
  guardar(token, usuario) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  },
  cerrar(motivo = '') {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    location.replace(`login.html${motivo ? `?motivo=${motivo}` : ''}`);
  },
};

/* ---------- Error de la API ---------- */
class ErrorApi extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

/**
 * Hace una petición a la API.
 * @param {string} ruta     Ej. '/avisos'
 * @param {object} opciones { method, body, auth }
 */
const peticion = async (ruta, { method = 'GET', body, auth = true } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && Sesion.token) headers.Authorization = `Bearer ${Sesion.token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const { mensaje = 'Ocurrió un error inesperado.', detalles = [] } = datos.error || {};
    // Token vencido o inválido: volver al login
    if (respuesta.status === 401 && auth && Sesion.token) {
      Sesion.cerrar('expirada');
    }
    throw new ErrorApi(respuesta.status, mensaje, detalles);
  }

  return datos;
};

/* ---------- Endpoints ---------- */
const API = {
  login: (email, password) => peticion('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  perfil: () => peticion('/auth/perfil'),

  listarAvisos: (filtros = {}) => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
    return peticion(`/avisos?${params}`, { auth: false });
  },
  crearAviso: (aviso) => peticion('/avisos', { method: 'POST', body: aviso }),
  actualizarAviso: (id, cambios) => peticion(`/avisos/${id}`, { method: 'PUT', body: cambios }),
  eliminarAviso: (id) => peticion(`/avisos/${id}`, { method: 'DELETE' }),

  listarSolicitudes: (estado = '') => peticion(`/solicitudes${estado ? `?estado=${estado}` : ''}`),
  cambiarEstado: (id, estado) => peticion(`/solicitudes/${id}`, { method: 'PATCH', body: { estado } }),
  eliminarSolicitud: (id) => peticion(`/solicitudes/${id}`, { method: 'DELETE' }),
};

/* ---------- Utilidades compartidas ---------- */

/* Escapa texto para insertarlo en HTML de forma segura (evita XSS) */
const escaparHTML = (texto = '') =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Muestra u oculta el estado "cargando" de un botón */
const botonCargando = (boton, cargando) => {
  boton.disabled = cargando;
  boton.classList.toggle('cargando', cargando);
};
