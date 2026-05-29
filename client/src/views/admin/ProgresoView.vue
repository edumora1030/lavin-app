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
        <select v-model="filtroEstado" class="usuarios-select">
          <option value="">Todos</option>
          <option value="completo">Completos</option>
          <option value="curso">En curso</option>
          <option value="pendiente">Sin iniciar</option>
        </select>
        <a class="admin-btn" href="/api/admin/reportes/empleados">Exportar CSV</a>
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
                <button class="admin-btn admin-btn--primary" @click="verReporte(u.id)">Ver reporte</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-if="reporte" @close="reporte = null">
      <h2>{{ reporte.nombre }}</h2>
      <p style="color:var(--slate-500); margin-bottom:1rem;">
        Nómina {{ reporte.nomina }} · {{ rolLabel(reporte.programa) }} · {{ reporte.areaRel?.nombre || reporte.area || 'Sin área' }}
      </p>

      <div class="dashboard-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom:1.25rem;">
        <div class="metric-card" style="padding:1rem;">
          <div class="metric-label">Módulos completados</div>
          <div class="metric-value" style="font-size:1.5rem;">{{ modulosDone.length }}</div>
        </div>
        <div class="metric-card" style="padding:1rem;">
          <div class="metric-label">Empresa</div>
          <div class="metric-value" style="font-size:1.5rem;">{{ reporte.induccionEmpresaHabilitada ? 'Sí' : 'No' }}</div>
        </div>
        <div class="metric-card" style="padding:1rem;">
          <div class="metric-label">Puesto</div>
          <div class="metric-value" style="font-size:1.5rem;">{{ reporte.induccionPuestoHabilitada ? 'Sí' : 'No' }}</div>
        </div>
      </div>

      <h3 style="margin-bottom:0.75rem;">Módulos completados</h3>
      <ul v-if="modulosDone.length" style="margin:0; padding-left:1.25rem;">
        <li v-for="p in modulosDone" :key="p.moduloId">{{ p.modulo?.nombre || p.moduloId }}</li>
      </ul>
      <p v-else style="color:var(--slate-500)">Aún no ha completado ningún módulo.</p>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';
import AppModal from '../../components/AppModal.vue';

const list = ref([]);
const loading = ref(true);
const q = ref('');
const filtroEstado = ref('');
const reporte = ref(null);

const modulosDone = computed(() =>
  reporte.value?.progresos?.filter((p) => p.tipo === 'modulo_completado' && p.completado) || []
);

const filtrados = computed(() => {
  let rows = list.value;
  const term = q.value.trim().toLowerCase();
  if (term) {
    rows = rows.filter((u) =>
      u.nombre.toLowerCase().includes(term) || u.nomina.toLowerCase().includes(term)
    );
  }
  if (filtroEstado.value === 'completo') {
    rows = rows.filter((u) => u.modulosCompletados >= (u.totalModulos || 10) && u.totalModulos > 0);
  } else if (filtroEstado.value === 'curso') {
    rows = rows.filter((u) => u.modulosCompletados > 0 && u.modulosCompletados < (u.totalModulos || 10));
  } else if (filtroEstado.value === 'pendiente') {
    rows = rows.filter((u) => u.modulosCompletados === 0);
  }
  return rows;
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
  const total = u.totalModulos || 10;
  if (u.modulosCompletados >= total && total > 0) return 'Completo';
  if (u.modulosCompletados > 0) return 'En curso';
  return 'Pendiente';
}

function estadoColor(u) {
  const label = estadoLabel(u);
  if (label === 'Completo') return 'var(--success)';
  if (label === 'En curso') return 'var(--warning)';
  return 'var(--slate-500)';
}

async function verReporte(id) {
  reporte.value = await api.get(`/api/usuarios/${id}/reporte`);
}

onMounted(async () => {
  try {
    list.value = await api.get('/api/progreso/resumen');
  } finally {
    loading.value = false;
  }
});
</script>
