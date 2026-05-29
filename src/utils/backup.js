// Helper invocado por backup.sh — exporta utilidades si quieres hacerlo desde Node
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function ejecutarBackup() {
  const dir = process.env.BACKUP_DIR || './backups';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `backup-${ts}.sql.gz`);
  const url = process.env.DATABASE_URL;
  const cmd = `pg_dump "${url}" | gzip > "${file}"`;

  exec(cmd, (err) => {
    const logFile = path.join(dir, 'backup.log');
    const msg = err
      ? `[${new Date().toISOString()}] ERROR: ${err.message}\n`
      : `[${new Date().toISOString()}] OK: ${file}\n`;
    fs.appendFileSync(logFile, msg);

    // Retención: borrar > 30 días
    const ahora = Date.now();
    fs.readdirSync(dir).forEach(f => {
      if (!f.endsWith('.sql.gz')) return;
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (ahora - stat.mtimeMs > 30 * 24 * 3600 * 1000) fs.unlinkSync(p);
    });
  });
}

if (require.main === module) ejecutarBackup();
module.exports = { ejecutarBackup };
