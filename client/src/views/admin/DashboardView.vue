<template>
  <div class="db-root">
    <div class="admin-page-header">
      <h1>Dashboard</h1>
      <p>Resumen del programa de inducción</p>
    </div>

    <p v-if="loading" style="color:var(--slate-500)">Cargando métricas…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else-if="data">

      <!-- ── FILTROS / TABS ─────────────────────────────── -->
      <div class="db-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="db-tab"
          :class="{ 'db-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="15" stroke-width="2" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════
           VENTANA: GENERAL
      ══════════════════════════════════════════════════ -->
      <section v-if="activeTab === 'general'" class="db-window db-window--general">
        <div class="db-window__kpis">
          <div
            v-for="k in globalKpiCards"
            :key="k.label"
            class="metric-card"
            :class="{ 'metric-card--highlight': k.highlight }"
          >
            <div>
              <div class="metric-label">{{ k.label }}</div>
              <div class="metric-value">{{ k.value }}</div>
              <div v-if="k.sub" class="metric-sub">{{ k.sub }}</div>
            </div>
            <div class="metric-icon" :class="k.iconClass">
              <component :is="k.icon" :size="22" stroke-width="2" />
            </div>
          </div>
        </div>

        <div class="db-charts-row">
          <div class="db-chart-card">
            <h3 class="db-chart-title">Comparativa por programa</h3>
            <div class="db-chart-wrap">
              <Bar v-if="comparativaChart" :data="comparativaChart" :options="comparativaOptions" />
            </div>
          </div>
          <div class="db-chart-card">
            <h3 class="db-chart-title">Progreso por área</h3>
            <div class="db-chart-wrap">
              <Bar v-if="areasChart" :data="areasChart" :options="areasOptions" />
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════
           VENTANA: OPERATIVOS / ADMINISTRATIVOS
      ══════════════════════════════════════════════════ -->
      <template v-for="prog in programas" :key="prog.key">
        <section
          v-if="activeTab === prog.key"
          class="db-window"
          :class="`db-window--${prog.key}`"
        >
          <!-- Métricas -->
          <div class="db-window__kpis">
            <div
              v-for="k in kpiCardsFor(prog.key)"
              :key="`${prog.key}-${k.label}`"
              class="metric-card"
              :class="`metric-card--${prog.key}`"
            >
              <div>
                <div class="metric-label">{{ k.label }}</div>
                <div class="metric-value">{{ k.value }}</div>
                <div v-if="k.sub" class="metric-sub">{{ k.sub }}</div>
              </div>
              <div class="metric-icon" :class="k.iconClass">
                <component :is="k.icon" :size="22" stroke-width="2" />
              </div>
            </div>
          </div>

          <!-- Gráficas -->
          <div class="db-charts-row">
            <div class="db-chart-card db-chart-card--sm">
              <h3 class="db-chart-title">Estado de inducción</h3>
              <div class="db-chart-wrap db-chart-wrap--donut">
                <Doughnut
                  v-if="estadoChartFor(prog.key)"
                  :data="estadoChartFor(prog.key)"
                  :options="estadoOptions"
                />
              </div>
            </div>
            <div class="db-chart-card db-chart-card--lg">
              <h3 class="db-chart-title">Avance por módulo</h3>
              <div class="db-chart-wrap db-chart-wrap--tall">
                <Bar
                  v-if="modulosChartFor(prog.key)"
                  :data="modulosChartFor(prog.key)"
                  :options="modulosOptionsFor(prog.key)"
                />
              </div>
            </div>
          </div>
        </section>
      </template>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import {
  Users,
  CircleCheck,
  Clock,
  CircleAlert,
  CircleHelp,
  ClipboardList,
  BookOpen,
  Bell,
  Globe,
  HardHat,
  Briefcase,
} from '@lucide/vue';
import { api } from '../../api';
import { COLORS, doughnutOptions, barOptions } from '../../utils/chartTheme';

