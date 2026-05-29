// 10 módulos temáticos de Inducción a la empresa
const MODULOS_EMPRESA = [
  {
    slug: 'historia-mision-vision-valores',
    nombre: 'Historia, misión, visión y valores',
    descripcion: 'Conoce el origen de Lavín, su propósito y los principios que guían a la organización.',
    orden: 1,
    steps: [
      { title: 'Historia de Lavín', text: 'Fundación, crecimiento y presencia actual en el mercado.' },
      { title: 'Misión y visión', text: 'Propósito de la empresa y hacia dónde se dirige.' },
      { title: 'Valores corporativos', text: 'Principios que guían el comportamiento de todos los colaboradores.' },
    ],
    resources: [
      { icon: 'book-open', title: 'Manual corporativo Lavín', span: 'PDF · Cultura organizacional' },
      { icon: 'handshake', title: 'Código de conducta', span: 'PDF · Valores y ética' },
      { icon: 'building-2', title: 'Presentación institucional', span: 'PDF · Empresa y mercados' },
    ],
  },
  {
    slug: 'organigrama-descripcion-puesto',
    nombre: 'Organigrama y descripción de puesto',
    descripcion: 'Estructura general de la empresa y cómo se organizan las áreas.',
    orden: 2,
    steps: [
      { title: 'Organigrama general', text: 'Áreas principales, directivos y líneas de reporte.' },
      { title: 'Tu área dentro de la empresa', text: 'Ubicación de tu departamento en la estructura.' },
      { title: 'Descripción general de funciones', text: 'Roles y responsabilidades genéricas por nivel.' },
    ],
    resources: [
      { icon: 'clipboard-list', title: 'Organigrama corporativo', span: 'PDF · Estructura organizacional' },
      { icon: 'briefcase', title: 'Catálogo de puestos', span: 'PDF · Funciones por área' },
    ],
  },
  {
    slug: 'terminos-laborales',
    nombre: 'Términos laborales',
    descripcion: 'Condiciones de trabajo, horarios, contratación y relación laboral.',
    orden: 3,
    steps: [
      { title: 'Tipo de contratación', text: 'Modalidades de contrato, periodos de prueba y planta.' },
      { title: 'Horarios y jornadas', text: 'Turnos, hora de entrada/salida, tiempo extra y descansos.' },
      { title: 'Nómina y pagos', text: 'Periodicidad de pago, recibos y deducciones.' },
    ],
    resources: [
      { icon: 'file-text', title: 'Reglamento interno de trabajo', span: 'PDF · Normativa general' },
      { icon: 'clipboard-list', title: 'Guía de nómina', span: 'PDF · Conceptos de pago' },
    ],
  },
  {
    slug: 'seguridad-higiene',
    nombre: 'Seguridad e Higiene',
    descripcion: 'Normas de seguridad industrial, prevención de riesgos e higiene en el trabajo.',
    orden: 4,
    steps: [
      { title: 'Política de seguridad', text: 'Compromiso de la empresa con la seguridad de los colaboradores.' },
      { title: 'Equipo de protección personal', text: 'EPP obligatorio según el área de trabajo.' },
      { title: 'Rutas de evacuación y emergencias', text: 'Puntos de reunión, alarmas y brigadas.' },
      { title: 'Higiene industrial', text: 'Limpieza, orden y manejo de sustancias.' },
    ],
    resources: [
      { icon: 'hard-hat', title: 'Manual de seguridad industrial', span: 'PDF · EPP y prevención' },
      { icon: 'siren', title: 'Plan de emergencias', span: 'PDF · Evacuación y brigadas' },
      { icon: 'brush', title: 'Programa de orden y limpieza', span: 'PDF · 5S' },
    ],
  },
  {
    slug: 'programas-empresa',
    nombre: 'Programas de Empresa',
    descripcion: 'Programas internos de desarrollo, bienestar y mejora continua.',
    orden: 5,
    steps: [
      { title: 'Programas de capacitación', text: 'Plataformas de aprendizaje y cursos disponibles.' },
      { title: 'Programas de bienestar', text: 'Actividades deportivas, culturales y de salud.' },
      { title: 'Mejora continua', text: 'Iniciativas de calidad, innovación y sugerencias.' },
    ],
    resources: [
      { icon: 'graduation-cap', title: 'Catálogo de capacitaciones', span: 'PDF · Cursos disponibles' },
      { icon: 'person-standing', title: 'Programa de bienestar', span: 'PDF · Actividades y beneficios' },
    ],
  },
  {
    slug: 'politicas-objetivos-calidad',
    nombre: 'Políticas y objetivos de calidad',
    descripcion: 'Sistema de gestión de calidad, certificaciones y objetivos de la organización.',
    orden: 6,
    steps: [
      { title: 'Política de calidad', text: 'Declaración de calidad y compromiso con el cliente.' },
      { title: 'Objetivos de calidad', text: 'Metas medibles de la organización para el periodo actual.' },
      { title: 'Certificaciones', text: 'ISO, normas y estándares que rigen los procesos.' },
    ],
    resources: [
      { icon: 'circle-check', title: 'Manual de calidad', span: 'PDF · Sistema de gestión' },
      { icon: 'bar-chart-3', title: 'Indicadores de calidad', span: 'PDF · Objetivos y metas' },
    ],
  },
  {
    slug: 'lineamientos-internos',
    nombre: 'Lineamientos internos',
    descripcion: 'Reglas de convivencia, uso de instalaciones y comportamiento esperado.',
    orden: 7,
    steps: [
      { title: 'Código de vestimenta', text: 'Uniforme, presentación personal y restricciones.' },
      { title: 'Uso de instalaciones', text: 'Comedor, estacionamiento, áreas comunes y restricciones.' },
      { title: 'Comunicación y conducta', text: 'Canales oficiales, respeto y manejo de conflictos.' },
    ],
    resources: [
      { icon: 'clipboard-list', title: 'Lineamientos de convivencia', span: 'PDF · Reglas internas' },
      { icon: 'lock', title: 'Política de privacidad y datos', span: 'PDF · Confidencialidad' },
    ],
  },
  {
    slug: 'beneficios-prestaciones',
    nombre: 'Beneficios y prestaciones',
    descripcion: 'Prestaciones de ley, superiores y programas de apoyo al colaborador.',
    orden: 8,
    steps: [
      { title: 'Prestaciones de ley', text: 'Aguinaldo, vacaciones, prima vacacional y reparto de utilidades.' },
      { title: 'Prestaciones superiores', text: 'Seguro de gastos médicos, fondo de ahorro, vales, etc.' },
      { title: 'Trámites con RR.HH.', text: 'Cómo solicitar constancias, permisos y créditos.' },
    ],
    resources: [
      { icon: 'file-text', title: 'Catálogo de beneficios', span: 'PDF · Prestaciones corporativas' },
      { icon: 'clipboard-list', title: 'Guía de trámites RR.HH.', span: 'PDF · Solicitudes y formatos' },
    ],
  },
  {
    slug: 'servicio-medico',
    nombre: 'Servicio médico',
    descripcion: 'Servicio médico interno, atención de urgencias y programas de salud.',
    orden: 9,
    steps: [
      { title: 'Servicio médico en planta', text: 'Ubicación, horarios y servicios disponibles.' },
      { title: 'Atención de urgencias', text: 'Procedimiento ante accidentes o malestar durante la jornada.' },
      { title: 'Programas de salud preventiva', text: 'Campañas de vacunación, exámenes médicos y detección oportuna.' },
    ],
    resources: [
      { icon: 'hospital', title: 'Directorio médico', span: 'PDF · Contactos y ubicación' },
      { icon: 'pill', title: 'Programa de salud preventiva', span: 'PDF · Campañas y calendario' },
    ],
  },
  {
    slug: 'evaluacion-programa',
    nombre: 'Evaluación del programa',
    descripcion: 'Encuesta de satisfacción sobre tu experiencia en el programa de inducción.',
    orden: 10,
    steps: [
      { title: 'Completa la encuesta', text: 'Responde la encuesta de satisfacción para finalizar tu inducción.' },
    ],
    resources: [],
  },
];

