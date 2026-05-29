<template>
  <div>
    <h1>Áreas</h1>
    <p style="color:var(--text-muted); margin-bottom:1.5rem;">Catálogo de áreas de la empresa.</p>

    <div class="card" style="margin-bottom:1.5rem;">
      <form @submit.prevent="guardar" style="display:flex; gap:12px; align-items:flex-end;">
        <div class="form-group" style="flex:1; margin:0;">
          <label>Nombre del área</label>
          <input v-model="form.nombre" type="text" required placeholder="Ej. Producción">
        </div>
        <button class="btn primary" type="submit">{{ editando ? 'Actualizar' : 'Agregar' }}</button>
        <button v-if="editando" class="btn secondary" type="button" @click="cancelar">Cancelar</button>
      </form>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr><th>Nombre</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in areas" :key="a.id">
            <td>{{ a.nombre }}</td>
            <td>
              <span :style="{ color: a.activo ? 'var(--success)' : 'var(--warning)' }">
                {{ a.activo ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td style="display:flex; gap:8px;">
              <button class="btn secondary" @click="editar(a)">Editar</button>
              <button class="btn ghost" @click="toggleActivo(a)">{{ a.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
          <tr v-if="!areas.length">
            <td colspan="3" style="text-align:center; color:var(--text-muted);">Sin áreas registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../../api';

const areas = ref([]);
const form = ref({ nombre: '' });
const editando = ref(null);

async function cargar() {
  areas.value = await api.get('/api/areas');
}

async function guardar() {
  if (editando.value) {
    await api.put(`/api/areas/${editando.value}`, { nombre: form.value.nombre });
  } else {
    await api.post('/api/areas', { nombre: form.value.nombre });
  }
  form.value.nombre = '';
  editando.value = null;
  await cargar();
}

function editar(a) {
  form.value.nombre = a.nombre;
  editando.value = a.id;
}

function cancelar() {
  form.value.nombre = '';
  editando.value = null;
}

async function toggleActivo(a) {
  await api.put(`/api/areas/${a.id}`, { activo: !a.activo });
  await cargar();
}

onMounted(cargar);
</script>
