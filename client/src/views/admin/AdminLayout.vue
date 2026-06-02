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

      <nav>
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="admin-sidebar__link">
          <component :is="l.icon" :size="18" stroke-width="2" class="nav-icon" />
          <span class="admin-sidebar__link-label">{{ l.label }}</span>
          <span
            v-if="l.badge"
            class="admin-sidebar__count"
            :class="{ 'admin-sidebar__count--empty': badgeCount(l.badge) === 0 }"
            :aria-label="`${badgeCount(l.badge)} ${l.badge === 'dudas' ? 'dudas' : 'notificaciones'} pendientes`"
          >
            {{ badgeCount(l.badge) > 99 ? '99+' : badgeCount(l.badge) }}
          </span>
        </router-link>
      </nav>

      <div class="admin-sidebar__footer">
        <div ref="userMenuRef" class="admin-sidebar__user-menu">
          <button
            type="button"
            class="admin-sidebar__user admin-sidebar__user--trigger"
            :aria-expanded="userMenuOpen"
            aria-haspopup="menu"
            @click.stop="toggleUserMenu"
          >
            <div class="admin-sidebar__avatar">{{ userInitials }}</div>
            <div class="admin-sidebar__user-info">
              <div class="admin-sidebar__user-name">{{ auth.user?.nombre }}</div>
              <div class="admin-sidebar__user-role">Recursos Humanos</div>
            </div>
            <ChevronUp
              v-if="userMenuOpen"
              :size="18"
              stroke-width="2"
              class="admin-sidebar__user-chevron"
              aria-hidden="true"
            />
            <ChevronDown
              v-else
              :size="18"
              stroke-width="2"
              class="admin-sidebar__user-chevron"
              aria-hidden="true"
            />
          </button>
          <div v-show="userMenuOpen" class="admin-sidebar__user-dropdown" role="menu">
            <button type="button" class="admin-sidebar__logout" role="menuitem" @click="logout">
              <LogOut :size="18" stroke-width="2" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </aside>
    <main class="admin-main">
      <router-view />
    </main>
  </div>

  <AppAlertDialog />
  <AppConfirmDialog />
</template>

<script setup>
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue';
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
  ChevronDown,
  ChevronUp,
} from '@lucide/vue';
import AppAlertDialog from '../../components/AppAlertDialog.vue';
import AppConfirmDialog from '../../components/AppConfirmDialog.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const notificacionesPendientes = ref(0);
const dudasPendientes = ref(0);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/progreso', label: 'Progreso', icon: TrendingUp },
  { to: '/admin/modulos', label: 'Módulos', icon: BookOpen },
  { to: '/admin/checklist-puesto', label: 'Checklist puesto', icon: ClipboardList },
  { to: '/admin/areas', label: 'Áreas', icon: Building2 },
  { to: '/admin/dudas', label: 'Dudas', icon: CircleHelp, badge: 'dudas' },
  { to: '/admin/notificaciones', label: 'Notificaciones', icon: Bell, badge: 'notificaciones' },
  { to: '/admin/encuesta', label: 'Encuesta', icon: ClipboardList },
  { to: '/admin/videos', label: 'Videos', icon: Video },
];

function badgeCount(key) {
  if (key === 'dudas') return dudasPendientes.value;
  if (key === 'notificaciones') return notificacionesPendientes.value;
  return 0;
}

const userInitials = computed(() => {
  const parts = (auth.user?.nombre || 'RH').split(' ').filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
});

async function loadCounts() {
  const [notiResult, dudasResult] = await Promise.allSettled([
    api.get('/api/notificaciones/pendientes/count'),
    api.get('/api/dudas/pendientes/count'),
  ]);
  if (notiResult.status === 'fulfilled') {
    notificacionesPendientes.value = Number(notiResult.value?.total) || 0;
  }
  if (dudasResult.status === 'fulfilled') {
    dudasPendientes.value = Number(dudasResult.value?.total) || 0;
  }
}

function loadNotificacionesCount() { return loadCounts(); }
function refreshSidebarCounts() { return loadCounts(); }

const COUNT_POLL_MS = 45_000;
let countPollId = null;

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

function closeUserMenu() {
  userMenuOpen.value = false;
}

function onDocumentClick(e) {
  if (!userMenuRef.value?.contains(e.target)) closeUserMenu();
}

onMounted(() => {
  loadCounts();
  countPollId = window.setInterval(loadCounts, COUNT_POLL_MS);
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  if (countPollId != null) window.clearInterval(countPollId);
  document.removeEventListener('click', onDocumentClick);
});

provide('refreshNotificacionesCount', refreshSidebarCounts);
provide('refreshDudasCount', refreshSidebarCounts);

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/admin')) loadCounts();
  }
);

function logout() {
  closeUserMenu();
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.admin-sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.nav-icon {
  flex-shrink: 0;
  opacity: 0.85;
}

.admin-sidebar__link-label {
  flex: 1;
}

.admin-sidebar__count {
  margin-left: auto;
  flex-shrink: 0;
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

.admin-sidebar__count--empty {
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
}

.admin-sidebar nav a.router-link-active .nav-icon {
  opacity: 1;
  color: var(--blue-700, #1d4ed8);
}

.admin-sidebar nav a.router-link-active .admin-sidebar__count {
  background: var(--blue-700, #1d4ed8);
  color: #fff;
}

.admin-sidebar nav a.router-link-active .admin-sidebar__count--empty {
  background: #e2e8f0;
  color: var(--slate-600, #475569);
}
</style>
