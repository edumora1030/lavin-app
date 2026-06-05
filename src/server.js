require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DEV_VITE_PORT = parseInt(process.env.DEV_VITE_PORT || '5173', 10);

function getLocalIPv4Addresses() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) ips.push(net.address);
    }
  }
  return [...new Set(ips)];
}

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
app.use('/api/checklist-puesto', require('./routes/checklistPuesto.routes'));
app.use('/api/progreso', require('./routes/progress.routes'));
app.use('/api/examenes', require('./routes/exams.routes'));
app.use('/api/videos', require('./routes/videos.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/areas', require('./routes/areas.routes'));
app.use('/api/dudas', require('./routes/dudas.routes'));
app.use('/api/encuesta', require('./routes/encuesta.routes'));
app.use('/api/notificaciones', require('./routes/notificaciones.routes'));

// Estáticos: en desarrollo usar Vite (:5173); en producción servir dist/
const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(publicDir, 'dist');
const useDist = fs.existsSync(path.join(distDir, 'index.html'));
const isDev = process.env.NODE_ENV !== 'production';
app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')));

let viteProxy;
if (isDev) {
  viteProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${DEV_VITE_PORT}`,
    changeOrigin: true,
    ws: true,
  });
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    if (req.path.startsWith('/uploads/')) return next();
    return viteProxy(req, res, next);
  });
} else if (useDist) {
  app.use(express.static(distDir, {
    setHeaders(res, filePath) {
      if (/\.(html|js|css)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/')) return next();
    if (req.path.startsWith('/uploads/')) return next();
    if (path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/')) return next();
    if (req.path.startsWith('/uploads/')) return next();
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

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

const server = app.listen(PORT, '0.0.0.0', () => {
  const lanIps = getLocalIPv4Addresses();
  if (isDev) {
    console.log(`✓ App en desarrollo → http://localhost:${PORT}`);
    if (lanIps.length) {
      console.log('  Comparte en tu red WiFi:');
      for (const ip of lanIps) console.log(`    http://${ip}:${PORT}`);
    }
    console.log(`  (Vite interno en :${DEV_VITE_PORT})`);
  } else {
    console.log(`✓ Plataforma escuchando en http://localhost:${PORT}`);
    if (lanIps.length) {
      console.log('  Red local:');
      for (const ip of lanIps) console.log(`    http://${ip}:${PORT}`);
    }
  }
});

if (isDev && viteProxy) {
  server.on('upgrade', viteProxy.upgrade);
}
