<template>
  <div class="usuarios-page">
    <div class="admin-page-header">
      <h1>Usuarios</h1>
      <p>Administra cuentas de empleados, encargados de área y RH</p>
    </div>

    <div class="usuarios-card">
      <div class="usuarios-toolbar">
        <div class="usuarios-search">
          <span class="usuarios-search__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input v-model="q" type="search" placeholder="Buscar nombre o nómina" autocomplete="off">
        </div>
        <AdminFilterBar v-model="frol" :options="filtrosRol" aria-label="Filtrar por rol" />
        <button type="button" class="usuarios-btn-primary" @click="abrirCrear">+ Nuevo usuario</button>
      </div>

      <div class="usuarios-table-wrap">
        <table class="usuarios-table">
          <colgroup>
            <col class="col-nomina">
            <col class="col-nombre">
            <col class="col-tipo">
            <col class="col-programa">
            <col class="col-area">
            <col class="col-estado">
            <col class="col-acciones">
          </colgroup>
          <thead>
            <tr>
              <th>Nómina</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Programa</th>
              <th>Área</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted)">Cargando…</td>
            </tr>
            <tr v-else-if="!paginatedList.length">
              <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted)">No hay usuarios</td>
            </tr>
            <tr v-for="u in paginatedList" :key="u.id">
              <td><span class="usuarios-nomina">{{ u.nomina }}</span></td>
              <td>
                <div class="usuarios-name-cell">
                  <div class="usuarios-avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span class="usuarios-name">{{ u.nombre }}</span>
                </div>
              </td>
              <td>
                <span class="usuarios-badge" :class="`usuarios-badge--${u.rol}`">{{ rolLabel(u.rol) }}</span>
              </td>
              <td><span :class="{ 'usuarios-dash': programaDisplay(u) === '—' }">{{ programaDisplay(u) }}</span></td>
              <td><span :class="{ 'usuarios-dash': areaNombre(u) === '—' }">{{ areaNombre(u) }}</span></td>
              <td>
                <span class="usuarios-active" :class="{ 'usuarios-active--off': !u.activo }" :title="u.activo ? 'Activo' : 'Inactivo'">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="usuarios-actions">
                  <button
                    type="button"
                    class="icon-btn"
                    title="Editar usuario"
                    aria-label="Editar usuario"
                    @click="abrirEditar(u)"
                  >
                    <Pencil :size="15" stroke-width="2" />
                  </button>
                  <button
                    v-if="u.activo"
                    type="button"
                    class="icon-btn icon-btn--danger"
                    title="Deshabilitar usuario"
                    aria-label="Deshabilitar usuario"
                    @click="toggleActivo(u, false)"
                  >
                    <Ban :size="15" stroke-width="2" />
                  </button>
                  <button
                    v-else
                    type="button"
                    class="icon-btn icon-btn--success"
                    title="Habilitar usuario"
                    aria-label="Habilitar usuario"
                    @click="toggleActivo(u, true)"
                  >
                    <CircleCheck :size="15" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="usuarios-footer">
        <span>{{ rangeText }}</span>
        <div class="usuarios-pagination">
          <button type="button" class="usuarios-page-btn" :disabled="currentPage <= 1" @click="currentPage--">‹</button>
          <button
            v-for="p in visiblePages"
            :key="p"
            type="button"
            class="usuarios-page-btn"
            :class="{ 'is-active': p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>
          <button type="button" class="usuarios-page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">›</button>
        </div>
      </div>
    </div>

    <AppModal v-if="modal" @close="modal = null">
      <h2>{{ editId ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
      <form @submit.prevent="guardar">
        <div class="form-group"><label>Nombre</label><input v-model="form.nombre" required></div>
        <div class="form-group">
          <label>Nómina</label>
          <input v-model="form.nomina" required :disabled="!!editId">
        </div>
        <div class="form-group"><label>Email</label><input v-model="form.email" type="email"></div>
        <div class="form-group">
          <label>Tipo de cuenta</label>
          <select v-model="form.rol" @change="onRolChange">
            <option value="empleado">Empleado</option>
            <option value="supervisor">Encargado de área</option>
            <option value="admin">RH (Administrador)</option>
          </select>
        </div>
        <div v-if="form.rol === 'empleado'" class="form-group">
          <label>Programa</label>
          <select v-model="form.programa">
            <option value="operativo">Operativo</option>
            <option value="administrativo">Administrativo</option>
          </select>
        </div>
        <div class="form-group">
          <label>Área</label>
          <select v-model="form.areaId">
            <option value="">— Sin área —</option>
            <option v-for="a in areasActivas" :key="a.id" :value="a.id">{{ a.nombre }}</option>
          </select>
        </div>
        <div v-if="form.rol === 'empleado'" style="margin:12px 0;">
          <label style="display:flex; gap:8px; align-items:center; cursor:pointer;">
            <input v-model="form.induccionEmpresaHabilitada" type="checkbox">
            Habilitar Inducción a la empresa
          </label>
          <label v-if="form.programa === 'administrativo'" style="display:flex; gap:8px; align-items:center; cursor:pointer; margin-top:8px;">
            <input v-model="form.induccionPuestoHabilitada" type="checkbox">
            Habilitar Inducción al puesto
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="modal = null">Cancelar</button>
          <button type="submit" class="btn">{{ editId ? 'Guardar' : 'Crear' }}</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { Pencil, Ban, CircleCheck } from '@lucide/vue';
import { useAppAlert } from '../../composables/useAppAlert';
import { useAppConfirm } from '../../composables/useAppConfirm';
import { api } from '../../api';
import AppModal from '../../components/AppModal.vue';
import AdminFilterBar from '../../components/AdminFilterBar.vue';
const { showAlert } = useAppAlert();
const { showConfirm } = useAppConfirm();

const q = ref('');
const frol = ref('');
const list = ref([]);
const areas = ref([]);
const loading = ref(false);
const modal = ref(false);
const editId = ref(null);
const form = ref(emptyForm());

const currentPage = ref(1);
const pageSize = ref(10);

const areasActivas = computed(() => areas.value.filter((a) => a.activo));

const filtrosRol = computed(() => [
  { value: '', label: 'Todos', count: list.value.length },
  { value: 'empleado', label: 'Empleado', count: list.value.filter((u) => u.rol === 'empleado').length },
  { value: 'supervisor', label: 'Encargado', count: list.value.filter((u) => u.rol === 'supervisor').length },
  { value: 'admin', label: 'RH', count: list.value.filter((u) => u.rol === 'admin').length },
]);

function emptyForm() {
  return {
    nombre: '', nomina: '', email: '', rol: 'empleado',
    programa: 'operativo', areaId: '',
    induccionEmpresaHabilitada: true, induccionPuestoHabilitada: false,
  };
}

function rolLabel(r) {
  if (r === 'admin') return 'RH';
  if (r === 'supervisor') return 'Encargado';
  return 'Empleado';
}

function programaDisplay(u) {
  if (u.rol !== 'empleado') return '—';
  if (u.programa === 'administrativo') return 'Administrativo';
  if (u.programa === 'operativo') return 'Operativo';
  return '—';
}

function areaNombre(u) {
  const a = areas.value.find((x) => x.id === u.areaId);
  return a?.nombre || u.area || '—';
}

function onRolChange() {
  if (form.value.rol !== 'empleado') {
    form.value.programa = null;
    form.value.induccionEmpresaHabilitada = false;
    form.value.induccionPuestoHabilitada = false;
  } else {
    form.value.programa = 'operativo';
    form.value.induccionEmpresaHabilitada = true;
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(list.value.length / pageSize.value)));
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return list.value.slice(start, start + pageSize.value);
});
const rangeText = computed(() => {
  const total = list.value.length;
  if (!total) return 'Mostrando 0 de 0 usuarios';
  const start = (currentPage.value - 1) * pageSize.value + 1;
  const end = Math.min(currentPage.value * pageSize.value, total);
  return `Mostrando ${start} a ${end} de ${total} usuarios`;
});
const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  return pages.length <= 7 ? pages : [currentPage.value];
});

