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

// Preguntas de examen por módulo (Inducción a la empresa)
const EXAMENES_EMPRESA = {
  'historia-mision-vision-valores': {
    titulo: 'Examen — Historia, misión, visión y valores',
    descripcion: 'Evalúa lo aprendido sobre la bienvenida a Industrias Lavín.',
    preguntas: [
      {
        texto: '¿Cuántos años de experiencia tiene Grupo Lavín?',
        opciones: [
          { texto: '15 años', esCorrecta: false },
          { texto: 'Más de 40 años', esCorrecta: true },
          { texto: '25 años', esCorrecta: false },
        ],
      },
      {
        texto: '¿Cuál es uno de los valores de Industrias Lavín?',
        opciones: [
          { texto: 'Individualismo', esCorrecta: false },
          { texto: 'Competencia interna', esCorrecta: false },
          { texto: 'Honradez', esCorrecta: true },
        ],
      },
      {
        texto: '¿Cuál es una de las etapas del proceso operativo?',
        opciones: [
          { texto: 'Distribución', esCorrecta: true },
          { texto: 'Publicidad política', esCorrecta: false },
          { texto: 'Recursos electorales', esCorrecta: false },
        ],
      },
    ],
  },
  'terminos-laborales': {
    titulo: 'Examen — Términos laborales',
    descripcion: 'Evalúa lo aprendido sobre condiciones y normas laborales.',
    preguntas: [
      {
        texto: '¿Cuántas faltas injustificadas pueden ser motivo de terminación laboral en un periodo de 30 días?',
        opciones: [
          { texto: 'Más de tres faltas', esCorrecta: true },
          { texto: 'Una falta', esCorrecta: false },
          { texto: 'Cinco retardos', esCorrecta: false },
        ],
      },
      {
        texto: '¿Qué debe hacer un colaborador en caso de perder su credencial institucional?',
        opciones: [
          { texto: 'Comprar una nueva por su cuenta', esCorrecta: false },
          { texto: 'Reportarla inmediatamente para reposición', esCorrecta: true },
          { texto: 'Esperar al siguiente mes', esCorrecta: false },
        ],
      },
      {
        texto: '¿Cuándo pueden realizarse horas extras?',
        opciones: [
          { texto: 'Cuando el colaborador quiera', esCorrecta: false },
          { texto: 'Solo con autorización del jefe inmediato', esCorrecta: true },
          { texto: 'Únicamente en domingo', esCorrecta: false },
        ],
      },
    ],
  },
  'seguridad-higiene': {
    titulo: 'Examen — Seguridad e Higiene',
    descripcion: 'Evalúa lo aprendido sobre seguridad industrial e higiene.',
    preguntas: [
      {
        texto: '¿Quién tiene la responsabilidad exclusiva del control de puertas y accesos?',
        opciones: [
          { texto: 'Recursos Humanos', esCorrecta: false },
          { texto: 'Vigilancia', esCorrecta: true },
          { texto: 'Dirección General', esCorrecta: false },
        ],
      },
      {
        texto: '¿Qué debe hacerse durante una evacuación?',
        opciones: [
          { texto: 'Regresar por pertenencias', esCorrecta: false },
          { texto: 'Correr para salir rápido', esCorrecta: false },
          { texto: 'Seguir instrucciones de la brigada', esCorrecta: true },
        ],
      },
      {
        texto: '¿Qué es obligatorio portar dentro de las instalaciones?',
        opciones: [
          { texto: 'Audífonos', esCorrecta: false },
          { texto: 'Gafete institucional', esCorrecta: true },
          { texto: 'Mochila personal', esCorrecta: false },
        ],
      },
    ],
  },
  'programas-empresa': {
    titulo: 'Examen — Programas de Empresa',
    descripcion: 'Evalúa lo aprendido sobre los programas internos de la empresa.',
    preguntas: [
      {
        texto: '¿Qué color de pluma debe utilizarse en los registros oficiales?',
        opciones: [
          { texto: 'Roja', esCorrecta: false },
          { texto: 'Verde', esCorrecta: false },
          { texto: 'Azul o negra', esCorrecta: true },
        ],
      },
      {
        texto: '¿Qué busca la Campaña SOL?',
        opciones: [
          { texto: 'Crear un ambiente limpio y ordenado', esCorrecta: true },
          { texto: 'Reducir horarios laborales', esCorrecta: false },
          { texto: 'Cambiar uniformes', esCorrecta: false },
        ],
      },
      {
        texto: '¿Qué debe incluir todo registro documental?',
        opciones: [
          { texto: 'Firma, iniciales y fecha', esCorrecta: true },
          { texto: 'Solo nombre completo', esCorrecta: false },
          { texto: 'Únicamente el área', esCorrecta: false },
        ],
      },
    ],
  },
  'politicas-objetivos-calidad': {
    titulo: 'Examen — Políticas y objetivos de calidad',
    descripcion: 'Evalúa lo aprendido sobre calidad y objetivos organizacionales.',
    preguntas: [
      {
        texto: '¿Cuál es uno de los objetivos de calidad de la empresa?',
        opciones: [
          { texto: 'Reducir capacitación', esCorrecta: false },
          { texto: 'Mejorar el nivel de servicio al cliente', esCorrecta: true },
          { texto: 'Eliminar auditorías', esCorrecta: false },
        ],
      },
      {
        texto: 'Todas nuestras acciones están alineadas con nuestra misión, visión y valores organizacionales.',
        opciones: [
          { texto: 'Verdadero', esCorrecta: true },
          { texto: 'Falso', esCorrecta: false },
        ],
      },
      {
        texto: '¿La calidad es responsabilidad de quién?',
        opciones: [
          { texto: 'Solo del área de calidad', esCorrecta: false },
          { texto: 'Únicamente de supervisores', esCorrecta: false },
          { texto: 'De todos los colaboradores', esCorrecta: true },
        ],
      },
    ],
  },
  'lineamientos-internos': {
    titulo: 'Examen — Lineamientos internos',
    descripcion: 'Evalúa lo aprendido sobre reglas de convivencia y conducta.',
    preguntas: [
      {
        texto: '¿Qué está prohibido dentro de las instalaciones?',
        opciones: [
          { texto: 'Consumir alcohol o drogas', esCorrecta: true },
          { texto: 'Usar uniforme', esCorrecta: false },
          { texto: 'Tomar agua', esCorrecta: false },
        ],
      },
      {
        texto: '¿Cómo deben mantenerse las relaciones con proveedores y clientes?',
        opciones: [
          { texto: 'Con favoritismos', esCorrecta: false },
          { texto: 'Bajo principios éticos y transparentes', esCorrecta: true },
          { texto: 'Solo mediante contratos verbales', esCorrecta: false },
        ],
      },
      {
        texto: '¿Qué debe proteger cada colaborador?',
        opciones: [
          { texto: 'Información y activos de la empresa', esCorrecta: true },
          { texto: 'Únicamente sus objetos personales', esCorrecta: false },
          { texto: 'Solamente los correos electrónicos', esCorrecta: false },
        ],
      },
    ],
  },
  'beneficios-prestaciones': {
    titulo: 'Examen — Beneficios y prestaciones',
    descripcion: 'Evalúa lo aprendido sobre prestaciones y beneficios laborales.',
    preguntas: [
      {
        texto: '¿Cuántos días de vacaciones corresponden durante el primer año laboral?',
        opciones: [
          { texto: '6 días', esCorrecta: false },
          { texto: '12 días', esCorrecta: true },
          { texto: '20 días', esCorrecta: false },
        ],
      },
      {
        texto: 'La prima vacacional aumenta dependiendo de la antigüedad laboral del colaborador',
        opciones: [
          { texto: 'Falso', esCorrecta: false },
          { texto: 'Verdadero', esCorrecta: true },
        ],
      },
      {
        texto: '¿Qué requisito debe cumplirse para recibir el premio de puntualidad y asistencia?',
        opciones: [
          { texto: 'No tener faltas ni retardos', esCorrecta: true },
          { texto: 'Trabajar domingos', esCorrecta: false },
          { texto: 'Tener horas extras', esCorrecta: false },
        ],
      },
    ],
  },
  'servicio-medico': {
    titulo: 'Examen — Servicio médico',
    descripcion: 'Evalúa lo aprendido sobre el servicio médico y programas de salud.',
    preguntas: [
      {
        texto: '¿Qué debe hacer un colaborador si presenta síntomas de enfermedad fuera de la empresa?',
        opciones: [
          { texto: 'Ignorarlos', esCorrecta: false },
          { texto: 'Acudir al IMSS correspondiente', esCorrecta: true },
          { texto: 'Presentarse directamente a trabajar', esCorrecta: false },
        ],
      },
      {
        texto: '¿Cuántos días laborables con goce de sueldo corresponden por paternidad?',
        opciones: [
          { texto: '2 días', esCorrecta: false },
          { texto: '5 días', esCorrecta: true },
          { texto: '10 días', esCorrecta: false },
        ],
      },
      {
        texto: '¿Qué busca promover la NOM-035?',
        opciones: [
          { texto: 'Más horas extras', esCorrecta: false },
          { texto: 'Un entorno organizacional favorable', esCorrecta: true },
          { texto: 'Cambios de uniforme', esCorrecta: false },
        ],
      },
    ],
  },
};

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

module.exports = {
  MODULOS_EMPRESA,
  EXAMENES_EMPRESA,
  ENCUESTA_PREGUNTAS,
  AREAS_EJEMPLO,
  itemsParaModuloEmpresa,
};
