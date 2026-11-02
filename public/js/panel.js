/* =============================================================
   panel.js — Página principal (requiere sesión)
   Muestra y gestiona los avisos y las solicitudes de informes.
   ============================================================= */
'use strict';

/* ---------- Estado de la interfaz ---------- */
const estado = {
  filtroCategoria: '',
  busqueda: '',
  avisos: [],
  solicitudes: [],
  editandoId: null,
};

const ETIQUETAS_CATEGORIA = {
  general: 'General', preescolar: 'Preescolar', primaria: 'Primaria',
  evento: 'Evento', administrativo: 'Administrativo',
};
const ETIQUETAS_NIVEL = { preescolar: 'Preescolar', primaria: 'Primaria', 'sin-definir': 'Sin definir' };

/* ---------- Referencias al DOM ---------- */
const $ = (id) => document.getElementById(id);
const formAviso = $('form-aviso');
const campos = {
  id: $('aviso-id'), titulo: $('aviso-titulo'), categoria: $('aviso-categoria'),
  fecha: $('aviso-fecha'), contenido: $('aviso-contenido'), fijado: $('aviso-fijado'),
};
const listaAvisos = $('lista-avisos');
const listaSolicitudes = $('lista-solicitudes');

/* ---------- Utilidades de formato ---------- */
const formatoFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const formatoFechaEvento = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fecha = (iso) => formatoFecha.format(new Date(iso));
const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/* ---------- Notificaciones (toasts) ---------- */
const toast = (mensaje, tipo = 'exito') => {
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = mensaje;
  $('toasts').append(el);
  setTimeout(() => el.classList.add('saliendo'), 3200);
  setTimeout(() => el.remove(), 3600);
};

/* ---------- Diálogo de confirmación (devuelve una promesa) ---------- */
const confirmar = (titulo, texto) => new Promise((resolver) => {
  const dialogo = $('dialogo');
  $('dialogo-titulo').textContent = titulo;
  $('dialogo-texto').textContent = texto;
  const cerrar = (respuesta) => {
    dialogo.close();
    $('dialogo-confirmar').onclick = null;
    $('dialogo-cancelar').onclick = null;
    resolver(respuesta);
  };
  $('dialogo-confirmar').onclick = () => cerrar(true);
  $('dialogo-cancelar').onclick = () => cerrar(false);
  dialogo.oncancel = () => cerrar(false);
  dialogo.showModal();
});

/* =============================================================
   USUARIO
   ============================================================= */
const mostrarUsuario = (usuario) => {
  $('usuario-nombre').textContent = usuario.nombre;
  $('usuario-rol').textContent = usuario.rol === 'admin' ? 'Administrador' : 'Personal';
  $('avatar').textContent = usuario.nombre.trim().charAt(0).toUpperCase();
};

$('btn-salir').addEventListener('click', () => Sesion.cerrar('salida'));

/* =============================================================
   AVISOS
   ============================================================= */
const plantillaAviso = (aviso) => {
  const evento = aviso.fechaEvento
    ? `<p class="aviso-evento">📅 ${escaparHTML(mayuscula(formatoFechaEvento.format(new Date(aviso.fechaEvento))))}</p>`
    : '';
  return `
    <li class="aviso ${aviso.fijado ? 'fijado' : ''} ${estado.editandoId === aviso._id ? 'editando' : ''}" data-id="${aviso._id}">
      <div class="aviso-cabecera">
        <span class="etiqueta cat-${aviso.categoria}">${ETIQUETAS_CATEGORIA[aviso.categoria]}</span>
        ${aviso.fijado ? '<span class="pin" title="Aviso fijado">📌 Fijado</span>' : ''}
      </div>
      <h3 class="aviso-titulo">${escaparHTML(aviso.titulo)}</h3>
      ${evento}
      <p class="aviso-contenido">${escaparHTML(aviso.contenido)}</p>
      <div class="aviso-pie">
        <span class="aviso-meta">${escaparHTML(aviso.autor?.nombre || 'Colegio Tesla')} · ${fecha(aviso.createdAt)}</span>
        <div class="aviso-acciones">
          <button type="button" class="btn-icono" data-accion="editar" aria-label="Editar aviso: ${escaparHTML(aviso.titulo)}">Editar</button>
          <button type="button" class="btn-icono peligro" data-accion="eliminar" aria-label="Eliminar aviso: ${escaparHTML(aviso.titulo)}">Eliminar</button>
        </div>
      </div>
    </li>`;
};

const renderAvisos = () => {
  listaAvisos.innerHTML = estado.avisos.map(plantillaAviso).join('');
  $('vacio-avisos').hidden = estado.avisos.length > 0;
};

const cargarAvisos = async () => {
  listaAvisos.classList.add('cargando-lista');
  try {
    const { data } = await API.listarAvisos({
      categoria: estado.filtroCategoria, q: estado.busqueda, limite: 50,
    });
    estado.avisos = data;
    renderAvisos();
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    listaAvisos.classList.remove('cargando-lista');
  }
};

