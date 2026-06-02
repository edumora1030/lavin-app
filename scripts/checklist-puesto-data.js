/** Actividades de inducción al puesto — una fila = un módulo (alcance: puesto). */
const CHECKLIST_PUESTO = [
  'Presentación con el equipo de trabajo',
  'Designación de Mentor',
  'Entrega de herramientas de trabajo',
  'Explicación de descripción de puesto',
  'Explicación y revisión de cada una de las carpetas o materiales',
  'Sistegramas y Procedimientos del Puesto',
  'Indicadores de Gestión',
  'Programas de trabajo, metas y objetivos periódicos',
  'Relaciones cliente-proveedor internas y externas',
  'Gestión de entrevistas con clientes-proveedores internos y externos',
  'Introducción general a su puesto',
  'Definir programa de Trabajo Inicial',
  'Evaluación de seguimiento',
];

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

const MODULOS_CHECKLIST_PUESTO = CHECKLIST_PUESTO.map((nombre, index) => {
  const base = slugify(nombre);
  return {
    slug: `puesto-checklist-${base}`,
    nombre,
    descripcion: `Actividad de inducción al puesto: ${nombre}`,
    programa: 'ambos',
    alcance: 'puesto',
    orden: index + 1,
    requiereExamen: false,
  };
});

const SLUGS_CHECKLIST_PUESTO = MODULOS_CHECKLIST_PUESTO.map((m) => m.slug);

module.exports = {
  CHECKLIST_PUESTO,
  MODULOS_CHECKLIST_PUESTO,
  SLUGS_CHECKLIST_PUESTO,
};
