<template>
  <div>
    <div class="admin-page-header">
      <h1>Dashboard</h1>
      <p>Resumen del programa de inducción</p>
    </div>

    <p v-if="loading" class="dashboard-loading">Cargando métricas…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else-if="data">
      <div class="dashboard-grid">
        <div v-for="k in kpiCards" :key="k.label" class="metric-card" :class="{ 'metric-card--highlight': k.highlight }">
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

      <div class="dashboard-charts">
        <div class="dashboard-panel chart-panel">
          <h2>Estado general de inducción</h2>
          <div class="chart-wrap chart-wrap--donut">
            <Doughnut v-if="estadoChart" :data="estadoChart" :options="estadoOptions" />
          </div>
        </div>

        <div class="dashboard-panel chart-panel">
          <h2>Indicadores del programa</h2>
          <div class="chart-wrap chart-wrap--bar">
            <Bar v-if="indicadoresChart" :data="indicadoresChart" :options="indicadoresOptions" />
          </div>
        </div>
      </div>

      <div class="dashboard-charts dashboard-charts--wide">
        <div class="dashboard-panel chart-panel chart-panel--wide">
          <h2>Avance por módulo</h2>
          <div class="chart-wrap chart-wrap--tall">
            <Bar v-if="modulosChart" :data="modulosChart" :options="modulosOptions" />
          </div>
        </div>

        <div class="dashboard-panel chart-panel chart-panel--wide">
          <h2>Progreso por área</h2>
          <div class="chart-wrap chart-wrap--tall">
            <Bar v-if="areasChart" :data="areasChart" :options="areasOptions" />
          </div>
        </div>
      </div>
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
} from '@lucide/vue';
import { api } from '../../api';
import { COLORS, doughnutOptions, barOptions } from '../../utils/chartTheme';

const loading = ref(true);
const data = ref(null);
const error = ref('');

const kpiCards = computed(() => {
  if (!data.value) return [];
  const d = data.value;
  return [
    { label: 'Empleados activos', value: d.totalEmpleados, sub: `${d.totalAreas} áreas · ${d.totalSupervisores} encargados`, icon: Users, highlight: true },
    { label: 'Inducción completa', value: d.completados, sub: `${d.pctCompletado}% del total`, icon: CircleCheck, iconClass: 'metric-icon--success' },
    { label: 'En curso', value: d.enCurso, sub: 'Con al menos 1 módulo', icon: Clock, iconClass: 'metric-icon--warning' },
    { label: 'Sin iniciar', value: d.sinIniciar, sub: '0 módulos completados', icon: CircleAlert, iconClass: 'metric-icon--danger' },
    { label: 'Dudas pendientes', value: d.dudasPendientes, icon: CircleHelp },
    { label: 'Notificaciones', value: d.notificacionesPendientes, sub: 'Recorrido y sistemas', icon: Bell, iconClass: 'metric-icon--warning' },
    { label: 'Encuestas enviadas', value: d.encuestasCompletadas, icon: ClipboardList },
    { label: 'Módulos empresa', value: d.totalModulosEmpresa, icon: BookOpen },
  ];
});

const estadoChart = computed(() => {
  if (!data.value) return null;
  return {
    labels: ['Completados', 'En curso', 'Sin iniciar'],
    datasets: [{
      data: [data.value.completados, data.value.enCurso, data.value.sinIniciar],
      backgroundColor: [COLORS.success, COLORS.warning, COLORS.bluePale],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };
});

const estadoOptions = doughnutOptions('');

const indicadoresChart = computed(() => {
  if (!data.value) return null;
  const d = data.value;
  return {
    labels: ['Empleados', 'Completos', 'En curso', 'Dudas', 'Encuestas'],
    datasets: [{
      label: 'Cantidad',
      data: [d.totalEmpleados, d.completados, d.enCurso, d.dudasPendientes, d.encuestasCompletadas],
      backgroundColor: [COLORS.navy, COLORS.success, COLORS.warning, COLORS.blueLight, COLORS.navyMid],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };
});

const indicadoresOptions = barOptions('', false);

const modulosChart = computed(() => {
  if (!data.value?.progresoPorModulo?.length) return null;
  const items = data.value.progresoPorModulo;
  return {
    labels: items.map((m) => `${m.orden}. ${truncate(m.nombre, 28)}`),
    datasets: [{
      label: '% completado',
      data: items.map((m) => m.pct),
      backgroundColor: COLORS.blueLight,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };
});

const modulosOptions = computed(() => ({
  ...barOptions('', true),
  scales: {
    x: {
      max: 100,
      grid: { color: COLORS.grid },
      ticks: { callback: (v) => `${v}%`, color: COLORS.muted, font: { size: 11 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: COLORS.muted, font: { size: 11 } },
    },
  },
  plugins: {
    ...barOptions('').plugins,
    tooltip: {
      ...barOptions('').plugins.tooltip,
      callbacks: {
        label: (ctx) => {
          const m = data.value.progresoPorModulo[ctx.dataIndex];
          return `${m.completados}/${data.value.totalEmpleados} empleados (${m.pct}%)`;
        },
      },
    },
  },
}));

const areasChart = computed(() => {
  if (!data.value?.porArea?.length) return null;
  const areas = data.value.porArea;
  return {
    labels: areas.map((a) => a.nombre),
    datasets: [
      {
        label: 'Completos',
        data: areas.map((a) => a.completados),
        backgroundColor: COLORS.success,
        borderRadius: 6,
      },
      {
        label: 'En curso',
        data: areas.map((a) => a.enCurso),
        backgroundColor: COLORS.warning,
        borderRadius: 6,
      },
      {
        label: 'Sin iniciar',
        data: areas.map((a) => a.total - a.completados - a.enCurso),
        backgroundColor: COLORS.bluePale,
        borderRadius: 6,
      },
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
.dashboard-loading {
  color: var(--slate-500);
}

.dashboard-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.dashboard-charts--wide {
  grid-template-columns: 1fr 1fr;
}

.chart-panel h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--blue-900);
  margin: 0 0 1rem;
}

.chart-wrap {
  position: relative;
  width: 100%;
}

.chart-wrap--donut {
  height: 280px;
}

.chart-wrap--bar {
  height: 280px;
}

.chart-wrap--tall {
  height: 360px;
}

@media (max-width: 1100px) {
  .dashboard-charts,
  .dashboard-charts--wide {
    grid-template-columns: 1fr;
  }
}
</style>
