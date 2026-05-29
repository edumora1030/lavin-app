<template>
  <div>
    <h1>Dudas</h1>
    <p style="color:var(--text-muted); margin-bottom:1.5rem;">Preguntas enviadas por empleados desde los módulos de inducción.</p>

    <div style="display:flex; gap:12px; margin-bottom:1.5rem;">
      <select v-model="filtroEstado" class="form-input" style="width:auto;">
        <option value="">Todos</option>
        <option value="pendiente">Pendientes</option>
        <option value="respondida">Respondidas</option>
      </select>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr><th>Empleado</th><th>Módulo</th><th>Pregunta</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="d in dudasFiltradas" :key="d.id">
            <td>
              <strong>{{ d.usuario.nombre }}</strong><br>
              <small style="color:var(--text-muted);">{{ d.usuario.nomina }}</small>
            </td>
            <td>{{ d.modulo.nombre }}</td>
            <td style="max-width:300px;">{{ d.texto }}</td>
            <td>
              <span :style="{ color: d.estado === 'pendiente' ? 'var(--warning)' : 'var(--success)' }">
                {{ d.estado === 'pendiente' ? 'Pendiente' : 'Respondida' }}
              </span>
            </td>
            <td>
              <button v-if="d.estado === 'pendiente'" class="btn primary" @click="abrirRespuesta(d)">Responder</button>
              <span v-else style="color:var(--text-muted); font-size:13px;">{{ d.respuesta }}</span>
            </td>
          </tr>
          <tr v-if="!dudasFiltradas.length">
            <td colspan="5" style="text-align:center; color:var(--text-muted);">Sin dudas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="respondiendo" class="modal-overlay" @click.self="respondiendo = null">
      <div class="modal-content">
        <h3>Responder duda</h3>
        <p style="margin-bottom:12px;"><strong>{{ respondiendo.usuario.nombre }}</strong> preguntó:</p>
        <blockquote style="margin:0 0 16px; padding:12px; background:var(--bg-alt); border-radius:8px;">{{ respondiendo.texto }}</blockquote>
        <form @submit.prevent="enviarRespuesta">
          <div class="form-group">
            <label>Respuesta</label>
            <textarea v-model="respuestaTexto" required rows="3"></textarea>
          </div>
          <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button class="btn secondary" type="button" @click="respondiendo = null">Cancelar</button>
            <button class="btn primary" type="submit">Enviar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api';

const dudas = ref([]);
const filtroEstado = ref('');
const respondiendo = ref(null);
const respuestaTexto = ref('');

const dudasFiltradas = computed(() => {
  if (!filtroEstado.value) return dudas.value;
  return dudas.value.filter(d => d.estado === filtroEstado.value);
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
}

onMounted(cargar);
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
  background: var(--bg, #fff); border-radius: 12px; padding: 2rem; width: 90%; max-width: 500px;
}
</style>