const ENCUESTA_PREGUNTAS = [
  { texto: '¿La información proporcionada fue clara y comprensible?', orden: 1 },
  { texto: '¿El contenido del programa fue relevante para tu trabajo?', orden: 2 },
  { texto: '¿Te sientes preparado(a) para desempeñar tus funciones?', orden: 3 },
  { texto: '¿Cómo calificarías la organización general del programa de inducción?', orden: 4 },
  { texto: '¿Tienes algún comentario o sugerencia para mejorar el programa?', orden: 5 },
];

const AREAS_EJEMPLO = [
  'Producción',
  'Calidad',
  'Recursos Humanos',
  'Mantenimiento',
  'Almacén',
  'Administración',
];

function itemsParaModuloEmpresa(slug) {
  const modulo = MODULOS_EMPRESA.find((m) => m.slug === slug);
  if (!modulo) return [];

  if (slug === 'evaluacion-programa') {
    return [{
      tipo: 'paso',
      titulo: 'Encuesta de satisfacción',
      descripcion: 'Responde la encuesta para finalizar tu inducción.',
      orden: 1,
    }];
  }

  return [{
    tipo: 'paso',
    titulo: modulo.nombre,
    descripcion: modulo.descripcion,
    orden: 1,
  }];
}

module.exports = { MODULOS_EMPRESA, ENCUESTA_PREGUNTAS, AREAS_EJEMPLO, itemsParaModuloEmpresa };
