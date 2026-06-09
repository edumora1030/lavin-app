<template>
  <div class="db">
    <header class="db-header">
      <div>
        <h1 class="db-header__title">Overview</h1>
        <p class="db-header__sub">Resumen visual del programa de inducción</p>
      </div>
      <div class="db-header__actions">
        <div class="db-tabs" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            role="tab"
            class="db-tab"
            :class="{ 'db-tab--active': activeTab === tab.key }"
            :aria-selected="activeTab === tab.key"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="14" stroke-width="2" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <p v-if="loading" class="db-state">Cargando métricas…</p>
    <p v-else-if="error" class="db-state db-state--error">{{ error }}</p>

    <template v-else-if="data">
      <!-- KPIs -->
      <section class="db-kpis">
        <article
          v-for="k in currentKpis"
          :key="k.label"
          class="db-kpi"
          :class="{ 'db-kpi--primary': k.primary }"
        >
          <div class="db-kpi__top">
            <span class="db-kpi__label">{{ k.label }}</span>
            <div class="db-kpi__icon" :class="k.iconTone">
              <component :is="k.icon" :size="18" stroke-width="2" />
            </div>
          </div>
          <div class="db-kpi__value">{{ k.value }}</div>
          <div v-if="k.trend" class="db-kpi__trend" :class="`db-kpi__trend--${k.trend.type}`">
            <component :is="k.trend.type === 'up' ? TrendingUp : TrendingDown" :size="14" stroke-width="2.5" />
            <span>{{ k.trend.text }}</span>
          </div>
          <p v-if="k.sub" class="db-kpi__sub">{{ k.sub }}</p>
        </article>
      </section>

      <!-- GENERAL -->
      <div v-if="activeTab === 'general'" class="db-grid db-grid--uniform">
        <article class="db-card">
          <div class="db-card__head">
            <h3>Estado global</h3>
            <span class="db-card__hint">Distribución de colaboradores</span>
          </div>
          <div class="db-card__body">
            <div class="db-chart db-chart--donut">
              <Doughnut v-if="estadoGlobalChart" :data="estadoGlobalChart" :options="donutOptions" />
            </div>
            <div class="db-donut-legend">
              <div v-for="item in estadoGlobalLegend" :key="item.label" class="db-donut-legend__item">
                <span class="db-donut-legend__dot" :style="{ background: item.color }" />
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
        </article>

        <article class="db-card">
          <div class="db-card__head">
            <h3>Inducción completada</h3>
            <span class="db-card__hint">% con programa terminado</span>
          </div>
          <div class="db-card__body db-card__body--center">
          <div class="db-gauge-wrap">
            <div class="db-gauge" :style="{ '--pct': data.pctCompletado }">
              <svg viewBox="0 0 200 110" class="db-gauge__svg" aria-hidden="true">
                <path
                  class="db-gauge__track"
                  d="M 20 95 A 80 80 0 0 1 180 95"
                  fill="none"
                  stroke-width="14"
                  stroke-linecap="round"
                />
                <path
                  class="db-gauge__fill"
                  d="M 20 95 A 80 80 0 0 1 180 95"
                  fill="none"
                  stroke-width="14"
                  stroke-linecap="round"
                  pathLength="100"
                  :stroke-dasharray="`${data.pctCompletado} 100`"
                />
              </svg>
              <div class="db-gauge__center">
                <span class="db-gauge__num">{{ data.pctCompletado }}%</span>
                <span class="db-gauge__lbl">{{ data.completados }} de {{ data.totalEmpleados }}</span>
              </div>
            </div>
            <div class="db-gauge__split">
              <div>
                <span class="db-gauge__split-label">Operativos</span>
                <strong>{{ data.porPrograma?.operativo?.completados ?? 0 }}</strong>
              </div>
              <div>
                <span class="db-gauge__split-label">Administrativos</span>
                <strong>{{ data.porPrograma?.administrativo?.completados ?? 0 }}</strong>
              </div>
            </div>
          </div>
          </div>
        </article>

        <article class="db-card">
          <div class="db-card__head">
            <h3>Comparativa por programa</h3>
            <span class="db-card__hint">Operativo vs administrativo</span>
          </div>
          <div class="db-card__body">
            <div class="db-chart db-chart--radar">
              <Radar v-if="programaRadarChart" :data="programaRadarChart" :options="radarChartOptions" />
            </div>
          </div>
        </article>

        <article class="db-card db-card--span-12">
          <div class="db-card__head">
            <h3>Operativos vs administrativos</h3>
            <span class="db-card__hint">Conteo por estado</span>
          </div>
          <div class="db-card__body">
            <div class="db-chart db-chart--bar">
              <Bar v-if="comparativaChart" :data="comparativaChart" :options="comparativaBarOptions" />
            </div>
          </div>
        </article>

        <article class="db-card db-card--full">
          <div class="db-card__head">
            <h3>Progreso por área</h3>
            <span class="db-card__hint">% con inducción completa</span>
          </div>
          <div class="db-card__body">
            <ul v-if="areaBars.length" class="db-area-list db-area-list--grid">
              <li v-for="a in areaBars" :key="a.nombre" class="db-area-row">
                <div class="db-area-row__meta">
                  <span class="db-area-row__name">{{ a.nombre }}</span>
                  <span class="db-area-row__pct">{{ a.pct }}%</span>
                </div>
                <div class="db-area-row__track">
                  <div class="db-area-row__fill" :style="{ width: `${a.pct}%` }" />
                </div>
                <span class="db-area-row__count">{{ a.completados }}/{{ a.total }}</span>
              </li>
            </ul>
            <p v-else class="db-empty">Sin áreas registradas</p>
          </div>
        </article>
      </div>

      <!-- OPERATIVO / ADMINISTRATIVO -->
      <div v-else class="db-grid db-grid--uniform">
        <article class="db-card">
          <div class="db-card__head">
            <h3>Estado de inducción</h3>
            <span class="db-card__hint">{{ programaLabel }}</span>
          </div>
          <div class="db-card__body">
            <div class="db-chart db-chart--donut">
              <Doughnut v-if="estadoProgramaChart" :data="estadoProgramaChart" :options="donutOptions" />
            </div>
            <div v-if="programaDistrib.length" class="db-donut-legend">
              <div v-for="item in programaDistrib" :key="item.label" class="db-donut-legend__item">
                <span class="db-donut-legend__dot" :class="item.dotClass" />
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </div>
            </div>
          </div>
        </article>

        <article class="db-card">
          <div class="db-card__head">
            <h3>Completados</h3>
            <span class="db-card__hint">{{ programaLabel }}</span>
          </div>
          <div class="db-card__body db-card__body--center">
          <div class="db-gauge-wrap">
            <div class="db-gauge" :style="{ '--pct': programaPct }">
              <svg viewBox="0 0 200 110" class="db-gauge__svg" aria-hidden="true">
                <path class="db-gauge__track" d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke-width="14" stroke-linecap="round" />
                <path
                  class="db-gauge__fill"
                  d="M 20 95 A 80 80 0 0 1 180 95"
                  fill="none"
                  stroke-width="14"
                  stroke-linecap="round"
                  pathLength="100"
                  :stroke-dasharray="`${programaPct} 100`"
                />
              </svg>
              <div class="db-gauge__center">
                <span class="db-gauge__num">{{ programaPct }}%</span>
                <span class="db-gauge__lbl">{{ programaMetrics?.completados ?? 0 }} colaboradores</span>
              </div>
            </div>
            <div class="db-gauge__split db-gauge__split--3">
              <div>
                <span class="db-gauge__split-label">Total</span>
                <strong>{{ programaMetrics?.total ?? 0 }}</strong>
              </div>
              <div>
                <span class="db-gauge__split-label">En curso</span>
                <strong>{{ programaMetrics?.enCurso ?? 0 }}</strong>
              </div>
              <div>
                <span class="db-gauge__split-label">Sin iniciar</span>
                <strong>{{ programaMetrics?.sinIniciar ?? 0 }}</strong>
              </div>
            </div>
          </div>
          </div>
        </article>

        <article class="db-card">
          <div class="db-card__head">
            <h3>Distribución del programa</h3>
            <span class="db-card__hint">% por estado de avance</span>
          </div>
          <div class="db-card__body">
            <ul class="db-area-list db-area-list--stacked">
              <li v-for="row in programaDistrib" :key="row.label" class="db-area-row">
                <div class="db-area-row__meta">
                  <span class="db-area-row__name">{{ row.label }}</span>
                  <span class="db-area-row__pct">{{ row.pct }}%</span>
                </div>
                <div class="db-area-row__track">
                  <div class="db-area-row__fill" :class="row.tone" :style="{ width: `${row.pct}%` }" />
                </div>
                <span class="db-area-row__count">{{ row.count }} colaboradores</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Bar, Doughnut, Radar } from 'vue-chartjs';