watch([q, frol], () => { currentPage.value = 1; load(); });

async function load() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (q.value) params.set('q', q.value);
    if (frol.value) params.set('rol', frol.value);
    list.value = await api.get('/api/usuarios?' + params.toString());
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  editId.value = null;
  form.value = emptyForm();
  modal.value = true;
}

function abrirEditar(u) {
  editId.value = u.id;
  form.value = {
    nombre: u.nombre,
    nomina: u.nomina,
    email: u.email || '',
    rol: u.rol,
    programa: u.programa || 'operativo',
    areaId: u.areaId || '',
    induccionEmpresaHabilitada: u.induccionEmpresaHabilitada ?? false,
    induccionPuestoHabilitada: u.induccionPuestoHabilitada ?? false,
  };
  modal.value = true;
}

async function guardar() {
  const payload = { ...form.value };
  if (!payload.areaId) payload.areaId = null;

  if (editId.value) {
    await api.put(`/api/usuarios/${editId.value}`, payload);
  } else {
    const u = await api.post('/api/usuarios', payload);
    if (u.rol === 'admin' || u.rol === 'supervisor') {
      const ult4 = String(u.nomina).slice(-4).padStart(4, '0');
      showAlert({ title: 'Usuario creado', message: `Contraseña inicial: ${ult4}Lavin2024`, variant: 'info' });
    }
  }
  modal.value = null;
  await load();
}

async function toggleActivo(u, activo) {
  const ok = await showConfirm({
    title: activo ? '¿Habilitar usuario?' : '¿Deshabilitar usuario?',
    message: activo ? `${u.nombre} podrá iniciar sesión nuevamente.` : `${u.nombre} no podrá acceder al sistema.`,
    variant: activo ? 'info' : 'danger',
    confirmLabel: activo ? 'Habilitar' : 'Deshabilitar',
  });
  if (!ok) return;
  await api.put(`/api/usuarios/${u.id}`, { activo });
  await load();
}

onMounted(async () => {
  await load();
  areas.value = await api.get('/api/areas');
});
</script>
