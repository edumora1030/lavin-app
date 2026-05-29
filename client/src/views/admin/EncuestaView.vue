<template>
  <div>
    <h1>Encuesta de satisfacción</h1>
    <p style="color:var(--text-muted); margin-bottom:1.5rem;">Administra las preguntas del módulo de evaluación del programa.</p>

    <div class="card" style="margin-bottom:1.5rem;">
      <h3 style="margin-bottom:12px;">{{ editando ? 'Editar pregunta' : 'Agregar pregunta' }}</h3>
      <form @submit.prevent="guardar" style="display:flex; gap:12px; align-items:flex-end;">
        <div class="form-group" style="flex:1; margin:0;">
          <input v-model="form.texto" type="text" required placeholder="Texto de la pregunta">
        </div>
        <button class="btn primary" type="submit">{{ editando ? 'Actualizar' : 'Agregar' }}</button>
        <button v-if="editando" class="btn secondary" type="button" @click="cancelar">Cancelar</button>
      </form>
    </div>

    <div class="card" style="margin-bottom:2rem;">
      <h3 style="margin-bottom:12px;">Preguntas activas</h3>
      <table>
        <thead><tr><th>#</th><th>Pregunta</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr v-for="p in preguntas" :key="p.id">
            <td>{{ p.orden }}</td>
            <td>{{ p.texto }}</td>
            <td style="display:flex; gap:8px;">
              <button class="btn secondary" @click="editar(p)">Editar</button>
              <button class="btn ghost" @click="eliminar(p.id)">Eliminar</button>
            </td>
          </tr>
          <tr v-if="!preguntas.length">
            <td colspan="3" style="text-align:center; color:var(--text-muted);">Sin preguntas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px;">Respuestas recibidas</h3>
      <table>
        <thead><tr><th>Empleado</th><th>Pregunta</th><th>Respuesta</th><th>Fecha</th></tr></thead>
        <tbody>
          <tr v-for="r in respuestas" :key="r.id">
            <td>{{ r.usuario.nombre }} ({{ r.usuario.nomina }})</td>
            <td>{{ r.pregunta.texto }}</td>
            <td>{{ r.valor }}</td>
            <td>{{ new Date(r.creadoEn).toLocaleDateString() }}</td>
          </tr>
          <tr v-if="!respuestas.length">
            <td colspan="4" style="text-align:center; color:var(--text-muted);">Sin respuestas aún.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../../api';

const preguntas = ref([]);
const respuestas = ref([]);
const form = ref({ texto: '' });
const editando = ref(null);

async function cargar() {
  preguntas.value = await api.get('/api/encuesta/preguntas/admin');
  respuestas.value = await api.get('/api/encuesta/respuestas');
}

async function guardar() {
  if (editando.value) {
    await api.put(`/api/encuesta/preguntas/${editando.value}`, { texto: form.value.texto });
  } else {
    await api.post('/api/encuesta/preguntas', { texto: form.value.texto });
  }
  form.value.texto = '';
  editando.value = null;
  await cargar();
}

function editar(p) {
  form.value.texto = p.texto;
  editando.value = p.id;
}

function cancelar() {
  form.value.texto = '';
  editando.value = null;
}

async function eliminar(id) {
  if (!confirm('¿Desactivar esta pregunta?')) return;
  await api.del(`/api/encuesta/preguntas/${id}`);
  await cargar();
}

onMounted(cargar);
</script>
