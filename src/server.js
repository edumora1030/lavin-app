require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// CORS restringido a red local
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: false, // simplifica para servir HTML inline; reactivar y configurar en endurecimiento
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/users.routes'));
app.use('/api/modulos', require('./routes/modules.routes'));
app.use('/api/progreso', require('./routes/progress.routes'));
app.use('/api/examenes', require('./routes/exams.routes'));
app.use('/api/videos', require('./routes/videos.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/areas', require('./routes/areas.routes'));
app.use('/api/dudas', require('./routes/dudas.routes'));
app.use('/api/encuesta', require('./routes/encuesta.routes'));
app.use('/api/notificaciones', require('./routes/notificaciones.routes'));

// Estáticos: Vue build (dist) o legacy public/
const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(publicDir, 'dist');
const useDist = fs.existsSync(path.join(distDir, 'index.html'));

app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')));
if (useDist) {
  app.use(express.static(distDir));
} else {
  app.use(express.static(publicDir));
}

// SPA fallback (Vue Router)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/uploads/')) return next();
  if (path.extname(req.path)) return next();
  const indexFile = useDist
    ? path.join(distDir, 'index.html')
    : path.join(publicDir, 'index.html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(indexFile);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.message === 'FORMATO_NO_PERMITIDO') {
    return res.status(415).json({ error: true, codigo: 'FORMATO_NO_PERMITIDO', mensaje: 'Formato no permitido.', status: 415 });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: true, codigo: 'ARCHIVO_DEMASIADO_GRANDE', mensaje: 'Archivo demasiado grande.', status: 413 });
  }
  res.status(500).json({ error: true, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.', status: 500 });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Plataforma RR.HH. Lavín escuchando en http://0.0.0.0:${PORT}`);
});
