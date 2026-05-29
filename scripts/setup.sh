#!/usr/bin/env bash
set -e

echo "════════════════════════════════════════════════════════════"
echo "  Setup — Plataforma Inducción RR.HH. Lavín"
echo "════════════════════════════════════════════════════════════"

# Verificar Node
if ! command -v node &>/dev/null; then echo "✗ Node.js no instalado. Instala Node.js 20+ y reintenta."; exit 1; fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then echo "✗ Se requiere Node.js 20+. Versión actual: $(node -v)"; exit 1; fi
echo "✓ Node.js $(node -v)"

# Verificar Postgres
if ! command -v psql &>/dev/null; then echo "✗ PostgreSQL no instalado. Instala PostgreSQL 16+ y reintenta."; exit 1; fi
echo "✓ PostgreSQL detectado"

# .env
if [ ! -f .env ]; then
  cp .env.example .env
  RANDOM_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  sed -i.bak "s|cambia_esto_por_una_cadena_aleatoria_de_64_chars_minimo_seguridad|$RANDOM_SECRET|" .env && rm -f .env.bak
  echo "✓ .env creado con JWT_SECRET aleatorio"
else
  echo "• .env ya existe"
fi

# Crear BD si no existe (usa credenciales del .env)
DB_NAME="induccion_db"
DB_USER="lavin_user"
DB_PASS="lavin_pass"

echo "→ Creando usuario y BD en PostgreSQL (puede pedir contraseña de postgres)..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" >/dev/null

# Dependencias
echo "→ Instalando dependencias..."
npm install

echo "→ Compilando frontend Vue..."
npm run build:client

# Prisma
echo "→ Aplicando migraciones..."
npx prisma migrate deploy || npx prisma db push
npx prisma generate

# Seed
echo "→ Sembrando datos iniciales..."
node scripts/seed.js

# PM2
if ! command -v pm2 &>/dev/null; then npm install -g pm2; fi
pm2 delete induccion-rrhh 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || true

# Crear carpetas necesarias
mkdir -p uploads/videos backups

# IP local
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")
PORT=$(grep '^PORT=' .env | cut -d= -f2)
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Instalación completa"
echo "════════════════════════════════════════════════════════════"
echo "  Acceso:   http://$IP:${PORT:-3000}"
echo "  Admin:    nómina ADMIN001 / contraseña Admin2024!"
echo "  Backups:  configura cron — ver README.md"
echo "════════════════════════════════════════════════════════════"