import {
  Users,
  CircleCheck,
  Clock,
  CircleHelp,
  Bell,
  Globe,
  HardHat,
  Briefcase,
  TrendingUp,
  TrendingDown,
} from '@lucide/vue';
import { api } from '../../api';
import {
  COLORS,
  doughnutOptionsCompact,
  barOptions,
  radarOptions,
} from '../../utils/chartTheme';

const tabs = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'operativo', label: 'Operativos', icon: HardHat },
  { key: 'administrativo', label: 'Administrativos', icon: Briefcase },
  { key: 'ayudante_general', label: 'Ayudante general', icon: HardHat },
];

const programas = [
  { key: 'operativo', label: 'Operativos' },
  { key: 'administrativo', label: 'Administrativos' },
  { key: 'ayudante_general', label: 'Ayudante general' },
];

const activeTab = ref('general');
const loading = ref(true);
const data = ref(null);
const error = ref('');

const donutOptions = doughnutOptionsCompact();
const radarChartOptions = radarOptions();
const comparativaBarOptions = {
  ...barOptions('', false),
  plugins: { ...barOptions('').plugins, legend: { position: 'top' } },
};

const programaLabel = computed(() =>
  programas.find((p) => p.key === activeTab.value)?.label ?? ''
);

const programaMetrics = computed(() =>
  activeTab.value !== 'general' ? data.value?.porPrograma?.[activeTab.value] : null
);

