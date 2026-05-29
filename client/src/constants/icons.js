import {
  BarChart3,
  BookOpen,
  Briefcase,
  Brush,
  Building2,
  CircleCheck,
  ClipboardList,
  Factory,
  FileText,
  Flag,
  Gift,
  GraduationCap,
  Handshake,
  HardHat,
  Hospital,
  Lightbulb,
  Lock,
  Network,
  PersonStanding,
  Pill,
  Siren,
  Stethoscope,
} from '@lucide/vue';

/** Maps legacy emoji / aliases to Lucide icon names (kebab-case). */
const ICON_ALIASES = {
  '📘': 'book-open',
  '🤝': 'handshake',
  '🏢': 'building-2',
  '📋': 'clipboard-list',
  '💼': 'briefcase',
  '📄': 'file-text',
  '🦺': 'hard-hat',
  '🚨': 'siren',
  '🧹': 'brush',
  '🎓': 'graduation-cap',
  '🏃': 'person-standing',
  '✅': 'circle-check',
  '📊': 'bar-chart-3',
  '🔒': 'lock',
  '🏥': 'hospital',
  '💊': 'pill',
  '🏭': 'factory',
};

const ICON_MAP = {
  FileText,
  BookOpen,
  Handshake,
  Building2,
  ClipboardList,
  Briefcase,
  HardHat,
  Siren,
  Brush,
  GraduationCap,
  PersonStanding,
  CircleCheck,
  BarChart3,
  Lock,
  Hospital,
  Pill,
  Factory,
  Flag,
  Gift,
  Lightbulb,
  Network,
  Stethoscope,
};

export function resolveIconName(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'file-text';
  if (ICON_ALIASES[raw]) return ICON_ALIASES[raw];
  return raw.replace(/_/g, '-').toLowerCase();
}

export function toLucideComponentName(iconName) {
  return resolveIconName(iconName)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function getIconComponent(name) {
  const key = toLucideComponentName(name);
  return ICON_MAP[key] || FileText;
}
