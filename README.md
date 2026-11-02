# Portal Colegio Tesla

Aplicación Full Stack para el **Colegio Tesla** (preescolar y primaria, Cuernavaca, Morelos).
El personal del colegio inicia sesión para publicar **avisos** para los padres de familia y para
gestionar las **solicitudes de informes** que llegan desde el sitio web del colegio.

- **Backend:** Node.js + Express (API RESTful), MongoDB con Mongoose, autenticación con JWT
- **Frontend:** HTML, CSS y JavaScript (sin frameworks), servido por el mismo Express
- **Seguridad:** contraseñas cifradas con bcryptjs, rutas protegidas con JWT, validación con
  express-validator, límite de intentos de inicio de sesión, CORS configurado
- **Pruebas:** 16 pruebas automáticas con `node:test` + `supertest`

> Proyecto del reto de la materia **Desarrollo Full Stack** — Universidad Tecmilenio.
> Autor: Gerardo Olivares Mijares.

---

## Estructura del proyecto

```
portal-colegio-tesla/
├── src/
│   ├── server.js               # Punto de entrada: conecta la BD y levanta el servidor
│   ├── app.js                  # Configuración de Express, middlewares y rutas
│   ├── config/
│   │   ├── env.js              # Carga y valida variables de entorno (dotenv)
│   │   ├── db.js               # Conexión a MongoDB con Mongoose
│   │   └── adminInicial.js     # Crea el admin si la BD está vacía
│   ├── models/                 # Esquemas de Mongoose
│   │   ├── Usuario.js
│   │   ├── Aviso.js
│   │   └── Solicitud.js
│   ├── controllers/            # Lógica de cada endpoint
│   ├── routes/                 # Definición de rutas y protección por JWT
│   ├── middleware/
│   │   ├── auth.js             # proteger (JWT) y permitir (roles)
│   │   ├── validar.js          # Respuesta 400 con errores de validación
│   │   └── errores.js          # 404 y manejador central de errores
│   ├── validators/index.js     # Reglas de express-validator
│   ├── utils/                  # ApiError y asyncHandler
│   └── scripts/seed.js         # Datos iniciales (npm run seed)
├── public/                     # Frontend
│   ├── login.html              # Página de inicio de sesión
│   ├── index.html              # Panel principal (requiere sesión)
│   ├── css/styles.css
│   ├── js/api.js               # Cliente de la API (fetch + token)
│   ├── js/login.js
│   ├── js/panel.js
│   └── img/
├── tests/api.test.js           # Pruebas automáticas
├── docs/peticiones.http        # Peticiones de ejemplo (REST Client / Postman)
├── .env.example                # Plantilla de variables de entorno
├── render.yaml                 # Configuración de despliegue en Render
└── package.json
```

## Instalación local

**Requisitos:** Node.js 18 o superior y MongoDB (local o una cuenta gratuita de MongoDB Atlas).

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/gerardo-olivares/portal-colegio-tesla.git
cd portal-colegio-tesla
npm install

# 2. Configurar variables de entorno
cp .env.example .env        # en Windows: copy .env.example .env
# edita .env: MONGODB_URI, JWT_SECRET y los datos ADMIN_*

# 3. Crear el administrador y avisos de ejemplo
npm run seed

# 4. Iniciar el servidor
npm run dev                 # con recarga automática (nodemon)
# o
npm start
```

Abre <http://localhost:3000> e inicia sesión con el `ADMIN_EMAIL` y `ADMIN_PASSWORD` de tu `.env`.

### Scripts

| Comando         | Descripción                                      |
|-----------------|--------------------------------------------------|
| `npm start`     | Inicia el servidor en modo normal                |
| `npm run dev`   | Inicia con nodemon (se reinicia al guardar)      |
| `npm run seed`  | Crea el administrador y avisos de ejemplo        |
| `npm test`      | Ejecuta las pruebas automáticas de la API        |

## Variables de entorno

| Variable         | Obligatoria | Descripción                                                      |
|------------------|:-----------:|------------------------------------------------------------------|
| `MONGODB_URI`    | Sí          | Cadena de conexión de MongoDB (local o Atlas)                    |
| `JWT_SECRET`     | Sí          | Clave para firmar los tokens (mín. 32 caracteres en producción)  |
| `JWT_EXPIRES_IN` | No          | Vigencia del token, por defecto `8h`                             |
| `PORT`           | No          | Puerto del servidor, por defecto `3000`                          |
| `NODE_ENV`       | No          | `development` o `production`                                     |
| `CORS_ORIGINS`   | No          | Orígenes externos permitidos, separados por coma                 |
| `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Para el admin inicial | Datos del primer usuario administrador |

