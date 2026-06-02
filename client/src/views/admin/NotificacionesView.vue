<template>
  <div>
    <div class="admin-page-header">
      <h1>Notificaciones</h1>
      <p>Solicitudes de empleados: recorrido en planta, sistemas y recuperación de contraseña.</p>
    </div>

    <div class="admin-toolbar">
      <AdminFilterBar v-model="filtroEstado" :options="filtros" aria-label="Filtrar notificaciones" />
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
                <div v-if="n.estado === 'pendiente'" class="notificacion-actions">
                  <button
                    v-if="n.tipo === 'recuperar_password'"
                    type="button"
                    class="icon-btn"
                    :class="{ 'is-loading': reseteando === n.id }"
                    :disabled="reseteando === n.id"
                    title="Restablecer contraseña"
                    aria-label="Restablecer contraseña"
                    @click="restablecerPassword(n)"
                  >
                    <KeyRound :size="15" stroke-width="2" />
                  </button>
                  <button
                    type="button"
                    class="icon-btn icon-btn--success"
                    :class="{ 'is-loading': atendiendo === n.id }"
                    :disabled="atendiendo === n.id || reseteando === n.id"
                    title="Marcar como atendida"
                    aria-label="Marcar como atendida"
                    @click="atender(n)"
                  >
                    <CircleCheck :size="15" stroke-width="2" />
                  </button>
                </div>
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
import { CircleCheck, KeyRound } from '@lucide/vue';
import { api } from '../../api';
import AdminFilterBar from '../../components/AdminFilterBar.vue';
import { useAppAlert } from '../../composables/useAppAlert';
import { useAppConfirm } from '../../composables/useAppConfirm';

const refreshNotificacionesCount = inject('refreshNotificacionesCount', null);
const { showAlert } = useAppAlert();
const { showConfirm } = useAppConfirm();

const loading = ref(true);
const notificaciones = ref([]);
const filtroEstado = ref('pendiente');
const atendiendo = ref(null);
const reseteando = ref(null);

const filtros = computed(() => [
  { value: '', label: 'Todas', count: notificaciones.value.length },
  { value: 'pendiente', label: 'Pendientes', count: notificaciones.value.filter((n) => n.estado === 'pendiente').length },
  { value: 'atendida', label: 'Atendidas', count: notificaciones.value.filter((n) => n.estado === 'atendida').length },
]);

const notificacionesFiltradas = computed(() => {
  if (!filtroEstado.value) return notificaciones.value;
  return notificaciones.value.filter((n) => n.estado === filtroEstado.value);
});

function tipoLabel(tipo) {
  if (tipo === 'recorrido_planta') return 'Recorrido en planta';
  if (tipo === 'sistemas') return 'Sistemas';
  if (tipo === 'recuperar_password') return 'Recuperar contraseña';
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

async function restablecerPassword(n) {
  const ok = await showConfirm({
    title: '¿Restablecer contraseña?',
    message: `${n.usuario.nombre} podrá crear una nueva contraseña al ingresar su nómina.`,
    variant: 'info',
    confirmLabel: 'Restablecer',
  });
  if (!ok) return;

  reseteando.value = n.id;
  try {
    await api.post(`/api/usuarios/${n.usuario.id}/reset-password`, {});
    await api.put(`/api/notificaciones/${n.id}/atender`);
    await load();
    refreshNotificacionesCount?.();
    showAlert({
      title: 'Contraseña restablecida',
      message: 'El colaborador debe ingresar su nómina y crear una nueva contraseña.',
      variant: 'info',
    });
  } finally {
    reseteando.value = null;
  }
}

onMounted(async () => {
  await load();
  refreshNotificacionesCount?.();
});
</script>

<style scoped>
.notificacion-actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
</style>
