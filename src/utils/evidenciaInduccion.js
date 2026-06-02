const prisma = require('../config/db');
const { MODULOS_EMPRESA } = require('../../scripts/programs-data');

const SLUGS_EMPRESA = MODULOS_EMPRESA.map((m) => m.slug);

function programaWhere(programa) {
  if (!programa) return { programa: 'ambos' };
  return {
    OR: [
      { programa },
      { programa: 'ambos' },
    ],
  };
}

function mapModuloChecklist(modulo, progresosMap, intentosPorModulo) {
  const prog = progresosMap.get(modulo.id);
  const completado = !!prog?.completado;
  const intentos = intentosPorModulo.get(modulo.id) || [];
  const intentoAprobado = intentos.find((i) => i.aprobado);
  const mejorIntento = intentoAprobado || intentos[0] || null;

  return {
    id: modulo.id,
    slug: modulo.slug,
    nombre: modulo.nombre,
    orden: modulo.orden,
    requiereExamen: modulo.requiereExamen,
    completado,
    fechaCompletado: prog?.fechaCompletado || null,
    calificacion: mejorIntento?.calificacion ?? null,
    aprobado: mejorIntento?.aprobado ?? null,
    esEvaluacionFinal: modulo.slug === 'evaluacion-programa',
  };
}

async function obtenerEvidenciaInduccion(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { areaRel: { select: { nombre: true } } },
  });
  if (!usuario) return null;

  const progFilter = programaWhere(usuario.programa);

  const [modulosEmpresa, itemsPuesto, progresosChecklistPuesto, progresos, intentos] = await Promise.all([
    prisma.modulo.findMany({
      where: {
        activo: true,
        slug: { in: SLUGS_EMPRESA },
        alcance: { in: ['empresa', 'ambos'] },
        ...progFilter,
      },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        slug: true,
        nombre: true,
        orden: true,
        requiereExamen: true,
        alcance: true,
      },
    }),
    usuario.induccionPuestoHabilitada
      ? prisma.checklistPuestoItem.findMany({
          where: { activo: true },
          orderBy: { orden: 'asc' },
          select: { id: true, titulo: true, orden: true },
        })
      : Promise.resolve([]),
    usuario.induccionPuestoHabilitada
      ? prisma.checklistPuestoProgreso.findMany({
          where: { usuarioId, completado: true },
          select: { itemId: true, fechaCompletado: true },
        })
      : Promise.resolve([]),
    prisma.progreso.findMany({
      where: { usuarioId, tipo: 'modulo_completado', completado: true },
      select: { moduloId: true, completado: true, fechaCompletado: true },
    }),
    prisma.intentoExamen.findMany({
      where: { usuarioId, finalizadoEn: { not: null } },
      include: { examen: { select: { moduloId: true } } },
      orderBy: [{ aprobado: 'desc' }, { calificacion: 'desc' }, { finalizadoEn: 'desc' }],
    }),
  ]);

  const progresosMap = new Map(progresos.map((p) => [p.moduloId, p]));

  const intentosPorModulo = new Map();
  for (const intento of intentos) {
    const moduloId = intento.examen.moduloId;
    if (!intentosPorModulo.has(moduloId)) {
      intentosPorModulo.set(moduloId, []);
    }
    intentosPorModulo.get(moduloId).push(intento);
  }

  const checklistEmpresa = modulosEmpresa.map((m) =>
    mapModuloChecklist(m, progresosMap, intentosPorModulo)
  );
  const progresoPuestoMap = new Map(
    progresosChecklistPuesto.map((p) => [p.itemId, p])
  );
  const checklistPuesto = itemsPuesto.map((item) => {
    const prog = progresoPuestoMap.get(item.id);
    return {
      id: item.id,
      slug: `checklist-${item.orden}`,
      nombre: item.titulo,
      orden: item.orden,
      requiereExamen: false,
      completado: !!prog,
      fechaCompletado: prog?.fechaCompletado || null,
      calificacion: null,
      aprobado: null,
      esEvaluacionFinal: false,
    };
  });

  const evalFinal = checklistEmpresa.find((m) => m.esEvaluacionFinal) || null;
  const examenesConCalificacion = [...checklistEmpresa, ...checklistPuesto].filter(
    (m) => m.requiereExamen && m.calificacion != null
  );
  const promedioExamenes = examenesConCalificacion.length
    ? Math.round(
        examenesConCalificacion.reduce((sum, m) => sum + m.calificacion, 0) /
          examenesConCalificacion.length
      )
    : null;

  const completadosEmpresa = checklistEmpresa.filter((m) => m.completado).length;
  const completadosPuesto = checklistPuesto.filter((m) => m.completado).length;

  return {
    generadoEn: new Date(),
    empleado: {
      id: usuario.id,
      nombre: usuario.nombre,
      nomina: usuario.nomina,
      programa: usuario.programa,
      area: usuario.areaRel?.nombre || usuario.area || null,
      induccionEmpresaHabilitada: usuario.induccionEmpresaHabilitada,
      induccionPuestoHabilitada: usuario.induccionPuestoHabilitada,
    },
    induccionEmpresa: {
      habilitada: usuario.induccionEmpresaHabilitada,
      modulos: checklistEmpresa,
      completados: completadosEmpresa,
      total: checklistEmpresa.length,
      completa: checklistEmpresa.length > 0 && completadosEmpresa === checklistEmpresa.length,
    },
    induccionPuesto: {
      habilitada: usuario.induccionPuestoHabilitada,
      modulos: checklistPuesto,
      completados: completadosPuesto,
      total: checklistPuesto.length,
      completa: checklistPuesto.length > 0 && completadosPuesto === checklistPuesto.length,
    },
    evaluacionFinal: evalFinal
      ? {
          nombre: evalFinal.nombre,
          completada: evalFinal.completado,
          fechaCompletado: evalFinal.fechaCompletado,
        }
      : null,
    resumen: {
      promedioExamenes,
      examenesAprobados: examenesConCalificacion.filter((m) => m.aprobado).length,
      totalExamenes: examenesConCalificacion.length,
    },
  };
}

function esInduccionCompleta(evidencia) {
  if (!evidencia) return false;
  const tienePrograma =
    evidencia.induccionEmpresa.habilitada || evidencia.induccionPuesto.habilitada;
  if (!tienePrograma) return false;

  const empresaOk =
    !evidencia.induccionEmpresa.habilitada || evidencia.induccionEmpresa.completa;
  const puestoOk =
    !evidencia.induccionPuesto.habilitada || evidencia.induccionPuesto.completa;

  return empresaOk && puestoOk;
}

module.exports = { obtenerEvidenciaInduccion, esInduccionCompleta };