/* Contadores del resumen */
const cargarResumen = async () => {
  try {
    const [{ data: todos, paginacion }, { resumen }] = await Promise.all([
      API.listarAvisos({ limite: 50 }),
      API.listarSolicitudes(),
    ]);
    $('dato-avisos').textContent = paginacion.total;
    $('dato-fijados').textContent = todos.filter((a) => a.fijado).length;
    $('dato-nuevas').textContent = resumen.nuevas;
    const badge = $('badge-nuevas');
    badge.textContent = resumen.nuevas;
    badge.hidden = resumen.nuevas === 0;
  } catch (error) {
    toast(error.message, 'error');
  }
};

/* ----- Formulario: crear / editar ----- */
const limpiarErrores = () => {
  formAviso.querySelectorAll('[data-error]').forEach((p) => { p.textContent = ''; });
  formAviso.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
};

const mostrarErrores = (detalles) => {
  const mapa = { titulo: campos.titulo, contenido: campos.contenido, fechaEvento: campos.fecha };
  detalles.forEach(({ campo, mensaje }) => {
    const p = formAviso.querySelector(`[data-error="${campo}"]`);
    if (p) p.textContent = mensaje;
    mapa[campo]?.setAttribute('aria-invalid', 'true');
  });
};

const validarAviso = (aviso) => {
  const errores = [];
  if (aviso.titulo.length < 3) errores.push({ campo: 'titulo', mensaje: 'El título debe tener al menos 3 caracteres.' });
  if (aviso.contenido.length < 10) errores.push({ campo: 'contenido', mensaje: 'El contenido debe tener al menos 10 caracteres.' });
  return errores;
};

const reiniciarFormulario = () => {
  formAviso.reset();
  campos.id.value = '';
  estado.editandoId = null;
  $('titulo-form').textContent = 'Nuevo aviso';
  $('btn-guardar').querySelector('.btn-texto').textContent = 'Publicar aviso';
  $('btn-cancelar').hidden = true;
  $('contador-contenido').textContent = '0';
  limpiarErrores();
  renderAvisos();
};

const editarAviso = (aviso) => {
  estado.editandoId = aviso._id;
  campos.id.value = aviso._id;
  campos.titulo.value = aviso.titulo;
  campos.categoria.value = aviso.categoria;
  campos.fecha.value = aviso.fechaEvento ? aviso.fechaEvento.slice(0, 10) : '';
  campos.contenido.value = aviso.contenido;
  campos.fijado.checked = aviso.fijado;
  $('contador-contenido').textContent = aviso.contenido.length;
  $('titulo-form').textContent = 'Editar aviso';
  $('btn-guardar').querySelector('.btn-texto').textContent = 'Guardar cambios';
  $('btn-cancelar').hidden = false;
  limpiarErrores();
  renderAvisos();
  formAviso.scrollIntoView({ behavior: 'smooth', block: 'start' });
  campos.titulo.focus({ preventScroll: true });
};

formAviso.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarErrores();

  const aviso = {
    titulo: campos.titulo.value.trim(),
    contenido: campos.contenido.value.trim(),
    categoria: campos.categoria.value,
    fechaEvento: campos.fecha.value || null,
    fijado: campos.fijado.checked,
  };

  const errores = validarAviso(aviso);
  if (errores.length) return mostrarErrores(errores);

  const boton = $('btn-guardar');
  botonCargando(boton, true);
  try {
    if (estado.editandoId) {
      await API.actualizarAviso(estado.editandoId, aviso);
      toast('Aviso actualizado.');
    } else {
      await API.crearAviso(aviso);
      toast('Aviso publicado.');
    }
    reiniciarFormulario();
    await Promise.all([cargarAvisos(), cargarResumen()]);
  } catch (error) {
    if (error.detalles?.length) mostrarErrores(error.detalles);
    toast(error.message, 'error');
  } finally {
    botonCargando(boton, false);
  }
});

$('btn-cancelar').addEventListener('click', reiniciarFormulario);
campos.contenido.addEventListener('input', () => {
  $('contador-contenido').textContent = campos.contenido.value.length;
});

/* ----- Acciones de cada aviso (delegación de eventos) ----- */
listaAvisos.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;
  const { id } = boton.closest('.aviso').dataset;
  const aviso = estado.avisos.find((a) => a._id === id);

  if (boton.dataset.accion === 'editar') editarAviso(aviso);

  if (boton.dataset.accion === 'eliminar') {
    const ok = await confirmar('¿Eliminar este aviso?', `"${aviso.titulo}" dejará de mostrarse a los padres de familia.`);
    if (!ok) return;
    try {
      await API.eliminarAviso(id);
      if (estado.editandoId === id) reiniciarFormulario();
      toast('Aviso eliminado.');
      await Promise.all([cargarAvisos(), cargarResumen()]);
    } catch (error) {
      toast(error.message, 'error');
    }
  }
});

