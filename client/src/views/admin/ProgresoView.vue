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
            <tr v-else-if="error">
              <td colspan="7" style="text-align:center; padding:2rem; color:#dc2626">{{ error }}</td>
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
                    v-if="u.induccionEmpresaHabilitada"
                    class="icon-btn"
                    type="button"
                    :disabled="!u.empresaCompleta || descargandoPdf === `${u.id}-empresa`"
                    :title="tituloDescargaEmpresa(u)"
                    aria-label="Descargar PDF evidencia empresa"
                    @click="descargarEvidencia(u, 'empresa')"
                  >
                    <FileDown :size="15" stroke-width="2" />
                  </button>
                  <button
                    class="icon-btn"
                    type="button"
                    :disabled="!puedeDescargarPuesto(u) || descargandoPdf === `${u.id}-puesto`"
                    :title="tituloDescargaPuesto(u)"
                    aria-label="Descargar PDF evidencia puesto"
                    @click="descargarEvidencia(u, 'puesto')"
                  >
                    <ClipboardList :size="15" stroke-width="2" />
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
        <div class="evidencia-tabs" role="tablist" aria-label="Tipo de hoja de evidencia">
          <button
            type="button"
            role="tab"
            class="evidencia-tabs__btn"
            :class="{ 'is-active': hojaActiva === 'empresa' }"
            :aria-selected="hojaActiva === 'empresa'"
            :disabled="!evidencia.induccionEmpresa.habilitada"
            @click="hojaActiva = 'empresa'"
          >
            Empresa
          </button>
          <button
            type="button"
            role="tab"
            class="evidencia-tabs__btn"
            :class="{ 'is-active': hojaActiva === 'puesto' }"
            :aria-selected="hojaActiva === 'puesto'"
            @click="hojaActiva = 'puesto'"
          >
            Puesto
          </button>
        </div>
        <EvidenciaSheet
          :evidencia="evidencia"
          :tipo="hojaActiva"
          :downloading="descargandoPdf === `${evidencia.empleado.id}-${hojaActiva}`"
          @download="(tipo) => descargarEvidencia(evidencia.empleado, tipo)"
        />
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
import EvidenciaSheet from '../../components/EvidenciaSheet.vue';

const list = ref([]);
const loading = ref(true);
const error = ref('');
const q = ref('');
const filtroEstado = ref('');
const evidencia = ref(null);
const hojaActiva = ref('empresa');
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
  if (p === 'ayudante_general') return 'Ayudante general';
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

function puedeDescargarPuesto(u) {
  return u.induccionPuestoHabilitada && u.puestoCompleta;
}

function tituloDescargaEmpresa(u) {
  if (!u.induccionEmpresaHabilitada) return 'Inducción a la empresa no habilitada';
  if (!u.empresaModulosCompleta) return 'Módulos de empresa incompletos';
  if (!u.recordatoriosCompleta) return 'Faltan recordatorios importantes';
  return 'Descargar PDF evidencia empresa';
}

function tituloDescargaPuesto(u) {
  if (!u.induccionPuestoHabilitada) return 'Inducción al puesto no habilitada';
  if (!u.puestoModulosCompleta) return 'Checklist de puesto incompleto';
  if (!u.recordatoriosCompleta) return 'Faltan recordatorios importantes';
  return 'Descargar PDF evidencia puesto';
}

async function verReporte(id) {
  const data = await api.get(`/api/usuarios/${id}/evidencia`);
  evidencia.value = data;
  hojaActiva.value = data.induccionEmpresa.habilitada ? 'empresa' : 'puesto';
}

function cerrarReporte() {
  evidencia.value = null;
}

async function descargarEvidencia(empleado, tipo) {
  const id = empleado.id;
  const nomina = empleado.nomina;
  const key = `${id}-${tipo}`;
  descargandoPdf.value = key;
  try {
    const suffix = tipo === 'empresa' ? 'empresa' : 'puesto';
    await downloadFile(
      `/api/usuarios/${id}/evidencia/pdf/${tipo}`,
      `evidencia-induccion-${suffix}-${nomina}.pdf`,
    );
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

onMounted(load);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await api.get('/api/progreso/resumen');
    list.value = Array.isArray(data) ? data : [];
  } catch (e) {
    list.value = [];
    error.value = e.message || 'No se pudo cargar el progreso.';
    showAlert({ title: 'Error al cargar', message: error.value, variant: 'error' });
  } finally {
    loading.value = false;
  }
}
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
  height: 100%;
  min-height: 0;
}

.evidencia-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem 0;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.evidencia-tabs__btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px 6px 0 0;
  background: #fff;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.evidencia-tabs__btn.is-active {
  color: #0f2744;
  border-bottom-color: #fff;
  background: #fff;
  box-shadow: inset 0 2px 0 #2563eb;
}

.evidencia-tabs__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
