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
        <select v-model="frol" class="usuarios-select" aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          <option value="empleado">Empleado</option>
          <option value="supervisor">Encargado de área</option>
          <option value="admin">RH</option>
        </select>
        <button type="button" class="usuarios-btn-primary" @click="abrirCrear">+ Nuevo usuario</button>
      </div>

      <div class="usuarios-table-wrap">
        <table class="usuarios-table">
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
              <td><span :class="{ 'usuarios-dash': !u.programa }">{{ programaLabel(u.programa) }}</span></td>
              <td>{{ areaNombre(u) }}</td>
              <td>
                <span class="usuarios-active" :class="{ 'usuarios-active--off': !u.activo }" :title="u.activo ? 'Activo' : 'Inactivo'">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="usuarios-actions">
                  <button type="button" class="usuarios-action-btn" @click="abrirEditar(u)">Editar</button>
                  <button
                    v-if="u.activo"
                    type="button"
                    class="usuarios-action-btn usuarios-action-btn--danger"
                    @click="toggleActivo(u, false)"
                  >Deshabilitar</button>
                  <button
                    v-else
                    type="button"
                    class="usuarios-action-btn"
                    style="background:#dcfce7;border-color:#bbf7d0;color:#16a34a;"
                    @click="toggleActivo(u, true)"
                  >Habilitar</button>
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
            <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.nombre }}</option>
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
import { api } from '../../api';
import AppModal from '../../components/AppModal.vue';

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

function programaLabel(p) {
  if (p === 'administrativo') return 'Administrativo';
  if (p === 'operativo') return 'Operativo';
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
      alert(`Usuario creado. Contraseña inicial: ${ult4}Lavin2024`);
    }
  }
  modal.value = null;
  await load();
}

async function toggleActivo(u, activo) {
  const msg = activo ? `¿Habilitar a ${u.nombre}?` : `¿Deshabilitar a ${u.nombre}?`;
  if (!confirm(msg)) return;
  await api.put(`/api/usuarios/${u.id}`, { activo });
  await load();
}

onMounted(async () => {
  await load();
  areas.value = await api.get('/api/areas');
});
</script>
