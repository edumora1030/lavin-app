/** Icon (kebab-case) and estimated duration per official empresa module slug. */
export const MODULO_META = {
  'historia-mision-vision-valores': { icon: 'flag', duracion: '10 min' },
  'organigrama-descripcion-puesto': { icon: 'network', duracion: '10 min' },
  'terminos-laborales': { icon: 'file-text', duracion: '10 min' },
  'seguridad-higiene': { icon: 'hard-hat', duracion: '12 min' },
  'programas-empresa': { icon: 'graduation-cap', duracion: '10 min' },
  'politicas-objetivos-calidad': { icon: 'circle-check', duracion: '10 min' },
  'lineamientos-internos': { icon: 'clipboard-list', duracion: '8 min' },
  'beneficios-prestaciones': { icon: 'gift', duracion: '10 min' },
  'servicio-medico': { icon: 'stethoscope', duracion: '8 min' },
  'evaluacion-programa': { icon: 'clipboard-list', duracion: '5 min' },
};

export function getModuloMeta(slug) {
  return MODULO_META[slug] || { icon: 'file-text', duracion: '10 min' };
}

export function esModuloConfigurado(modulo) {
  return Boolean(modulo?.slug && MODULO_META[modulo.slug]);
}
