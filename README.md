# Plataforma de Inducción RR.HH. — Lavín

Aplicación **on-premise** para inducción corporativa. Funciona en una computadora dentro de la red de la empresa, sin internet.

## Stack

- Node.js 20+ · Express 5
- PostgreSQL 16 (local) · Prisma ORM
- Autenticación JWT + bcrypt
- Multer + streaming nativo con Range headers
- **Vue 3 + Vite** (frontend en `client/`, build en `public/dist/`)
- Pinia + Vue Router · roles: empleado, supervisor, admin
- PM2 para proceso persistente
- Nginx (opcional, recomendado en producción)

---

## Instalación rápida (Linux / macOS)

Requisitos previos: **Node.js 20+** y **PostgreSQL 16+** instalados.

```bash
chmod +x scripts/setup.sh scripts/backup.sh
./scripts/setup.sh
```

El script:
1. Verifica Node y PostgreSQL.
2. Crea `.env` con un `JWT_SECRET` aleatorio.
3. Crea el usuario `lavin_user` y la BD `induccion_db` en Postgres.
4. Instala dependencias (`npm install`).
5. Aplica migraciones (`prisma db push`) y genera el cliente.
6. Ejecuta `seed.js` (admin + 12 módulos base).
7. Inicia la app con PM2 y la configura para arrancar con el sistema.

Al final imprime la IP y URL de acceso.

**Credenciales iniciales:**
- Nómina: `ADMIN001`
- Contraseña: `Admin2024!`

---

## Instalación manual (Windows)

```powershell
# 1. Instala Node.js 20 LTS y PostgreSQL 16 desde sus instaladores oficiales.

# 2. Crear BD desde psql:
psql -U postgres
CREATE USER lavin_user WITH PASSWORD 'lavin_pass';
CREATE DATABASE induccion_db OWNER lavin_user;
GRANT ALL PRIVILEGES ON DATABASE induccion_db TO lavin_user;
\q

# 3. Configurar y arrancar:
copy .env.example .env
# Edita .env, cambia JWT_SECRET por una cadena aleatoria larga.

npm install
npx prisma db push
npx prisma generate
node scripts/seed.js

# 4. Iniciar
npm start
# o con PM2 (instalado globalmente con: npm i -g pm2)
pm2 start ecosystem.config.js
pm2 save
```

Para que arranque con Windows, usa **pm2-windows-startup** o `nssm`.

---

## Desarrollo frontend (Vue)

```bash
# Terminal 1 — API
npm run dev

# Terminal 2 — Vue con hot-reload (proxy a :3000)
npm run dev:client
# Abre http://localhost:5173
```

Build para producción (obligatorio antes de desplegar):

```bash
npm run build:client
npm start
```

## Acceso

Los empleados acceden desde cualquier dispositivo en la red local navegando a:

```
http://IP-DEL-SERVIDOR:3000
```

(o sin puerto si usas Nginx en el puerto 80).

---

## Estructura

```
induccion-app/
├── prisma/schema.prisma     ← Esquema completo (10 modelos)
├── src/
│   ├── server.js            ← Entry point Express
│   ├── config/db.js         ← Cliente Prisma
│   ├── middleware/          ← auth (JWT), roles
│   ├── routes/              ← 7 grupos de rutas REST
│   ├── controllers/         ← Lógica de negocio
│   └── utils/               ← jwt, errores, auditoria, backup
├── public/
│   ├── login.html
│   ├── index.html           ← App empleado
│   ├── admin/index.html     ← Panel admin
│   └── assets/              ← style.css, api.js, app.js, admin.js
├── uploads/videos/          ← Videos por módulo
├── backups/                 ← Dumps automáticos
├── scripts/                 ← setup.sh, seed.js, backup.sh
├── ecosystem.config.js      ← PM2
└── nginx.conf               ← Plantilla para reverse proxy
```

---

## Endpoints API

Todas las rutas (excepto `/api/auth/login`) requieren `Authorization: Bearer <token>`.

### Auth
- `POST /api/auth/login` — `{ nomina, password }` → `{ token, usuario }`
- `POST /api/auth/cambiar-password`
- `GET  /api/auth/me`
- `PUT  /api/auth/me` — actualizar programa/alcance