const tabs = [
  { key: 'general',        label: 'General',          icon: Globe },
  { key: 'operativo',      label: 'Operativos',        icon: HardHat },
  { key: 'administrativo', label: 'Administrativos',   icon: Briefcase },
];

const programas = [
  { key: 'operativo',      label: 'Operativos' },
  { key: 'administrativo', label: 'Administrativos' },
];

const activeTab = ref('general');
const loading   = ref(true);
const data      = ref(null);
const error     = ref('');

// ── KPIs globales ───────────────────────────────────────────────────
const globalKpiCards = computed(() => {
  if (!data.value) return [];
  const d = data.value;
  return [
    {
      label: 'Empleados activos',
      value: d.totalEmpleados,
      sub: `${d.porPrograma?.operativo?.total ?? 0} operativos · ${d.porPrograma?.administrativo?.total ?? 0} administrativos`,
      icon: Users,
      highlight: true,
    },
    { label: 'Dudas pendientes',  value: d.dudasPendientes,         icon: CircleHelp },
    { label: 'Notificaciones',    value: d.notificacionesPendientes, icon: Bell, iconClass: 'metric-icon--warning', sub: 'Recorrido y sistemas' },
    { label: 'Encuestas enviadas', value: d.encuestasCompletadas,   icon: ClipboardList },
    { label: 'Módulos empresa',   value: d.totalModulosEmpresa,     icon: BookOpen },
  ];
});

// ── KPIs por programa ───────────────────────────────────────────────
function kpiCardsFor(programa) {
  const m = data.value?.porPrograma?.[programa];
  if (!m) return [];
  return [
    { label: 'Colaboradores',      value: m.total,       sub: 'Empleados activos',      icon: Users },
    { label: 'Inducción completa', value: m.completados, sub: `${m.pctCompletado}% del programa`, icon: CircleCheck,  iconClass: 'metric-icon--success' },
    { label: 'En curso',           value: m.enCurso,     sub: 'Con al menos 1 módulo',  icon: Clock,        iconClass: 'metric-icon--warning' },
    { label: 'Sin iniciar',        value: m.sinIniciar,  sub: '0 módulos completados',  icon: CircleAlert,  iconClass: 'metric-icon--danger' },
  ];
}

// ── Gráfica comparativa ─────────────────────────────────────────────
const comparativaChart = computed(() => {
  if (!data.value?.porPrograma) return null;
  return {
    labels: ['Completados', 'En curso', 'Sin iniciar'],
    datasets: programas.map((prog) => {
      const m = data.value.porPrograma[prog.key];
      return {
        label: prog.label,
        data: [m.completados, m.enCurso, m.sinIniciar],
        backgroundColor: prog.key === 'operativo' ? COLORS.blue : COLORS.navyMid,
        borderRadius: 8,
        borderSkipped: false,
      };
    }),
  };
});
const comparativaOptions = barOptions('', false);

