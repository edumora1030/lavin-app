<template>
  <div>
    <div class="admin-page-header">
      <h1>Progreso de empleados</h1>
      <p>Reporte de avance en el programa de inducción</p>
    </div>

    <div class="admin-card">
      <div class="admin-toolbar">
        <div class="usuarios-search" style="flex:1; max-width:320px;">
          <span class="usuarios-search__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input v-model="q" type="search" placeholder="Buscar nombre o nómina">
        </div>
        <AdminFilterBar v-model="filtroEstado" :options="filtrosProgreso" aria-label="Filtrar progreso" />
        <button
          type="button"
          class="icon-btn"
          :disabled="exportando"
          :title="exportando ? 'Exportando…' : 'Exportar CSV'"
          aria-label="Exportar CSV"
          @click="exportarCsv"
        >
          <Download :size="15" stroke-width="2" />
        </button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nómina</th>
              <th>Nombre</th>
              <th>Programa</th>
              <th>Área</th>
              <th>Progreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" style="text-align:center; padding:2rem; color:var(--slate-500)">Cargando…</td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td colspan="7" style="text-align:center; padding:2rem; color:var(--slate-500)">Sin resultados</td>
            </tr>
            <tr v-for="u in filtrados" :key="u.id">
              <td><code>{{ u.nomina }}</code></td>
              <td><strong>{{ u.nombre }}</strong></td>
              <td>{{ rolLabel(u.programa) }}</td>
              <td>{{ u.areaRel?.nombre || u.area || '—' }}</td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div class="progress-bar-track" style="width:80px; flex-shrink:0;">
                    <div class="progress-bar-fill" :style="{ width: pct(u) + '%' }"></div>
                  </div>
                  <span>{{ u.modulosCompletados }} / {{ u.totalModulos || 10 }}</span>
                </div>
              </td>
              <td>
                <span :style="{ color: estadoColor(u) }">{{ estadoLabel(u) }}</span>
              </td>
              <td>
                <div class="progreso-actions">
                  <button
                    class="icon-btn icon-btn--primary"
                    type="button"
                    title="Ver reporte"
                    aria-label="Ver reporte"
                    @click="verReporte(u.id)"
                  >
                    <Eye :size="15" stroke-width="2" />
                  </button>
                  <button
                    v-if="u.induccionCompleta"
                    class="icon-btn"
                    type="button"
                    :disabled="descargandoPdf === u.id"
                    title="Descargar PDF de evidencia"
                    aria-label="Descargar PDF de evidencia"
                    @click="descargarEvidencia(u)"
                  >
                    <FileDown :size="15" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-if="evidencia" evidencia @close="cerrarReporte">
      <div class="evidencia-modal">
        <header class="evidencia-modal__head">
          <div>
            <h2>Hoja de evidencia de inducción</h2>
            <p class="evidencia-modal__sub">
              {{ evidencia.empleado.nombre }} · Nómina {{ evidencia.empleado.nomina }} ·
              {{ rolLabel(evidencia.empleado.programa) }} ·
              {{ evidencia.empleado.area || 'Sin área' }}
            </p>
          </div>
          <button
            v-if="evidencia.induccionCompleta"
            type="button"
            class="icon-btn icon-btn--primary"
            :disabled="descargandoPdf === evidencia.empleado.id"
            title="Descargar PDF de evidencia"
            aria-label="Descargar PDF de evidencia"
            @click="descargarEvidencia(evidencia.empleado)"
          >
            <FileDown :size="16" stroke-width="2" />
          </button>
        </header>

        <div class="evidencia-modal__body">
          <div class="dashboard-grid evidencia-resumen">
            <div class="metric-card metric-card--compact">
              <div class="metric-label">Inducción empresa</div>
              <div class="metric-value" :class="evidencia.induccionEmpresa.completa ? 'is-ok' : 'is-pending'">
                {{ evidencia.induccionEmpresa.completados }}/{{ evidencia.induccionEmpresa.total }}
              </div>
            </div>
            <div class="metric-card metric-card--compact">
              <div class="metric-label">Inducción puesto</div>
              <div class="metric-value" :class="evidencia.induccionPuesto.completa ? 'is-ok' : 'is-pending'">
                <template v-if="evidencia.induccionPuesto.habilitada">
                  {{ evidencia.induccionPuesto.completados }}/{{ evidencia.induccionPuesto.total }}
                </template>
                <template v-else>—</template>
              </div>
            </div>
            <div class="metric-card metric-card--compact">
              <div class="metric-label">Promedio exámenes</div>
              <div class="metric-value">
                {{ evidencia.resumen.promedioExamenes != null ? evidencia.resumen.promedioExamenes + '%' : '—' }}
              </div>
            </div>
          </div>

          <section v-if="evidencia.induccionEmpresa.habilitada" class="evidencia-section">
            <h3>Inducción a la empresa</h3>
            <EvidenciaChecklist :modulos="evidencia.induccionEmpresa.modulos" />
          </section>

          <section v-if="evidencia.induccionPuesto.habilitada" class="evidencia-section">
            <h3>Inducción al puesto</h3>
            <EvidenciaChecklist :modulos="evidencia.induccionPuesto.modulos" />
          </section>

          <section v-if="evidencia.evaluacionFinal" class="evidencia-section evidencia-section--final">
            <h3>Evaluación final del programa</h3>
            <div class="evidencia-final">
              <span class="evidencia-check" :class="{ 'is-done': evidencia.evaluacionFinal.completada }">
                {{ evidencia.evaluacionFinal.completada ? '✓' : '○' }}
              </span>
              <div>
                <strong>{{ evidencia.evaluacionFinal.nombre }}</strong>
                <p>
                  {{ evidencia.evaluacionFinal.completada ? 'Encuesta completada' : 'Pendiente' }}
                  <template v-if="evidencia.evaluacionFinal.fechaCompletado">
                    · {{ fmtFecha(evidencia.evaluacionFinal.fechaCompletado) }}
                  </template>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ClipboardList, Download, Eye, FileDown } from '@lucide/vue';
