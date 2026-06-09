require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/db');
const {
  MODULOS_EMPRESA,
  EXAMENES_EMPRESA,
  ENCUESTA_PREGUNTAS,
  AREAS_EJEMPLO,
  itemsParaModuloEmpresa,
} = require('./programs-data');

async function seedExamenModulo(moduloId, examData) {
  const existente = await prisma.examen.findFirst({ where: { moduloId } });
  let examenId;

  if (existente) {
    examenId = existente.id;
    await prisma.examen.update({
      where: { id: examenId },
      data: {
        titulo: examData.titulo,
        descripcion: examData.descripcion || '',
        intentosPermitidos: examData.intentosPermitidos ?? 3,
        calificacionMinima: examData.calificacionMinima ?? 70,
        activo: true,
      },
    });
    await prisma.pregunta.deleteMany({ where: { examenId } });
  } else {
    const creado = await prisma.examen.create({
      data: {
        moduloId,
        titulo: examData.titulo,
        descripcion: examData.descripcion || '',
        intentosPermitidos: examData.intentosPermitidos ?? 3,
        calificacionMinima: examData.calificacionMinima ?? 70,
      },
    });
    examenId = creado.id;
  }

  for (let i = 0; i < examData.preguntas.length; i++) {
    const p = examData.preguntas[i];
    await prisma.pregunta.create({
      data: {
        examenId,
        texto: p.texto,
        orden: i + 1,
        opciones: {
          create: p.opciones.map((o, j) => ({
            texto: o.texto,
            esCorrecta: o.esCorrecta,
            orden: j + 1,
          })),
        },
      },
    });
  }
}

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
    const examData = EXAMENES_EMPRESA[m.slug];
    const existente = await prisma.modulo.findUnique({ where: { slug: m.slug } });
    let moduloId;

    if (existente) {
      moduloId = existente.id;
      await prisma.modulo.update({
        where: { id: moduloId },
        data: {
          descripcion: m.descripcion,
          nombre: m.nombre,
          orden: m.orden,
          requiereExamen: !!examData,
        },
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
          requiereExamen: !!examData,
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

    if (examData) {
      await seedExamenModulo(moduloId, examData);
      console.log(`  → examen con ${examData.preguntas.length} preguntas`);
    }
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

  // --- Checklist inducción al puesto (tabla dedicada, no módulos) ---
  const { CHECKLIST_PUESTO } = require('./checklist-puesto-data');
  for (let i = 0; i < CHECKLIST_PUESTO.length; i++) {
    const titulo = CHECKLIST_PUESTO[i];
    const orden = i + 1;
    const existente = await prisma.checklistPuestoItem.findFirst({ where: { orden } });
    if (existente) {
      await prisma.checklistPuestoItem.update({
        where: { id: existente.id },
        data: { titulo, activo: true },
      });
    } else {
      await prisma.checklistPuestoItem.create({ data: { titulo, orden } });
      console.log(`✓ Checklist: ${titulo}`);
    }
  }
  const totalChecklist = await prisma.checklistPuestoItem.count({ where: { activo: true } });
  console.log(`✓ ${totalChecklist} actividades en checklist de puesto.`);

  const { CHECKLIST_RECORDATORIOS } = require('./checklist-recordatorios-data');
  for (const rec of CHECKLIST_RECORDATORIOS) {
    const existente = await prisma.checklistRecordatorioItem.findUnique({ where: { slug: rec.slug } });
    if (existente) {
      await prisma.checklistRecordatorioItem.update({
        where: { id: existente.id },
        data: { titulo: rec.titulo, descripcion: rec.descripcion, orden: rec.orden, activo: true },
      });
    } else {
      await prisma.checklistRecordatorioItem.create({ data: rec });
      console.log(`✓ Recordatorio: ${rec.titulo}`);
    }
  }
  const totalRec = await prisma.checklistRecordatorioItem.count({ where: { activo: true } });
  console.log(`✓ ${totalRec} recordatorios importantes.`);

  const legacyPuesto = await prisma.modulo.findMany({
    where: { alcance: 'puesto', slug: { startsWith: 'puesto-checklist-' } },
  });
  for (const m of legacyPuesto) {
    await prisma.modulo.update({ where: { id: m.id }, data: { activo: false } });
  }
  if (legacyPuesto.length) {
    console.log(`• ${legacyPuesto.length} módulos legacy de puesto desactivados.`);
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

  // --- Vincular videos existentes al primer ítem de su módulo ---
  const videosConModulo = await prisma.video.findMany({
    where: { activo: true, moduloId: { not: null } },
  });
  let videosVinculados = 0;
  for (const video of videosConModulo) {
    const item = await prisma.itemModulo.findFirst({
      where: { moduloId: video.moduloId, activo: true },
      orderBy: { orden: 'asc' },
    });
    if (!item || item.videoUrl) continue;
    await prisma.itemModulo.update({
      where: { id: item.id },
      data: { videoUrl: `/api/videos/${video.id}/stream` },
    });
    videosVinculados++;
  }
  if (videosVinculados) {
    console.log(`✓ ${videosVinculados} video(s) vinculados a ítems de módulo.`);
  }

  console.log('✅ Seed completo.');
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