// ── Gráfica estado (dona) ───────────────────────────────────────────
function estadoChartFor(programa) {
  const m = data.value?.porPrograma?.[programa];
  if (!m) return null;
  return {
    labels: ['Completados', 'En curso', 'Sin iniciar'],
    datasets: [{
      data: [m.completados, m.enCurso, m.sinIniciar],
      backgroundColor: [COLORS.success, COLORS.warning, COLORS.bluePale],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };
}
const estadoOptions = doughnutOptions('');

// ── Gráfica avance por módulo ───────────────────────────────────────
function modulosChartFor(programa) {
  const items = data.value?.progresoPorModuloPorPrograma?.[programa];
  if (!items?.length) return null;
  return {
    labels: items.map((m) => `${m.orden}. ${truncate(m.nombre, 28)}`),
    datasets: [{
      label: '% completado',
      data: items.map((m) => m.pct),
      backgroundColor: programa === 'operativo' ? COLORS.blueLight : COLORS.navyMid,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };
}

function modulosOptionsFor(programa) {
  const total = data.value?.porPrograma?.[programa]?.total ?? 0;
  return {
    ...barOptions('', true),
    scales: {
      x: { max: 100, grid: { color: COLORS.grid }, ticks: { callback: (v) => `${v}%`, color: COLORS.muted, font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { color: COLORS.muted, font: { size: 11 } } },
    },
    plugins: {
      ...barOptions('').plugins,
      tooltip: {
        ...barOptions('').plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const items = data.value.progresoPorModuloPorPrograma[programa];
            const m = items[ctx.dataIndex];
            return `${m.completados}/${total} colaboradores (${m.pct}%)`;
          },
        },
      },
    },
  };
}

// ── Gráfica por área ────────────────────────────────────────────────
const areasChart = computed(() => {
  if (!data.value?.porArea?.length) return null;
  const areas = data.value.porArea;
  return {
    labels: areas.map((a) => a.nombre),
    datasets: [
      { label: 'Completos',   data: areas.map((a) => a.completados),                     backgroundColor: COLORS.success,  borderRadius: 6 },
      { label: 'En curso',    data: areas.map((a) => a.enCurso),                         backgroundColor: COLORS.warning,  borderRadius: 6 },
      { label: 'Sin iniciar', data: areas.map((a) => a.total - a.completados - a.enCurso), backgroundColor: COLORS.bluePale, borderRadius: 6 },
    ],
  };
});
const areasOptions = barOptions('', false);

function truncate(str, len) {
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

onMounted(async () => {
  try {
    data.value = await api.get('/api/admin/dashboard');
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ── Tabs / Filtros ─────────────────────────────────────────────── */
.db-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid var(--border, rgba(30,58,95,0.1));
  border-radius: 12px;
  padding: 0.375rem;
  width: fit-content;
}

.db-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1.1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--slate-500, #64748b);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.db-tab:hover {
  background: var(--surface-2, #f4f7fb);
  color: var(--blue-900, #1e3a5f);
}

.db-tab--active {
  background: var(--blue-600, #2563eb);
  color: #fff;
}

.db-tab--active:hover {
  background: var(--blue-700, #1d4ed8);
}

/* ── Ventana principal ──────────────────────────────────────────── */
.db-window {
  background: #fff;
  border: 1px solid var(--border, rgba(30,58,95,0.1));
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(30,58,95,0.05);
}

.db-window--general {
  border-top: 3px solid #64748b;
}

.db-window--operativo {
  border-top: 3px solid #2563eb;
}

.db-window--administrativo {
  border-top: 3px solid #4338ca;
}

/* ── KPI row ────────────────────────────────────────────────────── */
.db-window__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* Acento de color en KPIs por programa */
.metric-card--operativo {
  border-left: 3px solid #3b82f6;
}

.metric-card--administrativo {
  border-left: 3px solid #4338ca;
}

/* ── Fila de gráficas ───────────────────────────────────────────── */
.db-charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.db-chart-card {
  background: var(--surface-2, #f8fafc);
  border: 1px solid var(--border, rgba(30,58,95,0.08));
  border-radius: 12px;
  padding: 1rem 1.125rem;
}

.db-chart-card--sm { flex: 0 0 300px; }
.db-chart-card--lg { flex: 1; }

.db-chart-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--blue-900, #1e3a5f);
  margin: 0 0 0.875rem;
}

.db-chart-wrap {
  position: relative;
  width: 100%;
  height: 260px;
}

.db-chart-wrap--donut {
  height: 240px;
}

.db-chart-wrap--tall {
  height: 320px;
}

/* ── Responsive ─────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .db-charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .db-window {
    padding: 1rem;
  }

  .db-tabs {
    width: 100%;
  }

  .db-tab {
    flex: 1;
    justify-content: center;
  }
}
</style>
