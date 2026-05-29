require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/db');
const { MODULOS_EMPRESA, ENCUESTA_PREGUNTAS, AREAS_EJEMPLO, itemsParaModuloEmpresa } = require('./programs-data');

async function main() {
  console.log('🌱 Iniciando seed...');

  // --- Áreas ---
  for (const nombre of AREAS_EJEMPLO) {
    await prisma.area.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`✓ ${AREAS_EJEMPLO.length} áreas creadas/verificadas.`);

  // --- Admin (RH) ---
  const adminExiste = await prisma.usuario.findUnique({ where: { nomina: 'ADMIN001' } });
  if (!adminExiste) {
    const hash = await bcrypt.hash('Admin2024!', 10);
    await prisma.usuario.create({
      data: {
        nombre: 'Administrador RR.HH.',
        nomina: 'ADMIN001',
        email: 'admin@lavin.com.mx',
        password: hash,
        rol: 'admin',
        primerLogin: false,
        activo: true,
      },
    });
    console.log('✓ Admin creado: ADMIN001 / Admin2024!');
  } else {
    console.log('• Admin ya existe.');
  }

  // --- Supervisor (Encargado de área) ejemplo ---
  const areaProduccion = await prisma.area.findUnique({ where: { nombre: 'Producción' } });
  const supExiste = await prisma.usuario.findUnique({ where: { nomina: 'SUP001' } });
  if (!supExiste) {
    const hash = await bcrypt.hash('Super2024!', 10);
    await prisma.usuario.create({
      data: {
        nombre: 'Encargado Producción',
        nomina: 'SUP001',
        email: 'encargado@lavin.com.mx',
        password: hash,
        rol: 'supervisor',
        areaId: areaProduccion?.id || null,
        primerLogin: false,
        activo: true,
      },
    });
    console.log('✓ Supervisor creado: SUP001 / Super2024!');
  } else {
    console.log('• Supervisor ya existe.');
  }

  // --- 10 módulos de Inducción a la empresa ---
  const slugsOficiales = MODULOS_EMPRESA.map((m) => m.slug);

  for (const m of MODULOS_EMPRESA) {
    const existente = await prisma.modulo.findUnique({ where: { slug: m.slug } });
    let moduloId;

    if (existente) {
      moduloId = existente.id;
      await prisma.modulo.update({
        where: { id: moduloId },
        data: { descripcion: m.descripcion, nombre: m.nombre, orden: m.orden },
      });
      await prisma.itemModulo.deleteMany({ where: { moduloId } });
      console.log(`• Módulo actualizado: ${m.slug}`);
    } else {
      const creado = await prisma.modulo.create({
        data: {
          slug: m.slug,
          nombre: m.nombre,
          descripcion: m.descripcion,
          programa: 'ambos',
          alcance: 'empresa',
          orden: m.orden,
          requiereExamen: false,
        },
      });
      moduloId = creado.id;
      console.log(`✓ Módulo creado: ${m.slug}`);
    }

    const items = itemsParaModuloEmpresa(m.slug);
    for (const it of items) {
      await prisma.itemModulo.create({ data: { ...it, moduloId } });
    }
    console.log(`  → ${items.length} ítems`);
  }

  const extras = await prisma.modulo.findMany({
    where: {
      activo: true,
      slug: { notIn: slugsOficiales },
      OR: [{ alcance: 'empresa' }, { alcance: 'ambos', programa: 'ambos' }],
    },
  });
  for (const extra of extras) {
    await prisma.modulo.update({ where: { id: extra.id }, data: { activo: false } });
    console.log(`• Módulo desactivado (fuera de lista): ${extra.slug}`);
  }

  // --- Encuesta de satisfacción (preguntas default) ---
  const existingCount = await prisma.encuestaPregunta.count();
  if (existingCount === 0) {
    for (const p of ENCUESTA_PREGUNTAS) {
      await prisma.encuestaPregunta.create({ data: p });
    }
    console.log(`✓ ${ENCUESTA_PREGUNTAS.length} preguntas de encuesta creadas.`);
  } else {
    console.log('• Preguntas de encuesta ya existen.');
  }

  console.log('✅ Seed completo.');
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