const programaPct = computed(() => programaMetrics.value?.pctCompletado ?? 0);

const globalKpis = computed(() => {
  if (!data.value) return [];
  const d = data.value;
  const pendientes = (d.dudasPendientes ?? 0) + (d.notificacionesPendientes ?? 0);
  return [
    {
      label: 'Empleados activos',
      value: d.totalEmpleados,
      sub: `${d.totalModulosEmpresa} módulos · ${d.totalAreas ?? 0} áreas · ${d.encuestasCompletadas} encuestas`,
      icon: Users,
      primary: true,
      trend: { type: 'up', text: `${d.porPrograma?.operativo?.total ?? 0} operativos` },
    },
    {
      label: 'Inducción completa',
      value: d.completados,
      icon: CircleCheck,
      iconTone: 'db-kpi__icon--success',
      trend: { type: 'up', text: `${d.pctCompletado}% del total` },
    },
    {
      label: 'En curso',
      value: d.enCurso,
      icon: Clock,
      iconTone: 'db-kpi__icon--warn',
      trend: { type: d.sinIniciar > d.enCurso ? 'down' : 'up', text: `${d.sinIniciar} sin iniciar` },
    },
    {
      label: 'Pendientes RH',
      value: pendientes,
      icon: Bell,
      iconTone: pendientes > 0 ? 'db-kpi__icon--danger' : 'db-kpi__icon--muted',
      trend: {
        type: pendientes > 0 ? 'down' : 'up',
        text: `${d.dudasPendientes ?? 0} dudas · ${d.notificacionesPendientes ?? 0} notif.`,
      },
    },
  ];
});

