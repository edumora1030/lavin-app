<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <div class="admin-sidebar__brand-icon">
          <Building2 :size="22" stroke-width="2" />
        </div>
        <div class="admin-sidebar__brand-text">
          <h1>RR.HH. Lavín</h1>
          <span>Panel de inducción</span>
        </div>
      </div>

      <div class="admin-sidebar__user">
        <div class="admin-sidebar__avatar">{{ userInitials }}</div>
        <div class="admin-sidebar__user-info">
          <div class="admin-sidebar__user-name">{{ auth.user?.nombre }}</div>
          <div class="admin-sidebar__user-role">Recursos Humanos</div>
        </div>
      </div>

      <nav>
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="admin-sidebar__link">
          <component :is="l.icon" :size="18" stroke-width="2" class="nav-icon" />
          <span class="admin-sidebar__link-label">{{ l.label }}</span>
          <span
            v-if="l.to === '/admin/notificaciones' && notificacionesPendientes > 0"
            class="admin-sidebar__count"
            :aria-label="`${notificacionesPendientes} notificaciones pendientes`"
          >
            {{ notificacionesPendientes > 99 ? '99+' : notificacionesPendientes }}
          </span>
        </router-link>
      </nav>

      <div class="admin-sidebar__footer">
        <button type="button" class="admin-sidebar__logout" @click="logout">
          <LogOut :size="18" stroke-width="2" />
          Cerrar sesión
        </button>
      </div>
    </aside>
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, provide, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../api';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BookOpen,
  Building2,
  CircleHelp,
  ClipboardList,
  Video,
  LogOut,
  Bell,
} from '@lucide/vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const notificacionesPendientes = ref(0);

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/progreso', label: 'Progreso', icon: TrendingUp },
  { to: '/admin/modulos', label: 'Módulos', icon: BookOpen },
  { to: '/admin/areas', label: 'Áreas', icon: Building2 },
  { to: '/admin/dudas', label: 'Dudas', icon: CircleHelp },
  { to: '/admin/notificaciones', label: 'Notificaciones', icon: Bell },
  { to: '/admin/encuesta', label: 'Encuesta', icon: ClipboardList },
  { to: '/admin/videos', label: 'Videos', icon: Video },
];

const userInitials = computed(() => {
  const parts = (auth.user?.nombre || 'RH').split(' ').filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
});

async function loadNotificacionesCount() {
  try {
    const list = await api.get('/api/notificaciones?estado=pendiente');
    notificacionesPendientes.value = Array.isArray(list) ? list.length : 0;
  } catch {
    notificacionesPendientes.value = 0;
  }
}

onMounted(loadNotificacionesCount);
provide('refreshNotificacionesCount', loadNotificacionesCount);

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/admin')) loadNotificacionesCount();
  }
);

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.nav-icon {
  flex-shrink: 0;
  opacity: 0.85;
}

.admin-sidebar__link-label {
  flex: 1;
}

.admin-sidebar__count {
  margin-left: auto;
  min-width: 1.375rem;
  height: 1.375rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.admin-sidebar nav a.router-link-active .nav-icon {
  opacity: 1;
  color: var(--blue-700, #1d4ed8);
}

.admin-sidebar nav a.router-link-active .admin-sidebar__count {
  background: var(--blue-700, #1d4ed8);
  color: #fff;
}
</style>
