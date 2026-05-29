<template>
  <div class="modulos-page">
    <div class="admin-page-header">
      <h1>Módulos</h1>
      <p>Administra el contenido del programa de inducción</p>
    </div>

    <div class="modulos-tabs" role="tablist" aria-label="Tipo de inducción">
      <button
        type="button"
        role="tab"
        class="modulos-tab"
        :class="{ 'is-active': tabActiva === 'empresa' }"
        :aria-selected="tabActiva === 'empresa'"
        @click="tabActiva = 'empresa'"
      >
        <Building2 :size="16" stroke-width="2" />
        Introducción a la empresa
      </button>
      <button
        type="button"
        role="tab"
        class="modulos-tab"
        :class="{ 'is-active': tabActiva === 'puesto' }"
        :aria-selected="tabActiva === 'puesto'"
        @click="tabActiva = 'puesto'"
      >
        <Briefcase :size="16" stroke-width="2" />
        Introducción al puesto
      </button>
    </div>

    <div class="admin-toolbar">
      <button type="button" class="admin-btn admin-btn--primary" @click="abrirCrear">
        + Nuevo módulo
      </button>
    </div>

    <div v-if="loading" style="color:var(--slate-500)">Cargando módulos…</div>

    <div v-else class="admin-card modulos-card">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Programa</th>
              <th>Ítems</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, index) in modulosFiltrados" :key="m.id" :style="{ opacity: m.activo ? 1 : 0.55 }">
              <td>{{ index + 1 }}</td>
              <td>{{ m.nombreDisplay || m.nombre }}</td>
              <td>{{ m.programaDisplay || m.programa }}</td>
              <td>{{ m.items?.length || 0 }}</td>
              <td>
                <span :style="{ color: m.activo ? 'var(--success)' : 'var(--slate-500)' }">
                  {{ m.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="modulos-actions">
                  <button
                    type="button"
                    class="modulos-icon-btn"
                    title="Editar"
                    aria-label="Editar módulo"
                    @click="abrirEditar(m)"
                  >
                    <Pencil :size="16" stroke-width="2" />
                  </button>
                  <button
                    v-if="m.activo"
                    type="button"
                    class="modulos-icon-btn modulos-icon-btn--danger"
                    title="Eliminar"
                    aria-label="Eliminar módulo"
                    @click="eliminar(m)"
                  >
                    <Trash2 :size="16" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!modulosFiltrados.length">
              <td colspan="6" class="modulos-empty">Sin módulos en esta sección</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-if="modal" @close="modal = null">
      <h2>{{ editId ? 'Editar módulo' : `Nuevo módulo — ${tabLabel}` }}</h2>
      <form @submit.prevent="guardar">
        <div class="form-group"><label>Nombre</label><input v-model="form.nombre" required></div>
        <div class="form-group"><label>Slug (identificador)</label><input v-model="form.slug" required :disabled="!!editId"></div>
        <div class="form-group"><label>Descripción</label><textarea v-model="form.descripcion" rows="2" required></textarea></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label>Programa</label>
            <select v-model="form.programa">
              <option value="ambos">Ambos</option>
              <option value="administrativo">Administrativo</option>
              <option value="operativo">Operativo</option>
            </select>
          </div>
          <div class="form-group">
            <label>Orden</label>
            <input v-model.number="form.orden" type="number" min="1">
          </div>
        </div>

        <div v-if="editId && editModulo?.items?.length" style="margin-top:1.25rem;">
          <h3 style="font-size:0.9375rem; margin-bottom:0.75rem;">Contenido del módulo</h3>
          <ul style="margin:0; padding-left:1.25rem; font-size:0.875rem;">
            <li v-for="i in editModulo.items" :key="i.id">{{ i.tipo }}: {{ i.titulo }}</li>
          </ul>
          <button type="button" class="admin-btn" style="margin-top:0.75rem;" @click="abrirAddItem">+ Agregar ítem</button>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="modal = null">Cancelar</button>
          <button type="submit" class="btn">Guardar</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-if="addItemMod" @close="addItemMod = null">
      <h2>Nuevo ítem — {{ addItemMod.nombre }}</h2>
      <form @submit.prevent="saveItem">
        <div class="form-group">
          <label>Tipo</label>
          <select v-model="itemForm.tipo"><option value="paso">Paso</option><option value="recurso">Recurso</option></select>
        </div>
        <div class="form-group"><label>Título</label><input v-model="itemForm.titulo" required></div>
        <div class="form-group"><label>Descripción</label><textarea v-model="itemForm.descripcion" rows="3"></textarea></div>
        <div class="form-group"><label>URL archivo</label><input v-model="itemForm.archivoUrl"></div>
        <div class="form-group"><label>Orden</label><input v-model.number="itemForm.orden" type="number"></div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="addItemMod = null">Cancelar</button>
          <button type="submit" class="btn">Guardar ítem</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Building2, Briefcase, Pencil, Trash2 } from '@lucide/vue';
import { api } from '../../api';
import AppModal from '../../components/AppModal.vue';

const modulos = ref([]);
const loading = ref(true);
const modal = ref(false);
const editId = ref(null);
const editModulo = ref(null);
const addItemMod = ref(null);
const tabActiva = ref('empresa');
const form = ref(emptyForm());
const itemForm = ref({ tipo: 'paso', titulo: '', descripcion: '', archivoUrl: '', orden: 0 });

const tabLabel = computed(() =>
  tabActiva.value === 'empresa' ? 'Introducción a la empresa' : 'Introducción al puesto'
);

function normalizeModuloNombre(m) {
  return m.nombre
    .replace(/\s*—\s*(Operativo|Administrativo)\s*·\s*(Empresa|Puesto)\s*$/i, '')
    .trim()
    .toLowerCase();
}

function programaPrioridad(m) {
  if (m.programa === 'ambos') return 0;
  if (m.programa === 'administrativo') return 1;
  return 2;
}

function dedupeModulos(list) {
  const grupos = new Map();

  for (const modulo of list) {
    const key = normalizeModuloNombre(modulo);
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(modulo);
  }

  return [...grupos.values()]
    .map((grupo) => {
      const ordenado = [...grupo].sort((a, b) => {
        const byPrograma = programaPrioridad(a) - programaPrioridad(b);
        return byPrograma !== 0 ? byPrograma : a.orden - b.orden;
      });
      const principal = ordenado[0];
      const programas = [...new Set(grupo.map((m) => m.programa))];
      const nombreBase = principal.nombre
        .replace(/\s*—\s*(Operativo|Administrativo)\s*·\s*(Empresa|Puesto)\s*$/i, '')
        .trim();

      return {
        ...principal,
        nombreDisplay: nombreBase,
        programaDisplay: programas.length === 1
          ? programas[0]
          : programas.includes('ambos')
            ? 'ambos'
            : programas.sort().join(', '),
        orden: Math.min(...grupo.map((m) => m.orden)),
      };
    })
    .sort((a, b) => a.orden - b.orden || a.nombreDisplay.localeCompare(b.nombreDisplay, 'es'));
}

const modulosFiltrados = computed(() =>
  dedupeModulos(
    modulos.value.filter((m) => m.alcance === tabActiva.value || m.alcance === 'ambos')
  )
);

function emptyForm() {
  return { nombre: '', slug: '', descripcion: '', programa: 'ambos', alcance: 'empresa', orden: 1 };
}

async function load() {
  loading.value = true;
  try {
    modulos.value = await api.get('/api/modulos');
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  editId.value = null;
  editModulo.value = null;
  form.value = {
    ...emptyForm(),
    alcance: tabActiva.value,
    orden: modulosFiltrados.value.length + 1,
  };
  modal.value = true;
}

function abrirEditar(m) {
  editId.value = m.id;
  editModulo.value = m;
  form.value = {
    nombre: m.nombre,
    slug: m.slug,
    descripcion: m.descripcion,
    programa: m.programa,
    alcance: m.alcance,
    orden: m.orden,
  };
  modal.value = true;
}

async function guardar() {
  if (editId.value) {
    const { slug, ...data } = form.value;
    await api.put(`/api/modulos/${editId.value}`, data);
  } else {
    await api.post('/api/modulos', form.value);
  }
  modal.value = null;
  await load();
}

async function eliminar(m) {
  if (!confirm(`¿Eliminar el módulo "${m.nombre}"?`)) return;
  await api.del(`/api/modulos/${m.id}`);
  await load();
}

function abrirAddItem() {
  addItemMod.value = editModulo.value;
  itemForm.value = { tipo: 'paso', titulo: '', descripcion: '', archivoUrl: '', orden: (editModulo.value?.items?.length || 0) + 1 };
}

async function saveItem() {
  await api.post(`/api/modulos/${addItemMod.value.id}/items`, { ...itemForm.value });
  addItemMod.value = null;
  await load();
  if (editId.value) {
    editModulo.value = modulos.value.find((m) => m.id === editId.value);
  }
}

onMounted(load);
</script>

<style scoped>
.modulos-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(30, 58, 95, 0.1);
}

.modulos-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--slate-500);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.modulos-tab:hover {
  color: var(--blue-800);
}

.modulos-tab.is-active {
  color: var(--blue-700);
  border-bottom-color: var(--blue-600);
  font-weight: 600;
}

.modulos-card {
  padding: 0;
  overflow: hidden;
}

.modulos-actions {
  display: flex;
  gap: 0.375rem;
}

.modulos-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid rgba(30, 58, 95, 0.12);
  border-radius: 6px;
  background: var(--white);
  color: var(--blue-800);
  cursor: pointer;
}

.modulos-icon-btn:hover {
  background: var(--surface-2, #f4f7fb);
}

.modulos-icon-btn--danger {
  color: var(--danger);
  border-color: rgba(220, 38, 38, 0.2);
}

.modulos-icon-btn--danger:hover {
  background: rgba(220, 38, 38, 0.06);
}

.modulos-empty {
  text-align: center;
  padding: 2rem;
  color: var(--slate-500);
}
</style>