### Usuarios (admin)
- `GET/POST /api/usuarios`
- `GET/PUT/DELETE /api/usuarios/:id`
- `POST /api/usuarios/:id/reset-password`
- `GET /api/usuarios/:id/reporte`

### Módulos
- `GET /api/modulos` — filtrados por programa/alcance del usuario
- `GET /api/modulos/:id`
- `POST/PUT /api/modulos` (admin)
- `POST/PUT/DELETE /api/modulos/:id/items[/:itemId]` (admin)

### Progreso
- `GET /api/progreso` — del usuario actual
- `POST /api/progreso/item` — `{ itemId, moduloId }`
- `POST /api/progreso/modulo` — `{ moduloId }`
- `POST /api/progreso/recorrido`
- `GET /api/progreso/resumen` (admin/supervisor)

### Exámenes
- `GET /api/examenes/:moduloId` — sin revelar respuestas correctas
- `POST /api/examenes/:id/iniciar`
- `POST /api/examenes/:id/enviar` — `{ intentoId, respuestas }`
- `GET /api/examenes/:id/intentos`
- CRUD admin para examen y preguntas

### Videos
- `GET /api/videos`
- `POST /api/videos/subir` (admin, multipart)
- `DELETE /api/videos/:id` (admin)
- `GET /api/videos/:id/stream` — soporta `Range`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/reportes/empleados` — CSV
- `GET /api/admin/reportes/examenes` — CSV

---

## Seguridad

- JWT con expiración configurable (`JWT_EXPIRES_IN`)
- `bcrypt` (cost 10) para contraseñas
- Rate limiting: 5 intentos de login por IP cada 15 min
- `helmet` para headers de seguridad
- CORS restringido a redes privadas (`10.*`, `192.168.*`, `172.16-31.*`, `localhost`)
- Validación de inputs con `express-validator`
- Sanitización de nombres de archivo con `slugify`
- Logs de auditoría para: login (exitoso/fallido), módulos completados, exámenes, CRUD usuarios, subida/eliminación de videos
- Videos solo accesibles autenticado (a menos que actives el bloque alternativo en `nginx.conf`)

---

## Backups

Manual:
```bash
./scripts/backup.sh
```

Automático con cron (diario a las 2 am):
```bash
crontab -e
# Agregar:
0 2 * * * /ruta/absoluta/a/induccion-app/scripts/backup.sh >> /ruta/absoluta/a/induccion-app/backups/cron.log 2>&1
```

Retención automática: 30 días.

Para restaurar:
```bash
gunzip < backups/backup-2026-05-21_02-00-00.sql.gz | psql "$DATABASE_URL"
```

---

## Operación con PM2

```bash
pm2 status                  # ver estado
pm2 logs induccion-rrhh     # ver logs
pm2 restart induccion-rrhh  # reiniciar
pm2 stop induccion-rrhh
pm2 monit                   # monitor en vivo
```

---

## Migración de contenido del HTML original

El archivo `scripts/seed.js` crea los 12 módulos base con ítems placeholder. Para migrar exactamente los `steps` y `resources` del `PROGRAMS` del HTML original:

1. Abre `scripts/seed.js`.
2. Reemplaza la función `itemsParaModulo(slug)` con un mapa que devuelva los ítems exactos de cada slug, leyendo del `PROGRAMS` original.
3. Vuelve a ejecutar `node scripts/seed.js` (es idempotente: no duplica módulos existentes, pero **no** actualiza ítems de módulos ya creados — bórralos antes desde el panel admin o desde psql).

Alternativa: usa el panel admin para crear/editar ítems desde la UI.

---

## Resolución de problemas

**El servidor no inicia:**
- Verifica que PostgreSQL está corriendo: `systemctl status postgresql`
- Verifica conexión: `psql "$DATABASE_URL" -c "SELECT 1"`

**Error 401 al subir video:**
- El token JWT expiró. Cierra sesión y vuelve a entrar.

**Video no se reproduce:**
- Revisa permisos de la carpeta `uploads/`: el usuario que corre Node necesita lectura.
- Verifica que el archivo existe: `ls -la uploads/videos/`

**Backup falla:**
- Asegúrate que `pg_dump` está en el PATH del usuario que ejecuta cron.

---

## Licencia

Uso interno — Lavín · RR.HH.