## Endpoints de la API

Todas las respuestas son JSON con la forma `{ "ok": true, "data": ... }` o
`{ "ok": false, "error": { "status", "mensaje", "detalles" } }`.
Las rutas **protegidas** requieren el encabezado `Authorization: Bearer <token>`.

### Autenticación — `/api/auth`

| Método | Ruta         | Acceso     | Descripción                               |
|--------|--------------|------------|-------------------------------------------|
| POST   | `/login`     | Pública    | Inicia sesión y devuelve el token JWT     |
| GET    | `/perfil`    | Protegida  | Datos del usuario autenticado             |
| POST   | `/registro`  | Solo admin | Crea una cuenta para personal del colegio |

### Avisos — `/api/avisos`

| Método | Ruta    | Acceso    | Descripción                                                          |
|--------|---------|-----------|----------------------------------------------------------------------|
| GET    | `/`     | Pública   | Lista avisos. Filtros: `categoria`, `q`, `pagina`, `limite`          |
| GET    | `/:id`  | Pública   | Obtiene un aviso                                                     |
| POST   | `/`     | Protegida | Crea un aviso                                                        |
| PUT    | `/:id`  | Protegida | Actualiza los campos enviados                                        |
| DELETE | `/:id`  | Protegida | Elimina un aviso                                                     |

### Solicitudes de informes — `/api/solicitudes`

| Método | Ruta    | Acceso    | Descripción                                          |
|--------|---------|-----------|------------------------------------------------------|
| POST   | `/`     | Pública   | Un padre de familia envía una solicitud              |
| GET    | `/`     | Protegida | Lista solicitudes. Filtro: `estado`                  |
| PATCH  | `/:id`  | Protegida | Cambia el estado (`nueva`, `contactada`, `cerrada`)  |
| DELETE | `/:id`  | Protegida | Elimina una solicitud                                |

### Otros

| Método | Ruta          | Descripción                              |
|--------|---------------|------------------------------------------|
| GET    | `/api/health` | Estado del servidor y de la base de datos |

### Códigos de respuesta

| Código | Cuándo ocurre                                            |
|--------|----------------------------------------------------------|
| 200    | Operación correcta                                       |
| 201    | Recurso creado                                           |
| 400    | Datos inválidos (incluye `detalles` por campo)           |
| 401    | Sin token, token inválido o expirado, credenciales malas |
| 403    | El usuario no tiene el rol necesario                     |
| 404    | Ruta o recurso inexistente                               |
| 409    | Registro duplicado (por ejemplo, correo ya registrado)   |
| 429    | Demasiados intentos en poco tiempo                       |
| 500    | Error interno del servidor                               |

## Despliegue en Render + MongoDB Atlas

1. **MongoDB Atlas:** crea un clúster gratuito (M0), un usuario de base de datos y en
   *Network Access* permite `0.0.0.0/0`. Copia la cadena de conexión `mongodb+srv://...`
   y agrégale el nombre de la base: `.../colegio_tesla?retryWrites=true&w=majority`.
2. **Render:** *New → Blueprint*, conecta este repositorio y Render leerá `render.yaml`.
3. Captura las variables que Render pide: `MONGODB_URI`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
   `JWT_SECRET` se genera solo.
4. Al terminar el despliegue, abre la URL `https://<servicio>.onrender.com`.
   En el primer arranque se crea automáticamente el administrador.

> En el plan gratuito, Render "duerme" el servicio tras 15 minutos sin uso;
> la primera visita después tarda unos 30–50 segundos en responder.

## Licencia

MIT
