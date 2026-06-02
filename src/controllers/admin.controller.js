const prisma = require('../config/db');

const PROGRAMAS = ['operativo', 'administrativo'];

function bucketPrograma(programa) {
  return programa === 'administrativo' ? 'administrativo' : 'operativo';
}

function whereEmpleadosPrograma(programa) {
  if (programa === 'administrativo') {
    return { rol: 'empleado', activo: true, programa: 'administrativo' };
  }
  return {
    rol: 'empleado',
    activo: true,
    OR: [{ programa: 'operativo' }, { programa: null }],
  };
}

function metricasEmpleados(empleados, totalModulosEmpresa) {
  let completados = 0;
  let enCurso = 0;
  let sinIniciar = 0;

  empleados.forEach((e) => {
    const n = e.progresos.length;
    if (n >= totalModulosEmpresa && totalModulosEmpresa > 0) completados++;
    else if (n > 0) enCurso++;
    else sinIniciar++;
  });

  const total = empleados.length;
  return {
    total,
    completados,
    enCurso,
    sinIniciar,
    pctCompletado: total ? Math.round((completados / total) * 100) : 0,
  };
}

async function progresoPorModuloPrograma(modulos, programa, totalEmpleados) {
  const userWhere = whereEmpleadosPrograma(programa);
  return Promise.all(
    modulos.map(async (m) => {
      const count = await prisma.progreso.count({
        where: {
          moduloId: m.id,
          tipo: 'modulo_completado',
          completado: true,
          usuario: userWhere,
        },
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
}

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

  const global = metricasEmpleados(empleados, totalModulosEmpresa);

  const porPrograma = {};
  for (const programa of PROGRAMAS) {
    const lista = empleados.filter((e) => bucketPrograma(e.programa) === programa);
    porPrograma[programa] = metricasEmpleados(lista, totalModulosEmpresa);
  }

  const modulos = await prisma.modulo.findMany({
    where: { activo: true, alcance: { in: ['empresa', 'ambos'] } },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true, orden: true },
  });

  const progresoPorModuloPorPrograma = {};
  for (const programa of PROGRAMAS) {
    progresoPorModuloPorPrograma[programa] = await progresoPorModuloPrograma(
      modulos,
      programa,
      porPrograma[programa].total
    );
  }

  const progresoPorModuloGlobal = await Promise.all(
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
    completados: global.completados,
    enCurso: global.enCurso,
    sinIniciar: global.sinIniciar,
    pctCompletado: global.pctCompletado,
    porPrograma,
    dudasPendientes,
    encuestasCompletadas: encuestasRespondidas.length,
    notificacionesPendientes,
    totalAreas,
    totalSupervisores,
    progresoPorModulo: progresoPorModuloGlobal,
    progresoPorModuloPorPrograma,
    porArea: Object.entries(porArea).map(([nombre, stats]) => ({ nombre, ...stats })),
  });
};

const {
  listarEmpleadosResumen,
  mapEmpleadosResumen,
  toCsv,
  CSV_COLUMNAS,
} = require('../utils/progresoResumen');

function csv(rows, columnas) {
  return toCsv(rows, columnas).replace(/^\uFEFF/, '');
}

exports.reporteEmpleados = async (req, res) => {
  const { empleados, modulosEmpresa, checklistPuestoTotal, checklistPorUsuario } = await listarEmpleadosResumen(req);
  const rows = mapEmpleadosResumen(empleados, modulosEmpresa, checklistPuestoTotal, checklistPorUsuario);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="progreso-empleados.csv"');
  res.send(toCsv(rows, CSV_COLUMNAS));
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
