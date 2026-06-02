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

function modulosRequeridos(empleado, modulosEmpresa, modulosPuesto) {
  const ids = [];
  if (empleado.induccionEmpresaHabilitada) {
    ids.push(...modulosParaPrograma(modulosEmpresa, empleado.programa).map((m) => m.id));
  }
  if (empleado.induccionPuestoHabilitada) {
    ids.push(...modulosParaPrograma(modulosPuesto, empleado.programa).map((m) => m.id));
  }
  return ids;
}

function empleadoInduccionCompleta(empleado, modulosEmpresa, modulosPuesto) {
  const requeridos = modulosRequeridos(empleado, modulosEmpresa, modulosPuesto);
  if (!requeridos.length) return false;
  const completados = new Set(empleado.progresos.map((p) => p.moduloId));
  return requeridos.every((id) => completados.has(id));
}

async function listarEmpleadosResumen(req) {
  const userWhere = { rol: 'empleado', activo: true };
  if (req.usuario.rol === 'supervisor' && req.usuario.areaId) {
    userWhere.areaId = req.usuario.areaId;
  }

  const [empleados, modulosEmpresa, modulosPuesto] = await Promise.all([
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
    prisma.modulo.findMany({
      where: {
        activo: true,
        slug: { notIn: SLUGS_EMPRESA },
        alcance: { in: ['puesto', 'ambos'] },
      },
      select: { id: true, programa: true },
    }),
  ]);

  return { empleados, modulosEmpresa, modulosPuesto };
}

function mapEmpleadoResumen(empleado, modulosEmpresa, modulosPuesto) {
  const requeridos = modulosRequeridos(empleado, modulosEmpresa, modulosPuesto);
  const completadosSet = new Set(empleado.progresos.map((p) => p.moduloId));
  const modulosCompletados = requeridos.filter((id) => completadosSet.has(id)).length;
  const totalModulos = requeridos.length;
  const progreso_pct = totalModulos
    ? Math.round((modulosCompletados / totalModulos) * 100)
    : 0;
  const induccionCompleta = empleadoInduccionCompleta(empleado, modulosEmpresa, modulosPuesto);

  return {
    modulosCompletados,
    totalModulos,
    progreso_pct,
    estado: estadoLabel(modulosCompletados, totalModulos),
    induccionCompleta,
  };
}

function mapEmpleadosResumen(empleados, modulosEmpresa, modulosPuesto) {
  return empleados.map((e) => {
    const stats = mapEmpleadoResumen(e, modulosEmpresa, modulosPuesto);
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
