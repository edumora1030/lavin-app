export const HERO_COPY = {
  administrativo: {
    empresa: {
      heroBadge: 'Administrativo · Inducción a la empresa',
      heroTitle: 'Bienvenido(a) a Industrias Lavin',
      heroDesc: 'Conoce la cultura corporativa, el marco normativo general y los canales institucionales de la organización.',
      scopeLabel: 'Inducción a la empresa',
      programName: 'Programa de Inducción Administrativo',
      badgeClass: '',
    },
    puesto: {
      heroBadge: 'Administrativo · Inducción al puesto',
      heroTitle: 'Tu inducción al puesto administrativo',
      heroDesc: 'Integración a tu área, funciones específicas, herramientas del rol y relación con tu líder directo.',
      scopeLabel: 'Inducción al puesto',
      programName: 'Programa de Inducción Administrativo',
      badgeClass: '',
    },
  },
  operativo: {
    empresa: {
      heroBadge: 'Operativo · Inducción a la empresa',
      heroTitle: 'Bienvenido(a) a Industrias Lavin',
      heroDesc: 'Conoce la empresa, la cultura en planta, normas generales de seguridad y tu lugar en la organización.',
      scopeLabel: 'Inducción a la empresa',
      programName: 'Programa de Inducción Operativo',
      badgeClass: 'profile-badge--operativo',
    },
    puesto: {
      heroBadge: 'Operativo · Inducción al puesto',
      heroTitle: 'Tu inducción al puesto operativo',
      heroDesc: 'Aprende las funciones de tu estación, procedimientos de línea, herramientas del puesto y relación con tu supervisor.',
      scopeLabel: 'Inducción al puesto',
      programName: 'Programa de Inducción Operativo',
      badgeClass: 'profile-badge--operativo',
    },
  },
  ayudante_general: {
    empresa: {
      heroBadge: 'Ayudante general · Inducción a la empresa',
      heroTitle: 'Bienvenido(a) a Industrias Lavin',
      heroDesc: 'Conoce la empresa, la cultura en planta, normas generales de seguridad y tu lugar en la organización.',
      scopeLabel: 'Inducción a la empresa',
      programName: 'Programa de Inducción Ayudante general',
      badgeClass: 'profile-badge--operativo',
    },
    puesto: {
      heroBadge: 'Ayudante general · Inducción al puesto',
      heroTitle: 'Tu inducción al puesto',
      heroDesc: 'Aprende las funciones de tu área, procedimientos, herramientas del puesto y relación con tu equipo.',
      scopeLabel: 'Inducción al puesto',
      programName: 'Programa de Inducción Ayudante general',
      badgeClass: 'profile-badge--operativo',
    },
  },
};

export const PROGRAM_META = {
  administrativo: { label: 'Administrativo', programName: 'Programa de Inducción Administrativo' },
  operativo: { label: 'Operativo', programName: 'Programa de Inducción Operativo' },
  ayudante_general: { label: 'Ayudante general', programName: 'Programa de Inducción Ayudante general' },
};

export function programaLabel(programa) {
  return PROGRAM_META[programa]?.label ?? '—';
}

export const MODULE_SECTION = {
  cultura: { label: 'Cultura', anchor: 'cultura' },
  politicas: { label: 'Políticas', anchor: 'politicas' },
  herramientas: { label: 'Herramientas', anchor: 'herramientas' },
};

export function slugToSection(slug) {
  if (slug.startsWith('cultura')) return 'cultura';
  if (slug.startsWith('politicas')) return 'politicas';
  if (slug.startsWith('herramientas')) return 'herramientas';
  return slug;
}

import { resolveIconName } from './icons';

export function parseResourceDesc(descripcion) {
  if (descripcion?.startsWith('icon:')) {
    const parts = descripcion.slice(5).split('|');
    return { icon: resolveIconName(parts[0] || 'file-text'), span: parts[1] || '' };
  }
  return { icon: 'file-text', span: descripcion || '' };
}
