<template>
  <div>
    <div class="admin-page-header">
      <h1>Notificaciones</h1>
      <p>Solicitudes de recorrido en planta y sistemas enviadas por empleados al completar su inducción.</p>
    </div>

    <div class="admin-toolbar">
      <select v-model="filtroEstado" class="form-input" style="width:auto;">
        <option value="">Todas</option>
        <option value="pendiente">Pendientes</option>
        <option value="atendida">Atendidas</option>
      </select>
    </div>

    <div v-if="loading" style="color:var(--slate-500)">Cargando…</div>

    <div v-else class="admin-card" style="padding:0; overflow:hidden;">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Área</th>
              <th>Solicitud</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in notificacionesFiltradas" :key="n.id">
              <td>
                <strong>{{ n.usuario.nombre }}</strong>
                <div style="font-size:0.8125rem; color:var(--slate-500); margin-top:2px;">{{ n.usuario.nomina }}</div>
              </td>
              <td>{{ n.usuario.areaRel?.nombre || n.usuario.area || '—' }}</td>
              <td>{{ tipoLabel(n.tipo) }}</td>
              <td>{{ formatFecha(n.creadoEn) }}</td>
              <td>
                <span :style="{ color: n.estado === 'pendiente' ? 'var(--warning)' : 'var(--success)' }">
                  {{ n.estado === 'pendiente' ? 'Pendiente' : 'Atendida' }}
                </span>
              </td>
              <td>
                <button
                  v-if="n.estado === 'pendiente'"
                  type="button"
                  class="admin-btn admin-btn--primary"
                  :disabled="atendiendo === n.id"
                  @click="atender(n)"
                >
                  {{ atendiendo === n.id ? 'Guardando…' : 'Marcar atendida' }}
                </button>
                <span v-else style="font-size:0.8125rem; color:var(--slate-500);">
                  {{ n.atendidaEn ? formatFecha(n.atendidaEn) : '—' }}
                </span>
              </td>
            </tr>
            <tr v-if="!notificacionesFiltradas.length">
              <td colspan="6" style="text-align:center; padding:2rem; color:var(--slate-500)">Sin notificaciones.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { api } from '../../api';

const refreshNotificacionesCount = inject('refreshNotificacionesCount', null);

const loading = ref(true);
const notificaciones = ref([]);
const filtroEstado = ref('pendiente');
const atendiendo = ref(null);

const notificacionesFiltradas = computed(() => {
  if (!filtroEstado.value) return notificaciones.value;
  return notificaciones.value.filter((n) => n.estado === filtroEstado.value);
});

function tipoLabel(tipo) {
  if (tipo === 'recorrido_planta') return 'Recorrido en planta';
  if (tipo === 'sistemas') return 'Sistemas';
  return tipo;
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function load() {
  loading.value = true;
  try {
    notificaciones.value = await api.get('/api/notificaciones');
  } finally {
    loading.value = false;
  }
}

async function atender(n) {
  atendiendo.value = n.id;
  try {
    await api.put(`/api/notificaciones/${n.id}/atender`);
    await load();
    refreshNotificacionesCount?.();
  } finally {
    atendiendo.value = null;
  }
}

onMounted(load);
</script>