const programKpis = computed(() => {
  const m = programaMetrics.value;
  if (!m) return [];
  return [
    { label: 'Colaboradores', value: m.total, icon: Users, primary: true, trend: { type: 'up', text: 'Activos en programa' } },
    { label: 'Completados', value: m.completados, icon: CircleCheck, iconTone: 'db-kpi__icon--success', trend: { type: 'up', text: `${m.pctCompletado}% completó` } },
    { label: 'En curso', value: m.enCurso, icon: Clock, iconTone: 'db-kpi__icon--warn', trend: { type: 'up', text: 'Con avance parcial' } },
    { label: 'Sin iniciar', value: m.sinIniciar, icon: CircleHelp, iconTone: 'db-kpi__icon--danger', trend: { type: m.sinIniciar ? 'down' : 'up', text: '0 módulos hechos' } },
  ];
});

const currentKpis = computed(() =>
  activeTab.value === 'general' ? globalKpis.value : programKpis.value
);

const estadoGlobalChart = computed(() => {
  if (!data.value) return null;
  const d = data.value;
  return {
    labels: ['Completados', 'En curso', 'Sin iniciar'],
    datasets: [{
      data: [d.completados, d.enCurso, d.sinIniciar],
      backgroundColor: [COLORS.brandMid, COLORS.accent, COLORS.brandPale],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };
});

const estadoGlobalLegend = computed(() => {
  if (!data.value) return [];
  const d = data.value;
  return [
    { label: 'Completados', value: d.completados, color: COLORS.brandMid },
    { label: 'En curso', value: d.enCurso, color: COLORS.accent },
    { label: 'Sin iniciar', value: d.sinIniciar, color: COLORS.brandPale },
  ];
});

function estadoChartFor(programa) {
  const m = data.value?.porPrograma?.[programa];
  if (!m) return null;
  return {
    labels: ['Completados', 'En curso', 'Sin iniciar'],
    datasets: [{
      data: [m.completados, m.enCurso, m.sinIniciar],
      backgroundColor: [COLORS.brand, COLORS.accent, COLORS.brandPale],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };
}

const estadoProgramaChart = computed(() =>
  activeTab.value !== 'general' ? estadoChartFor(activeTab.value) : null
);

const programaRadarChart = computed(() => {
  if (!data.value?.porPrograma) return null;
  return {
    labels: ['% Completados', '% En curso', '% Sin iniciar'],
    datasets: programas.map((prog) => {
      const m = data.value.porPrograma[prog.key];
      const t = m.total || 1;
      return {
        label: prog.label,
        data: [
          Math.round((m.completados / t) * 100),
          Math.round((m.enCurso / t) * 100),
          Math.round((m.sinIniciar / t) * 100),
        ],
        backgroundColor: prog.key === 'operativo' ? 'rgba(30, 58, 95, 0.25)' : 'rgba(37, 99, 235, 0.2)',
        borderColor: prog.key === 'operativo' ? COLORS.brandMid : COLORS.accentBlue,
        borderWidth: 2,
        pointBackgroundColor: prog.key === 'operativo' ? COLORS.brand : COLORS.accentBlue,
      };
    }),
  };
});

const comparativaChart = computed(() => {
  if (!data.value?.porPrograma) return null;
  return {
    labels: ['Completados', 'En curso', 'Sin iniciar'],
    datasets: programas.map((prog) => {
      const m = data.value.porPrograma[prog.key];
      return {
        label: prog.label,
        data: [m.completados, m.enCurso, m.sinIniciar],
        backgroundColor: prog.key === 'operativo' ? COLORS.brandMid : COLORS.accentBlue,
        borderRadius: 10,
        borderSkipped: false,
      };
    }),
  };
});

const areaBars = computed(() => {
  if (!data.value?.porArea?.length) return [];
  return [...data.value.porArea]
    .map((a) => ({
      ...a,
      pct: a.total ? Math.round((a.completados / a.total) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);
});

const programaDistrib = computed(() => {
  const m = programaMetrics.value;
  if (!m?.total) return [];
  const t = m.total;
  return [
    { label: 'Completados', count: m.completados, pct: Math.round((m.completados / t) * 100), tone: '', dotClass: 'db-donut-legend__dot--brand' },
    { label: 'En curso', count: m.enCurso, pct: Math.round((m.enCurso / t) * 100), tone: 'db-area-row__fill--warn', dotClass: 'db-donut-legend__dot--warn' },
    { label: 'Sin iniciar', count: m.sinIniciar, pct: Math.round((m.sinIniciar / t) * 100), tone: 'db-area-row__fill--muted', dotClass: 'db-donut-legend__dot--muted' },
  ];
});

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
.db {
  --db-bg: #eff6ff;
  --db-card: #ffffff;
  --db-brand: #0f2744;
  --db-brand-mid: #1e3a5f;
  --db-brand-light: #2563eb;
  --db-text: #0f2744;
  --db-muted: #64748b;
  --db-border: rgba(15, 39, 68, 0.08);
  --db-shadow: 0 4px 24px rgba(15, 39, 68, 0.08);
  margin: -1.75rem -2rem 0;
  padding: 1.75rem 2rem 2.5rem;
  min-height: calc(100% + 1.75rem);
  background: var(--db-bg);
}

.db-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.db-header__title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--db-text);
  margin: 0;
  letter-spacing: -0.02em;
}

.db-header__sub {
  margin: 0.25rem 0 0;
  color: var(--db-muted);
  font-size: 0.9rem;
}

.db-tabs {
  display: flex;
  gap: 0.35rem;
  background: var(--db-card);
  border: 1px solid var(--db-border);
  border-radius: 12px;
  padding: 0.3rem;
  box-shadow: var(--db-shadow);
}

.db-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 9px;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--db-muted);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.db-tab:hover {
  color: var(--db-brand);
  background: #dbeafe;
}

.db-tab--active {
  background: var(--db-brand);
  color: #fff;
}

.db-tab--active:hover {
  background: var(--db-brand-mid);
  color: #fff;
}

.db-state {
  color: var(--db-muted);
  padding: 2rem;
  text-align: center;
}

.db-state--error {
  color: #dc2626;
}

/* KPIs */
.db-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.db-kpi {
  background: var(--db-card);
  border: 1px solid var(--db-border);
  border-radius: 16px;
  padding: 1.15rem 1.25rem;
  box-shadow: var(--db-shadow);
  transition: transform 0.2s, box-shadow 0.2s;
}

.db-kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(15, 39, 68, 0.12);
}

.db-kpi--primary {
  background: linear-gradient(145deg, #0a1628 0%, #1e3a5f 100%);
  border: none;
  color: #fff;
}

.db-kpi--primary .db-kpi__label,
.db-kpi--primary .db-kpi__sub {
  color: rgba(255, 255, 255, 0.75);
}

.db-kpi--primary .db-kpi__value {
  color: #fff;
}

.db-kpi--primary .db-kpi__icon {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.db-kpi__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.db-kpi__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--db-muted);
}

.db-kpi__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: var(--db-brand-mid);
}

.db-kpi__icon--success {
  background: #dcfce7;
  color: #15803d;
}

.db-kpi__icon--warn {
  background: #fef3c7;
  color: #b45309;
}

.db-kpi__icon--danger {
  background: #fee2e2;
  color: #dc2626;
}

.db-kpi__icon--muted {
  background: #f3f4f6;
  color: var(--db-muted);
}

.db-kpi__value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--db-text);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.db-kpi__trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.db-kpi__trend--up {
  color: #1d4ed8;
}

.db-kpi--primary .db-kpi__trend--up {
  color: #bfdbfe;
}

.db-kpi__trend--down {
  color: #f59e0b;
}

.db-kpi__sub {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: var(--db-muted);
}

/* Grid */
.db-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
  align-items: stretch;
}

