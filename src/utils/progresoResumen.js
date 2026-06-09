const prisma = require('../config/db');
const { MODULOS_EMPRESA } = require('../../scripts/programs-data');

const SLUGS_EMPRESA = MODULOS_EMPRESA.map((m) => m.slug);

function estadoLabel(completados, total) {
  if (total > 0 && completados >= total) return 'Completo';
  if (completados > 0) return 'En curso';
  return 'Pendiente';
}

function modulosParaPrograma(modulos, programa) {
  if (!programa) {
    return modulos.filter((m) => m.programa === 'ambos');
  }
  return modulos.filter((m) => m.programa === 'ambos' || m.programa === programa);
}

function requiereRecordatorios(empleado) {
  return empleado.induccionEmpresaHabilitada || empleado.induccionPuestoHabilitada;
}

function contarRequeridos(empleado, modulosEmpresa, checklistPuestoTotal, recordatoriosTotal) {
  let total = 0;
  if (empleado.induccionEmpresaHabilitada) {
    total += modulosParaPrograma(modulosEmpresa, empleado.programa).length;
  }
  if (empleado.induccionPuestoHabilitada) {
    total += checklistPuestoTotal;
  }
  if (requiereRecordatorios(empleado)) {
    total += recordatoriosTotal;
  }
  return total;
}

function contarCompletados(
  empleado,
  modulosEmpresa,
  checklistCompletados,
  checklistPuestoTotal,
  recordatoriosCompletados,
) {
  const completadosModulos = new Set(empleado.progresos.map((p) => p.moduloId));
  let done = 0;
  if (empleado.induccionEmpresaHabilitada) {
    done += modulosParaPrograma(modulosEmpresa, empleado.programa)
      .filter((m) => completadosModulos.has(m.id)).length;
  }
  if (empleado.induccionPuestoHabilitada && checklistPuestoTotal > 0) {
    done += checklistCompletados;
  }
  if (requiereRecordatorios(empleado)) {
    done += recordatoriosCompletados;
  }
  return done;
}

function empleadoInduccionCompleta(
  empleado,
  modulosEmpresa,
  checklistCompletados,
  checklistPuestoTotal,
  recordatoriosCompletados,
  recordatoriosTotal,
) {
  const empresaModulosTotal = empleado.induccionEmpresaHabilitada
    ? modulosParaPrograma(modulosEmpresa, empleado.programa).length
    : 0;
  const empresaModulosDone = empleado.induccionEmpresaHabilitada
    ? modulosParaPrograma(modulosEmpresa, empleado.programa)
        .filter((m) => new Set(empleado.progresos.map((p) => p.moduloId)).has(m.id)).length
    : 0;
  const recordatoriosOk = !requiereRecordatorios(empleado)
    || (recordatoriosTotal > 0 && recordatoriosCompletados >= recordatoriosTotal);

  const empresaOk = !empleado.induccionEmpresaHabilitada
    || (empresaModulosTotal > 0 && empresaModulosDone >= empresaModulosTotal && recordatoriosOk);
  const puestoOk = !empleado.induccionPuestoHabilitada
    || (checklistPuestoTotal > 0 && checklistCompletados >= checklistPuestoTotal && recordatoriosOk);

  return empresaOk && puestoOk;
}

