<template>
  <div>
    <h1>Progreso de mi equipo</h1>
    <p style="color:var(--text-muted); margin-bottom:1.5rem;">
      Avance de empleados en el programa de inducción.
      <span v-if="auth.user?.areaRel"> · Área: {{ auth.user.areaRel.nombre }}</span>
      <span v-else-if="auth.user?.area"> · Área: {{ auth.user.area }}</span>
    </p>

    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card">
        <div class="label">Empleados</div>
        <div class="value">{{ empleados.length }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Con al menos 1 módulo</div>
        <div class="value">{{ conProgreso }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Sin iniciar (0 módulos)</div>
        <div class="value" style="color:var(--warning)">{{ sinProgreso }}</div>
      </div>
    </div>

    <div class="card">
      <div style="margin-bottom:12px">
        <button type="button" class="btn secondary" :disabled="exportando" @click="exportarCsv">
          {{ exportando ? 'Exportando…' : 'Exportar CSV' }}
        </button>
      </div>
      <table>
        <thead>
          <tr><th>Nómina</th><th>Nombre</th><th>Programa</th><th>Área</th><th>Módulos</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in empleados" :key="u.id">
            <td><code>{{ u.nomina }}</code></td>
            <td>{{ u.nombre }}</td>
            <td>{{ u.programa || '—' }}</td>
            <td>{{ u.areaRel?.nombre || u.area || '—' }}</td>
            <td>{{ u.modulosCompletados }} / {{ u.totalModulos }}</td>
            <td>
              <span v-if="u.modulosCompletados >= u.totalModulos && u.totalModulos > 0" style="color:var(--success)">Completo</span>
              <span v-else-if="u.modulosCompletados > 0">En curso</span>
              <span v-else style="color:var(--warning)">Pendiente</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!empleados.length" style="color:var(--text-muted); margin-top:1rem;">No hay empleados registrados en tu área.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useAppAlert } from '../../composables/useAppAlert';
import { api, downloadFile } from '../../api';
const { showAlert } = useAppAlert();

const auth = useAuthStore();
const empleados = ref([]);
const exportando = ref(false);

const conProgreso = computed(() => empleados.value.filter((u) => u.modulosCompletados > 0).length);
const sinProgreso = computed(() => empleados.value.filter((u) => u.modulosCompletados === 0).length);

async function exportarCsv() {
  exportando.value = true;
  try {
    await downloadFile('/api/progreso/resumen/csv', 'progreso-empleados.csv');
  } catch (e) {
    showAlert({ title: 'Error al exportar', message: e.message || 'No se pudo exportar el CSV.', variant: 'error' });
  } finally {
    exportando.value = false;
  }
}

onMounted(async () => {
  empleados.value = await api.get('/api/progreso/resumen');
});
</script>