.db-grid--uniform > .db-card {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  min-height: 380px;
}

.db-grid--uniform > .db-card--span-12 {
  grid-column: span 12;
  min-height: 300px;
}

.db-grid--uniform > .db-card--full {
  grid-column: span 12;
  min-height: auto;
}

.db-card {
  background: var(--db-card);
  border: 1px solid var(--db-border);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: var(--db-shadow);
}

.db-card__head {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.db-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.db-card__body--center {
  justify-content: center;
}

.db-card__head h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--db-text);
}

.db-card__hint {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: var(--db-muted);
}

.db-chart {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 220px;
  max-height: 240px;
}

.db-chart--donut,
.db-chart--radar,
.db-chart--bar {
  height: 220px;
  flex: none;
}

.db-empty {
  color: var(--db-muted);
  font-size: 0.875rem;
  text-align: center;
  padding: 2rem 1rem;
}

/* Donut legend */
.db-donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--db-border);
}

.db-donut-legend__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--db-muted);
}

.db-donut-legend__item strong {
  margin-left: auto;
  color: var(--db-text);
  font-weight: 700;
}

.db-donut-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--db-brand-mid);
}

.db-donut-legend__dot--brand {
  background: var(--db-brand);
}

.db-donut-legend__dot--warn {
  background: #f59e0b;
}