/* ----- Filtros y búsqueda ----- */
$('chips-categorias').addEventListener('click', (evento) => {
  const chip = evento.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach((c) => {
    const activo = c === chip;
    c.classList.toggle('activo', activo);
    c.setAttribute('aria-pressed', String(activo));
  });
  estado.filtroCategoria = chip.dataset.categoria;
  cargarAvisos();
});

let temporizadorBusqueda;
$('buscar').addEventListener('input', (evento) => {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(() => {
    estado.busqueda = evento.target.value.trim();
    cargarAvisos();
  }, 300);   // espera a que el usuario deje de escribir
});

/* =============================================================
   SOLICITUDES DE INFORMES
   ============================================================= */
const plantillaSolicitud = (s) => `
  <li class="solicitud estado-${s.estado}" data-id="${s._id}">
    <div class="solicitud-cabecera">
      <div>
        <h3>${escaparHTML(s.nombre)}</h3>
        <p class="solicitud-contacto">
          <a href="mailto:${escaparHTML(s.email)}">${escaparHTML(s.email)}</a>
          ${s.telefono ? ` · <a href="tel:${escaparHTML(s.telefono.replace(/\s/g, ''))}">${escaparHTML(s.telefono)}</a>` : ''}
        </p>
      </div>
      <span class="etiqueta nivel">${ETIQUETAS_NIVEL[s.nivel]}</span>
    </div>
    <p class="solicitud-mensaje">${escaparHTML(s.mensaje)}</p>
    <div class="solicitud-pie">
      <span class="aviso-meta">Recibida el ${fecha(s.createdAt)}</span>
      <div class="solicitud-acciones">
        <label class="sr-only" for="estado-${s._id}">Estado de la solicitud de ${escaparHTML(s.nombre)}</label>
        <select id="estado-${s._id}" class="select-estado" data-accion="estado">
          <option value="nueva" ${s.estado === 'nueva' ? 'selected' : ''}>Nueva</option>
          <option value="contactada" ${s.estado === 'contactada' ? 'selected' : ''}>Contactada</option>
          <option value="cerrada" ${s.estado === 'cerrada' ? 'selected' : ''}>Cerrada</option>
        </select>
        <button type="button" class="btn-icono peligro" data-accion="eliminar" aria-label="Eliminar solicitud de ${escaparHTML(s.nombre)}">Eliminar</button>
      </div>
    </div>
  </li>`;

const cargarSolicitudes = async () => {
  try {
    const { data } = await API.listarSolicitudes($('filtro-estado').value);
    estado.solicitudes = data;
    listaSolicitudes.innerHTML = data.map(plantillaSolicitud).join('');
    $('vacio-solicitudes').hidden = data.length > 0;
  } catch (error) {
    toast(error.message, 'error');
  }
};

$('filtro-estado').addEventListener('change', cargarSolicitudes);

listaSolicitudes.addEventListener('change', async (evento) => {
  if (evento.target.dataset.accion !== 'estado') return;
  const { id } = evento.target.closest('.solicitud').dataset;
  try {
    await API.cambiarEstado(id, evento.target.value);
    toast('Estado actualizado.');
    await Promise.all([cargarSolicitudes(), cargarResumen()]);
  } catch (error) {
    toast(error.message, 'error');
  }
});

listaSolicitudes.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('[data-accion="eliminar"]');
  if (!boton) return;
  const { id } = boton.closest('.solicitud').dataset;
  const solicitud = estado.solicitudes.find((s) => s._id === id);
  const ok = await confirmar('¿Eliminar esta solicitud?', `Se borrará la solicitud de ${solicitud.nombre}.`);
  if (!ok) return;
  try {
    await API.eliminarSolicitud(id);
    toast('Solicitud eliminada.');
    await Promise.all([cargarSolicitudes(), cargarResumen()]);
  } catch (error) {
    toast(error.message, 'error');
  }
});

/* =============================================================
   PESTAÑAS (con soporte de teclado)
   ============================================================= */
const tabs = [$('tab-avisos'), $('tab-solicitudes')];
const activarTab = (tab) => {
  tabs.forEach((t) => {
    const activa = t === tab;
    t.classList.toggle('activa', activa);
    t.setAttribute('aria-selected', String(activa));
    t.tabIndex = activa ? 0 : -1;
    $(t.getAttribute('aria-controls')).hidden = !activa;
  });
  if (tab.id === 'tab-solicitudes') cargarSolicitudes();
};
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => activarTab(tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const siguiente = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    siguiente.focus();
    activarTab(siguiente);
  });
});

/* =============================================================
   INICIO
   ============================================================= */
const iniciar = async () => {
  if (Sesion.usuario) mostrarUsuario(Sesion.usuario);
  try {
    // Verifica que el token siga siendo válido en el servidor
    const { data } = await API.perfil();
    mostrarUsuario(data.usuario);
  } catch {
    return; // si el token no sirve, api.js ya redirigió al login
  }
  await Promise.all([cargarAvisos(), cargarResumen()]);
};

iniciar();