import { useAppAlert } from '../../composables/useAppAlert';
import { api, downloadFile } from '../../api';
const { showAlert } = useAppAlert();
import AppModal from '../../components/AppModal.vue';
import AdminFilterBar from '../../components/AdminFilterBar.vue';
import EvidenciaChecklist from '../../components/EvidenciaChecklist.vue';

const list = ref([]);
const loading = ref(true);
const q = ref('');
const filtroEstado = ref('');
const evidencia = ref(null);
const exportando = ref(false);
const descargandoPdf = ref(null);

const filtrados = computed(() => {
  let rows = list.value;
  const term = q.value.trim().toLowerCase();
  if (term) {
    rows = rows.filter((u) =>
      u.nombre.toLowerCase().includes(term) || u.nomina.toLowerCase().includes(term)
    );
  }
  if (filtroEstado.value === 'completo') {
    rows = rows.filter((u) => u.induccionCompleta);
  } else if (filtroEstado.value === 'curso') {
    rows = rows.filter((u) => u.modulosCompletados > 0 && !u.induccionCompleta);
  } else if (filtroEstado.value === 'pendiente') {
    rows = rows.filter((u) => u.modulosCompletados === 0);
  }
  return rows;
});

const filtrosProgreso = computed(() => {
  const total = list.value.length;
  const completo = list.value.filter((u) => u.induccionCompleta).length;
  const curso = list.value.filter((u) => u.modulosCompletados > 0 && !u.induccionCompleta).length;
  const pendiente = list.value.filter((u) => u.modulosCompletados === 0).length;
  return [
    { value: '', label: 'Todos', count: total },
    { value: 'completo', label: 'Completos', count: completo },
    { value: 'curso', label: 'En curso', count: curso },
    { value: 'pendiente', label: 'Sin iniciar', count: pendiente },
  ];
});

function rolLabel(p) {
  if (p === 'administrativo') return 'Administrativo';
  if (p === 'operativo') return 'Operativo';
  return '—';
}

function pct(u) {
  const total = u.totalModulos || 10;
  return total ? Math.round((u.modulosCompletados / total) * 100) : 0;
}

function estadoLabel(u) {
  if (u.induccionCompleta) return 'Completo';
  if (u.modulosCompletados > 0) return 'En curso';
  return 'Pendiente';
}

function estadoColor(u) {
  const label = estadoLabel(u);
  if (label === 'Completo') return 'var(--success)';
  if (label === 'En curso') return 'var(--warning)';
  return 'var(--slate-500)';
}

function fmtFecha(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function verReporte(id) {
  const data = await api.get(`/api/usuarios/${id}/evidencia`);
  data.induccionCompleta = esInduccionCompleta(data);
  evidencia.value = data;
}

function esInduccionCompleta(data) {
  const empresaOk = !data.induccionEmpresa.habilitada || data.induccionEmpresa.completa;
  const puestoOk = !data.induccionPuesto.habilitada || data.induccionPuesto.completa;
  const tienePrograma = data.induccionEmpresa.habilitada || data.induccionPuesto.habilitada;
  return tienePrograma && empresaOk && puestoOk;
}

function cerrarReporte() {
  evidencia.value = null;
}

async function descargarEvidencia(empleado) {
  const id = empleado.id;
  const nomina = empleado.nomina;
  descargandoPdf.value = id;
  try {
    await downloadFile(`/api/usuarios/${id}/evidencia/pdf`, `evidencia-induccion-${nomina}.pdf`);
  } catch (e) {
    showAlert({ title: 'Error al generar PDF', message: e.message || 'No se pudo generar el PDF.', variant: 'error' });
  } finally {
    descargandoPdf.value = null;
  }
}

async function exportarCsv() {
  exportando.value = true;
  try {
    await downloadFile('/api/admin/reportes/empleados', 'progreso-empleados.csv');
  } catch (e) {
    showAlert({ title: 'Error al exportar', message: e.message || 'No se pudo exportar el CSV.', variant: 'error' });
  } finally {
    exportando.value = false;
  }
}

onMounted(async () => {
  try {
    list.value = await api.get('/api/progreso/resumen');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.progreso-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.evidencia-modal {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.evidencia-modal__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--slate-200, #e2e8f0);
}

.evidencia-modal__head h2 {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.35;
}

.evidencia-modal__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 1.5rem;
}

.evidencia-modal__sub {
  color: var(--slate-500);
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
}

.evidencia-resumen {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) {
  .evidencia-resumen {
    grid-template-columns: 1fr;
  }
}

.metric-value.is-ok {
  color: var(--success);
}

.metric-value.is-pending {
  color: var(--warning);
}

.evidencia-section {
  margin-bottom: 1.25rem;
}

.evidencia-section:last-child {
  margin-bottom: 0;
}

.evidencia-section h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.evidencia-section--final {
  padding-top: 0.5rem;
  border-top: 1px solid var(--slate-200, #e2e8f0);
}

.evidencia-final {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--slate-50, #f8fafc);
  border-radius: 8px;
}

.evidencia-final p {
  margin: 0.25rem 0 0;
  color: var(--slate-500);
  font-size: 0.875rem;
}

.evidencia-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--slate-300, #cbd5e1);
  color: var(--slate-400);
  font-size: 0.875rem;
  flex-shrink: 0;
}

.evidencia-check.is-done {
  border-color: var(--success);
  background: var(--success);
  color: #fff;
}
</style>