.db-donut-legend__dot--muted {
  background: #cbd5e1;
}

/* Gauge */
.db-gauge-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.db-gauge {
  position: relative;
  width: 100%;
  max-width: 220px;
}

.db-gauge__svg {
  width: 100%;
  display: block;
}

.db-gauge__track {
  stroke: #dbeafe;
}

.db-gauge__fill {
  stroke: var(--db-brand-light);
  transition: stroke-dasharray 0.6s ease;
}

.db-gauge__center {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  text-align: center;
}

.db-gauge__num {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--db-brand);
  line-height: 1;
}

.db-gauge__lbl {
  font-size: 0.75rem;
  color: var(--db-muted);
}

.db-gauge__split {
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--db-border);
  gap: 1rem;
}

.db-gauge__split--3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;
}

.db-gauge__split-label {
  display: block;
  font-size: 0.7rem;
  color: var(--db-muted);
  margin-bottom: 0.2rem;
}

.db-gauge__split strong {
  font-size: 1.125rem;
  color: var(--db-text);
}

/* Area bars */
.db-area-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.db-area-list--grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 1.5rem;
}

.db-area-list--stacked {
  flex: 1;
  justify-content: center;
  gap: 1.25rem;
}

@media (min-width: 900px) {
  .db-area-list--grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.db-area-row__meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.db-area-row__name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--db-text);
}

.db-area-row__pct {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--db-brand);
}

.db-area-row__track {
  height: 8px;
  background: #dbeafe;
  border-radius: 999px;
  overflow: hidden;
}

.db-area-row__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--db-brand-mid), var(--db-brand-light));
  border-radius: 999px;
  transition: width 0.5s ease;
}

.db-area-row__fill--warn {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.db-area-row__fill--muted {
  background: #cbd5e1;
}

.db-area-row__count {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: var(--db-muted);
}

@media (max-width: 1200px) {
  .db-kpis {
    grid-template-columns: repeat(2, 1fr);
  }

  .db-grid--uniform > .db-card,
  .db-grid--uniform > .db-card--full,
  .db-grid--uniform > .db-card--span-12 {
    grid-column: span 6;
  }

  .db-area-list--grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .db-kpis {
    grid-template-columns: 1fr;
  }

  .db-grid--uniform > .db-card,
  .db-grid--uniform > .db-card--full,
  .db-grid--uniform > .db-card--span-12 {
    grid-column: span 12;
    min-height: auto;
  }

  .db-area-list--grid {
    grid-template-columns: 1fr;
  }

  .db-header {
    flex-direction: column;
  }

  .db-tabs {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
