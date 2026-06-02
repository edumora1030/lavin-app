<template>
  <div class="areas-page">
    <div class="admin-page-header">
      <h1>Áreas</h1>
      <p>Catálogo de áreas de la empresa. Las áreas inactivas no pueden asignarse a nuevos usuarios.</p>
    </div>

    <div class="admin-card" style="margin-bottom: 1rem; padding: 1.25rem;">
      <form class="areas-form" @submit.prevent="guardar">
        <div class="form-group areas-form__field">
          <label>Nombre del área</label>
          <input v-model="form.nombre" type="text" required placeholder="Ej. Producción">
        </div>
        <label v-if="editando" class="areas-form__check">
          <input v-model="form.activo" type="checkbox">
          Área activa
        </label>
        <div class="areas-form__actions">
          <button type="submit" class="admin-btn admin-btn--primary">
            {{ editando ? 'Actualizar' : 'Agregar' }}
          </button>
          <button v-if="editando" type="button" class="admin-btn" @click="cancelar">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="admin-toolbar">
      <AdminFilterBar v-model="filtroActivo" :options="filtros" aria-label="Filtrar áreas" />
    </div>

    <div class="admin-card" style="padding: 0; overflow: hidden;">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in areasFiltradas" :key="a.id" :class="{ 'is-inactive': !a.activo }">
              <td>{{ a.nombre }}</td>
              <td>
                <span class="status-badge" :class="a.activo ? 'status-badge--active' : 'status-badge--inactive'">
                  {{ a.activo ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    type="button"
                    class="icon-btn"
                    title="Editar área"
                    aria-label="Editar área"
                    @click="editar(a)"
                  >
                    <Pencil :size="15" stroke-width="2" />
                  </button>
                  <button
                    v-if="a.activo"
                    type="button"
                    class="icon-btn icon-btn--danger"
                    title="Deshabilitar área"
                    aria-label="Deshabilitar área"
                    @click="toggleActivo(a, false)"
                  >
                    <Ban :size="15" stroke-width="2" />
                  </button>
                  <button
                    v-else
                    type="button"
                    class="icon-btn icon-btn--success"
                    title="Habilitar área"
                    aria-label="Habilitar área"
                    @click="toggleActivo(a, true)"
                  >
                    <CircleCheck :size="15" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!areasFiltradas.length">
              <td colspan="3" class="table-empty">Sin áreas en este filtro.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Pencil, Ban, CircleCheck } from '@lucide/vue';
import { useAppConfirm } from '../../composables/useAppConfirm';
import { api } from '../../api';
import AdminFilterBar from '../../components/AdminFilterBar.vue';
const { showConfirm } = useAppConfirm();

const areas = ref([]);
const form = ref({ nombre: '', activo: true });
const editando = ref(null);
const filtroActivo = ref('todos');

const filtros = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
];

const areasFiltradas = computed(() => {
  if (filtroActivo.value === 'activos') return areas.value.filter((a) => a.activo);
  if (filtroActivo.value === 'inactivos') return areas.value.filter((a) => !a.activo);
  return areas.value;
});

async function cargar() {
  areas.value = await api.get('/api/areas');
}

async function guardar() {
  if (editando.value) {
    await api.put(`/api/areas/${editando.value}`, {
      nombre: form.value.nombre,
      activo: form.value.activo,
    });
  } else {
    await api.post('/api/areas', { nombre: form.value.nombre });
  }
  form.value = { nombre: '', activo: true };
  editando.value = null;
  await cargar();
}

function editar(a) {
  form.value = { nombre: a.nombre, activo: a.activo };
  editando.value = a.id;
}

function cancelar() {
  form.value = { nombre: '', activo: true };
  editando.value = null;
}

async function toggleActivo(a, activo) {
  const ok = await showConfirm({
    title: activo ? '¿Habilitar área?' : '¿Deshabilitar área?',
    message: activo
      ? `El área "${a.nombre}" podrá asignarse a nuevos usuarios.`
      : `El área "${a.nombre}" no podrá asignarse a nuevos usuarios.`,
    variant: activo ? 'info' : 'warning',
    confirmLabel: activo ? 'Habilitar' : 'Deshabilitar',
  });
  if (!ok) return;
  await api.put(`/api/areas/${a.id}`, { activo });
  await cargar();
}

onMounted(cargar);
</script>

<style scoped>
.areas-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: flex-end;
}

.areas-form__field {
  flex: 1;
  min-width: 200px;
  margin: 0;
}

.areas-form__check {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--slate-600);
  cursor: pointer;
  padding-bottom: 0.5rem;
}

.areas-form__actions {
  display: flex;
  gap: 0.5rem;
}

.admin-filters {
  display: flex;
  gap: 0.375rem;
}

.admin-filter-btn {
  padding: 0.4rem 0.75rem;
  border: 1px solid rgba(30, 58, 95, 0.12);
  border-radius: 8px;
  background: var(--white);
  font-size: 0.8125rem;
  font-family: inherit;
  color: var(--slate-600);
  cursor: pointer;
}

.admin-filter-btn.is-active {
  background: var(--blue-50);
  border-color: var(--blue-300);
  color: var(--blue-700);
  font-weight: 600;
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

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.admin-btn--sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
}

.admin-btn--danger {
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.25);
}

.admin-btn--danger:hover {
  background: #fef2f2;
}

.admin-btn--success {
  color: #15803d;
  border-color: rgba(22, 163, 74, 0.25);
}

.admin-btn--success:hover {
  background: #f0fdf4;
}

tr.is-inactive td {
  opacity: 0.72;
}

.table-empty {
  text-align: center;
  padding: 2rem;
  color: var(--slate-500);
}
</style>
