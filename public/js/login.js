/* =============================================================
   login.js — Lógica de la página de inicio de sesión
   ============================================================= */
'use strict';

// Si ya hay sesión, ir directo al panel
if (Sesion.token) location.replace('index.html');

const form = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputPassword = document.getElementById('password');
const btnEntrar = document.getElementById('btn-entrar');
const btnVer = document.getElementById('ver-password');
const alerta = document.getElementById('alerta');

const mostrarAlerta = (mensaje, tipo = 'error') => {
  alerta.textContent = mensaje;
  alerta.className = `alerta ${tipo}`;
  alerta.hidden = false;
};

const errorCampo = (input, mensaje) => {
  document.getElementById(`error-${input.id}`).textContent = mensaje;
  input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
};

/* Mensaje si el usuario llegó aquí porque su sesión expiró */
const motivo = new URLSearchParams(location.search).get('motivo');
if (motivo === 'expirada') mostrarAlerta('Tu sesión expiró. Vuelve a iniciar sesión.', 'aviso');
if (motivo === 'salida') mostrarAlerta('Cerraste sesión correctamente.', 'exito');

/* Mostrar / ocultar contraseña */
btnVer.addEventListener('click', () => {
  const visible = inputPassword.type === 'text';
  inputPassword.type = visible ? 'password' : 'text';
  btnVer.setAttribute('aria-pressed', String(!visible));
  btnVer.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

/* Validación en el navegador antes de llamar a la API */
const validar = () => {
  let valido = true;
  const email = inputEmail.value.trim();
  if (!email) { errorCampo(inputEmail, 'Escribe tu correo.'); valido = false; }
  else if (!/^\S+@\S+\.\S+$/.test(email)) { errorCampo(inputEmail, 'El correo no tiene un formato válido.'); valido = false; }
  else errorCampo(inputEmail, '');

  if (!inputPassword.value) { errorCampo(inputPassword, 'Escribe tu contraseña.'); valido = false; }
  else errorCampo(inputPassword, '');
  return valido;
};

[inputEmail, inputPassword].forEach((input) =>
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') errorCampo(input, '');
    alerta.hidden = true;
  })
);

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  alerta.hidden = true;
  if (!validar()) return;

  botonCargando(btnEntrar, true);
  try {
    const { data } = await API.login(inputEmail.value.trim(), inputPassword.value);
    Sesion.guardar(data.token, data.usuario);
    location.replace('index.html');
  } catch (error) {
    mostrarAlerta(error.message);
    inputPassword.value = '';
    inputPassword.focus();
    botonCargando(btnEntrar, false);
  }
});
