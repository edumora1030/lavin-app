const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const multer = require('multer');
const slugify = require('slugify');
const prisma = require('../config/db');
const { Errores } = require('../utils/errores');
const { auditar } = require('../utils/auditoria');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '2000', 10)) * 1024 * 1024;
const FORMATOS = ['video/mp4', 'video/webm', 'video/quicktime'];

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const moduloSlug = req.body.moduloSlug ? slugify(req.body.moduloSlug, { lower: true, strict: true }) : 'general';
    const dir = path.join(UPLOAD_DIR, 'videos', moduloSlug);
    await fsp.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const base = slugify(path.parse(file.originalname).name, { lower: true, strict: true });
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

exports.uploader = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!FORMATOS.includes(file.mimetype)) return cb(new Error('FORMATO_NO_PERMITIDO'));
    cb(null, true);
  },
});

exports.listar = async (req, res) => {
  const { moduloId } = req.query;
  const where = { activo: true };
  if (moduloId) where.moduloId = moduloId;
  const videos = await prisma.video.findMany({
    where,
    orderBy: { subidoEn: 'desc' },
    select: { id: true, titulo: true, descripcion: true, mimetype: true, tamanioBytes: true, duracionSegundos: true, moduloId: true, subidoEn: true },
  });
  // BigInt → string
  return res.json(videos.map(v => ({ ...v, tamanioBytes: v.tamanioBytes.toString() })));
};

exports.subir = async (req, res) => {
  try {
    if (!req.file) return Errores.validacion(res, [{ campo: 'archivo', mensaje: 'Archivo requerido.' }]);
    const { titulo, descripcion, moduloId } = req.body;
    const rutaRel = path.relative(UPLOAD_DIR, req.file.path).replace(/\\/g, '/');

    const video = await prisma.video.create({
      data: {
        titulo: titulo || req.file.originalname,
        descripcion: descripcion || null,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        tamanioBytes: BigInt(req.file.size),
        ruta: rutaRel,
        moduloId: moduloId || null,
        subidoPor: req.usuario.id,
      },
    });
    await auditar({ usuarioId: req.usuario.id, accion: 'video_subido', detalle: { id: video.id } });
    return res.status(201).json({ ...video, tamanioBytes: video.tamanioBytes.toString() });
  } catch (e) {
    console.error(e);
    return Errores.generico(res, 'Error al subir el video.');
  }
};

exports.eliminar = async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video) return Errores.noEncontrado(res, 'Video');
  const ruta = path.join(UPLOAD_DIR, video.ruta);
  try { await fsp.unlink(ruta); } catch {}
  await prisma.video.delete({ where: { id: video.id } });
  await auditar({ usuarioId: req.usuario.id, accion: 'video_eliminado', detalle: { id: video.id } });
  return res.json({ ok: true });
};

// Streaming con Range headers
exports.stream = async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video || !video.activo) return Errores.noEncontrado(res, 'Video');
  const filePath = path.join(UPLOAD_DIR, video.ruta);
  if (!fs.existsSync(filePath)) return Errores.noEncontrado(res, 'Archivo');

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Accept-Ranges', 'bytes');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (start >= fileSize || end >= fileSize) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
      return;
    }
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunkSize,
      'Content-Type': video.mimetype,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': video.mimetype });
    fs.createReadStream(filePath).pipe(res);
  }
};
