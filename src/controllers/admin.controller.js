const prisma = require('../config/db');

exports.dashboard = async (req, res) => {
  const [
    totalEmpleados,
    totalModulosEmpresa,
    empleados,
    dudasPendientes,
    encuestasRespondidas,
    totalAreas,
    totalSupervisores,
    notificacionesPendientes,
  ] = await Promise.all([
    prisma.usuario.count({ where: { rol: 'empleado', activo: true } }),
    prisma.modulo.count({ where: { activo: true, alcance: { in: ['empresa', 'ambos'] } } }),
    prisma.usuario.findMany({
      where: { rol: 'empleado', activo: true },
      include: {
        progresos: { where: { tipo: 'modulo_completado', completado: true }, select: { moduloId: true } },
        areaRel: { select: { nombre: true } },
      },
    }),
    prisma.duda.count({ where: { estado: 'pendiente' } }),
    prisma.encuestaRespuesta.groupBy({ by: ['usuarioId'], _count: { _all: true } }),
    prisma.area.count({ where: { activo: true } }),
    prisma.usuario.count({ where: { rol: 'supervisor', activo: true } }),
    prisma.notificacionRH.count({ where: { estado: 'pendiente' } }),
  ]);

  let completados = 0;
  let enCurso = 0;
  let sinIniciar = 0;

  empleados.forEach((e) => {
    const n = e.progresos.length;
    if (n >= totalModulosEmpresa && totalModulosEmpresa > 0) completados++;
    else if (n > 0) enCurso++;
    else sinIniciar++;
  });

  const pctCompletado = totalEmpleados
    ? Math.round((completados / totalEmpleados) * 100)
    : 0;

  const modulos = await prisma.modulo.findMany({
    where: { activo: true, alcance: { in: ['empresa', 'ambos'] } },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true, orden: true },
  });

  const progresoPorModulo = await Promise.all(
    modulos.map(async (m) => {
      const count = await prisma.progreso.count({
        where: { moduloId: m.id, tipo: 'modulo_completado', completado: true },
      });
      return {
        id: m.id,
        nombre: m.nombre,
        orden: m.orden,
        completados: count,
        pct: totalEmpleados ? Math.round((count / totalEmpleados) * 100) : 0,
      };
    })
  );

  const porArea = {};
  empleados.forEach((e) => {
    const area = e.areaRel?.nombre || e.area || 'Sin área';
    if (!porArea[area]) porArea[area] = { total: 0, completados: 0, enCurso: 0 };
    porArea[area].total++;
    const n = e.progresos.length;
    if (n >= totalModulosEmpresa && totalModulosEmpresa > 0) porArea[area].completados++;
    else if (n > 0) porArea[area].enCurso++;
  });

  return res.json({
    totalEmpleados,
    totalModulosEmpresa,
    completados,
    enCurso,
    sinIniciar,
    pctCompletado,
    dudasPendientes,
    encuestasCompletadas: encuestasRespondidas.length,
    notificacionesPendientes,
    totalAreas,
    totalSupervisores,
    progresoPorModulo,
    porArea: Object.entries(porArea).map(([nombre, stats]) => ({ nombre, ...stats })),
  });
};

function csv(rows, columnas) {
  const headers = columnas.join(',');
  const lines = rows.map(r => columnas.map(c => {
    const v = r[c] ?? '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(','));
  return [headers, ...lines].join('\n');
}

exports.reporteEmpleados = async (req, res) => {
  const empleados = await prisma.usuario.findMany({
    where: { rol: 'empleado' },
    include: {
      progresos: { where: { tipo: 'modulo_completado', completado: true } },
      areaRel: { select: { nombre: true } },
    },
  });
  const totalModulos = await prisma.modulo.count({ where: { activo: true, alcance: { in: ['empresa', 'ambos'] } } });
  const rows = empleados.map(e => ({
    nomina: e.nomina,
    nombre: e.nombre,
    programa: e.programa,
    area: e.areaRel?.nombre || e.area || '',
    activo: e.activo ? 'Sí' : 'No',
    modulosCompletados: e.progresos.length,
    totalModulos,
    creadoEn: e.creadoEn.toISOString(),
  }));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="empleados.csv"');
  res.send(csv(rows, ['nomina', 'nombre', 'programa', 'area', 'activo', 'modulosCompletados', 'totalModulos', 'creadoEn']));
};

exports.reporteExamenes = async (req, res) => {
  const intentos = await prisma.intentoExamen.findMany({
    include: { usuario: true, examen: { include: { modulo: true } } },
    orderBy: { iniciadoEn: 'desc' },
  });
  const rows = intentos.map(i => ({
    nomina: i.usuario.nomina, nombre: i.usuario.nombre,
    modulo: i.examen.modulo.nombre, examen: i.examen.titulo,
    calificacion: i.calificacion, aprobado: i.aprobado ? 'Sí' : 'No',
    duracionSeg: i.duracionSegundos,
    iniciadoEn: i.iniciadoEn.toISOString(),
    finalizadoEn: i.finalizadoEn?.toISOString() || '',
  }));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="examenes.csv"');
  res.send(csv(rows, ['nomina', 'nombre', 'modulo', 'examen', 'calificacion', 'aprobado', 'duracionSeg', 'iniciadoEn', 'finalizadoEn']));
};
