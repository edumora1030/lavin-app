#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Cargar .env
if [ -f .env ]; then export $(grep -v '^#' .env | xargs); fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
TS=$(date +%Y-%m-%d_%H-%M-%S)
FILE="$BACKUP_DIR/backup-$TS.sql.gz"

echo "[$(date -Iseconds)] Iniciando backup..." | tee -a "$BACKUP_DIR/backup.log"

if pg_dump "$DATABASE_URL" | gzip > "$FILE"; then
  echo "[$(date -Iseconds)] OK: $FILE" | tee -a "$BACKUP_DIR/backup.log"
else
  echo "[$(date -Iseconds)] ERROR al crear backup" | tee -a "$BACKUP_DIR/backup.log"
  exit 1
fi

# Retención 30 días
find "$BACKUP_DIR" -name "backup-*.sql.gz" -type f -mtime +30 -delete

echo "[$(date -Iseconds)] Backups antiguos limpiados" | tee -a "$BACKUP_DIR/backup.log"