async function listarEmpleadosResumen(req) {
  const userWhere = { rol: 'empleado', activo: true };
  if (req.usuario.rol === 'supervisor' && req.usuario.areaId) {
    userWhere.areaId = req.usuario.areaId;
  }

  const [empleados, modulosEmpresa, checklistPuestoTotal, recordatoriosTotal, progresosChecklist, progresosRecordatorios] = await Promise.all([
    prisma.usuario.findMany({
      where: userWhere,
      include: {
        progresos: { where: { tipo: 'modulo_completado', completado: true }, select: { moduloId: true } },
        areaRel: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    }),
    prisma.modulo.findMany({
      where: { activo: true, slug: { in: SLUGS_EMPRESA }, alcance: { in: ['empresa', 'ambos'] } },
      select: { id: true, programa: true },
    }),
    prisma.checklistPuestoItem.count({ where: { activo: true } }),
    prisma.checklistRecordatorioItem.count({ where: { activo: true } }),
    prisma.checklistPuestoProgreso.findMany({
      where: { completado: true },
      select: { usuarioId: true, itemId: true },
    }),
    prisma.checklistRecordatorioProgreso.findMany({
      where: { completado: true },
      select: { usuarioId: true, itemId: true },
    }),
  ]);

  const checklistPorUsuario = new Map();
  for (const p of progresosChecklist) {
    if (!checklistPorUsuario.has(p.usuarioId)) checklistPorUsuario.set(p.usuarioId, new Set());
    checklistPorUsuario.get(p.usuarioId).add(p.itemId);
  }

  const recordatoriosPorUsuario = new Map();
  for (const p of progresosRecordatorios) {
    if (!recordatoriosPorUsuario.has(p.usuarioId)) recordatoriosPorUsuario.set(p.usuarioId, new Set());
    recordatoriosPorUsuario.get(p.usuarioId).add(p.itemId);
  }

  return {
    empleados,
    modulosEmpresa,
    checklistPuestoTotal,
    recordatoriosTotal,
    checklistPorUsuario,
    recordatoriosPorUsuario,
  };
}

function mapEmpleadoResumen(
  empleado,
  modulosEmpresa,
  checklistPuestoTotal,
  recordatoriosTotal,
  checklistPorUsuario,
  recordatoriosPorUsuario,
) {
  const checklistCompletados = checklistPorUsuario.get(empleado.id)?.size ?? 0;
  const recordatoriosCompletados = recordatoriosPorUsuario.get(empleado.id)?.size ?? 0;
  const totalModulos = contarRequeridos(
    empleado,
    modulosEmpresa,
    checklistPuestoTotal,
    recordatoriosTotal,
  );
  const modulosCompletados = contarCompletados(
    empleado,
    modulosEmpresa,
    checklistCompletados,
    checklistPuestoTotal,
    recordatoriosCompletados,
  );
  const progreso_pct = totalModulos
    ? Math.round((modulosCompletados / totalModulos) * 100)
    : 0;
  const induccionCompleta = empleadoInduccionCompleta(
    empleado,
    modulosEmpresa,
    checklistCompletados,
    checklistPuestoTotal,
    recordatoriosCompletados,
    recordatoriosTotal,
  );

  const empresaTotal = empleado.induccionEmpresaHabilitada
    ? modulosParaPrograma(modulosEmpresa, empleado.programa).length
    : 0;
  const empresaCompletados = empleado.induccionEmpresaHabilitada
    ? modulosParaPrograma(modulosEmpresa, empleado.programa)
        .filter((m) => new Set(empleado.progresos.map((p) => p.moduloId)).has(m.id)).length
    : 0;
  const recordatoriosOk = !requiereRecordatorios(empleado)
    || (recordatoriosTotal > 0 && recordatoriosCompletados >= recordatoriosTotal);

  const empresaModulosCompleta = empleado.induccionEmpresaHabilitada
    && empresaTotal > 0
    && empresaCompletados >= empresaTotal;

  const puestoModulosCompleta = empleado.induccionPuestoHabilitada
    && checklistPuestoTotal > 0
    && checklistCompletados >= checklistPuestoTotal;

  const empresaCompleta = empresaModulosCompleta && recordatoriosOk;
  const puestoCompleta = puestoModulosCompleta && recordatoriosOk;

  return {
    modulosCompletados,
    totalModulos,
    progreso_pct,
    estado: estadoLabel(modulosCompletados, totalModulos),
    induccionCompleta,
    empresaCompleta,
    puestoCompleta,
    empresaModulosCompleta,
    puestoModulosCompleta,
    recordatoriosCompleta: recordatoriosOk,
  };
}

function mapEmpleadosResumen(
  empleados,
  modulosEmpresa,
  checklistPuestoTotal,
  recordatoriosTotal,
  checklistPorUsuario,
  recordatoriosPorUsuario,
) {
  return empleados.map((e) => {
    const stats = mapEmpleadoResumen(
      e,
      modulosEmpresa,
      checklistPuestoTotal,
      recordatoriosTotal,
      checklistPorUsuario,
      recordatoriosPorUsuario,
    );
    return {
      nomina: e.nomina,
      nombre: e.nombre,
      programa: e.programa || '',
      area: e.areaRel?.nombre || e.area || '',
      ...stats,
    };
  });
}

function toCsv(rows, columnas) {
  const headers = columnas.join(',');
  const lines = rows.map((r) =>
    columnas
      .map((c) => {
        const v = r[c] ?? '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      })
      .join(',')
  );
  return `\uFEFF${[headers, ...lines].join('\n')}`;
}

const CSV_COLUMNAS = [
  'nomina',
  'nombre',
  'programa',
  'area',
  'modulosCompletados',
  'totalModulos',
  'progreso_pct',
  'estado',
];

module.exports = {
  listarEmpleadosResumen,
  mapEmpleadoResumen,
  mapEmpleadosResumen,
  toCsv,
  CSV_COLUMNAS,
};
