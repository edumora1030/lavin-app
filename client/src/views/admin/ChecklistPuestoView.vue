<template>
  <div class="checklist-admin">
    <div class="admin-page-header">
      <h1>Checklist — Inducción al puesto</h1>
      <p>Actividades que el colaborador marca al integrarse a su puesto (no son módulos de curso).</p>
    </div>

    <div class="admin-toolbar">
      <button type="button" class="admin-btn admin-btn--primary" @click="abrirCrear">
        + Nueva actividad
      </button>
      <AdminFilterBar v-model="filtroEstado" :options="filtros" aria-label="Filtrar actividades" />
    </div>

    <div v-if="loading" style="color:var(--slate-500)">Cargando checklist…</div>

    <div v-else class="admin-card modulos-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Actividad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in itemsVisibles" :key="item.id" :class="{ 'is-inactive': !item.activo }">
              <td>{{ item.orden }}</td>
              <td>{{ item.titulo }}</td>
              <td>
                <span class="status-badge" :class="item.activo ? 'status-badge--active' : 'status-badge--inactive'">
                  {{ item.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="modulos-actions">
                  <button type="button" class="icon-btn" title="Editar" @click="abrirEditar(item)">
                    <Pencil :size="16" stroke-width="2" />
                  </button>
                  <button
                    v-if="item.activo"
                    type="button"
                    class="icon-btn icon-btn--danger"
                    title="Deshabilitar"
                    @click="toggleActivo(item, false)"
                  >
                    <Ban :size="16" stroke-width="2" />
                  </button>
                  <button
                    v-else
                    type="button"
                    class="icon-btn icon-btn--success"
                    title="Habilitar"
                    @click="toggleActivo(item, true)"
                  >
                    <CircleCheck :size="16" stroke-width="2" />
                  </button>
                  <button type="button" class="icon-btn icon-btn--danger" title="Eliminar" @click="eliminar(item)">
                    <Trash2 :size="16" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!itemsVisibles.length">
              <td colspan="4" class="modulos-empty">Sin actividades en el checklist</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-if="modal" @close="modal = false">
      <h2>{{ editId ? 'Editar actividad' : 'Nueva actividad' }}</h2>
      <form @submit.prevent="guardar">
        <div class="form-group">
          <label>Título</label>
          <input v-model="form.titulo" required>
        </div>
        <div class="form-group">
          <label>Orden</label>
          <input v-model.number="form.orden" type="number" min="1">
        </div>
        <label v-if="editId" class="modulos-form-check">
          <input v-model="form.activo" type="checkbox">
          Actividad activa (visible para colaboradores)
        </label>
        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="modal = false">Cancelar</button>
          <button type="submit" class="btn">Guardar</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Pencil, Ban, CircleCheck, Trash2 } from '@lucide/vue';
import { api } from '../../api';
import AppModal from '../../components/AppModal.vue';
import AdminFilterBar from '../../components/AdminFilterBar.vue';
import { useAppConfirm } from '../../composables/useAppConfirm';

const { showConfirm } = useAppConfirm();

const items = ref([]);
const loading = ref(true);
const modal = ref(false);
const editId = ref(null);
const filtroEstado = ref('todos');
const form = ref({ titulo: '', orden: 1, activo: true });

const filtros = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
];

const itemsVisibles = computed(() => {
  const list = [...items.value].sort((a, b) => a.orden - b.orden);
  if (filtroEstado.value === 'activos') return list.filter((i) => i.activo);
  if (filtroEstado.value === 'inactivos') return list.filter((i) => !i.activo);
  return list;
});

async function load() {
  loading.value = true;
  try {
    items.value = await api.get('/api/checklist-puesto/items');
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  editId.value = null;
  form.value = { titulo: '', orden: items.value.length + 1, activo: true };
  modal.value = true;
}

function abrirEditar(item) {
  editId.value = item.id;
  form.value = { titulo: item.titulo, orden: item.orden, activo: item.activo };
  modal.value = true;
}

async function guardar() {
  if (editId.value) {
    await api.put(`/api/checklist-puesto/items/${editId.value}`, form.value);
  } else {
    await api.post('/api/checklist-puesto/items', form.value);
  }
  modal.value = false;
  await load();
}

async function toggleActivo(item, activo) {
  const ok = await showConfirm({
    title: activo ? '¿Habilitar actividad?' : '¿Deshabilitar actividad?',
    message: `"${item.titulo}" ${activo ? 'volverá a mostrarse' : 'dejará de mostrarse'} en el checklist.`,
    variant: activo ? 'info' : 'warning',
    confirmLabel: activo ? 'Habilitar' : 'Deshabilitar',
  });
  if (!ok) return;
  await api.put(`/api/checklist-puesto/items/${item.id}`, { activo });
  await load();
}

async function eliminar(item) {
  const ok = await showConfirm({
    title: '¿Eliminar actividad?',
    message: `Se eliminará "${item.titulo}" del checklist permanentemente.`,
    variant: 'warning',
    confirmLabel: 'Eliminar',
  });
  if (!ok) return;
  await api.del(`/api/checklist-puesto/items/${item.id}`);
  await load();
}

onMounted(load);
</script>

<style scoped>
.checklist-admin .modulos-card {
  padding: 0;
  overflow: hidden;
}

.modulos-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.modulos-form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge--active {
  background: #ecfdf5;
  color: #15803d;
}

.status-badge--inactive {
  background: #f1f5f9;
  color: #64748b;
}

tr.is-inactive td {
  opacity: 0.72;
}

.modulos-empty {
  text-align: center;
  padding: 2rem;
  color: var(--slate-500);
}
</style>
