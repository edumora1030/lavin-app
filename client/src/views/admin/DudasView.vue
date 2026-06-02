<template>
  <div>
    <div class="admin-page-header">
      <h1>Dudas</h1>
      <p>Preguntas enviadas por empleados desde los módulos de inducción.</p>
    </div>

    <div class="admin-toolbar">
      <AdminFilterBar v-model="filtroEstado" :options="filtros" aria-label="Filtrar dudas" />
    </div>

    <div class="admin-card" style="padding:0; overflow:hidden;">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Empleado</th><th>Módulo</th><th>Pregunta</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in dudasFiltradas" :key="d.id">
              <td>
                <strong>{{ d.usuario.nombre }}</strong>
                <div style="font-size:0.8125rem; color:var(--slate-500); margin-top:2px;">{{ d.usuario.nomina }}</div>
              </td>
              <td>{{ d.modulo.nombre }}</td>
              <td style="max-width:300px;">{{ d.texto }}</td>
              <td>
                <span class="status-badge" :class="d.estado === 'pendiente' ? 'status-badge--warn' : 'status-badge--active'">
                  {{ d.estado === 'pendiente' ? 'Pendiente' : 'Respondida' }}
                </span>
              </td>
              <td>
                <button
                  v-if="d.estado === 'pendiente'"
                  type="button"
                  class="icon-btn icon-btn--primary"
                  title="Responder duda"
                  aria-label="Responder duda"
                  @click="abrirRespuesta(d)"
                >
                  <MessageSquare :size="15" stroke-width="2" />
                </button>
                <span v-else style="color:var(--slate-500); font-size:0.8125rem;">{{ d.respuesta }}</span>
              </td>
            </tr>
            <tr v-if="!dudasFiltradas.length">
              <td colspan="5" style="text-align:center; padding:2rem; color:var(--slate-500);">Sin dudas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-if="respondiendo" @close="respondiendo = null">
      <h2>Responder duda</h2>
      <p style="margin-bottom:12px;"><strong>{{ respondiendo.usuario.nombre }}</strong> preguntó:</p>
      <blockquote style="margin:0 0 16px; padding:12px; background:var(--surface-2); border-radius:8px;">{{ respondiendo.texto }}</blockquote>
      <form @submit.prevent="enviarRespuesta">
        <div class="form-group">
          <label>Respuesta</label>
          <textarea v-model="respuestaTexto" required rows="3"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="respondiendo = null">Cancelar</button>
          <button type="submit" class="btn">Enviar</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { MessageSquare } from '@lucide/vue';
import { api } from '../../api';
import AppModal from '../../components/AppModal.vue';
import AdminFilterBar from '../../components/AdminFilterBar.vue';

const refreshSidebarCounts = inject('refreshDudasCount', null);

const dudas = ref([]);
const filtroEstado = ref('');
const respondiendo = ref(null);
const respuestaTexto = ref('');

const filtros = computed(() => [
  { value: '', label: 'Todos', count: dudas.value.length },
  { value: 'pendiente', label: 'Pendientes', count: dudas.value.filter((d) => d.estado === 'pendiente').length },
  { value: 'respondida', label: 'Respondidas', count: dudas.value.filter((d) => d.estado === 'respondida').length },
]);

const dudasFiltradas = computed(() => {
  if (!filtroEstado.value) return dudas.value;
  return dudas.value.filter((d) => d.estado === filtroEstado.value);
});

async function cargar() {
  dudas.value = await api.get('/api/dudas');
}

function abrirRespuesta(d) {
  respondiendo.value = d;
  respuestaTexto.value = '';
}

async function enviarRespuesta() {
  await api.put(`/api/dudas/${respondiendo.value.id}`, { respuesta: respuestaTexto.value });
  respondiendo.value = null;
  await cargar();
  refreshSidebarCounts?.();
}

onMounted(async () => {
  await cargar();
  refreshSidebarCounts?.();
});
</script>
