<template>
  <div class="empleado-app">
    <div class="app-shell">
      <header v-if="showChrome" class="header">
        <div class="header-inner">
          <div class="header-brand-group">
            <router-link to="/induccion" class="logo logo--header">
              <div class="logo-brand">
                <div class="logo-icon logo-icon--header" aria-hidden="true"></div>
                <span class="logo-brand__name">LAVIN</span>
              </div>
              <span class="logo-divider" aria-hidden="true"></span>
              <div class="logo-titles">
                <span class="logo-text">Recursos Humanos</span>
                <span class="logo-sub">Programa de inducción</span>
              </div>
            </router-link>

            <div v-if="badgeText" class="header-user">
              <button
                type="button"
                class="profile-badge"
                :class="[badgeClass, { 'profile-badge--static': !canChangeScope }]"
                :aria-haspopup="canChangeScope ? 'true' : undefined"
                :aria-expanded="canChangeScope ? profileMenuOpen : undefined"
                @click="toggleProfileMenu"
              >
                <UserRound :size="14" stroke-width="2" />
                {{ badgeText }}
              </button>
              <div v-if="profileMenuOpen && canChangeScope" class="profile-menu" role="menu">
                <button
                  v-if="auth.user?.induccionEmpresaHabilitada"
                  type="button"
                  role="menuitem"
                  :class="{ 'is-active': route.params.alcance === 'empresa' }"
                  @click="goToScope('empresa')"
                >
                  Inducción a la empresa
                </button>
                <button
                  v-if="auth.user?.induccionPuestoHabilitada"
                  type="button"
                  role="menuitem"
                  :class="{ 'is-active': route.params.alcance === 'puesto' }"
                  @click="goToScope('puesto')"
                >
                  Inducción al puesto
                </button>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <nav class="nav nav--grouped" aria-label="Navegación principal">
              <a href="#inicio" @click.prevent="scrollTo('inicio')">
                <House :size="16" stroke-width="2" />
                Inicio
              </a>
              <a href="#modulos" @click.prevent="scrollTo('modulos')">
                <LayoutGrid :size="16" stroke-width="2" />
                Módulos
              </a>
              <a href="#contacto" @click.prevent="scrollTo('contacto')">
                <MessageCircle :size="16" stroke-width="2" />
                Contacto
              </a>
            </nav>
            <button type="button" class="btn-logout" @click="logout">
              <LogOut :size="14" stroke-width="2" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <router-view @profile-updated="refreshBadge" />

      <footer v-if="showChrome" class="app-footer">
        <div class="app-footer-inner">
          <p>© 2026 Recursos Humanos · Programa de inducción · Uso interno</p>
        </div>
      </footer>
    </div>

    <AppAlertDialog />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { House, LayoutGrid, LogOut, MessageCircle, UserRound } from '@lucide/vue';
import { useAuthStore } from '../../stores/auth';
import AppAlertDialog from '../../components/AppAlertDialog.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const profileMenuOpen = ref(false);

const showChrome = computed(() => route.name !== 'empleado-gate');

const badgeText = computed(() => {
  const u = auth.user;
  if (!u?.programa) return '';
  return u.programa === 'administrativo' ? 'Administrativo' : 'Operativo';
});

const badgeClass = computed(() =>
  auth.user?.programa === 'operativo' ? 'profile-badge--operativo' : 'profile-badge--administrativo'
);

const canChangeScope = computed(() =>
  auth.user?.programa === 'administrativo' &&
  auth.user?.induccionEmpresaHabilitada &&
  auth.user?.induccionPuestoHabilitada
);

function logout() {
  auth.logout();
  router.push('/login');
}

function refreshBadge() {
  auth.fetchMe();
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleProfileMenu() {
  if (!canChangeScope.value) return;
  profileMenuOpen.value = !profileMenuOpen.value;
}

function goToScope(alcance) {
  profileMenuOpen.value = false;
  router.push({ name: 'empleado-induccion', params: { alcance } });
}

function closeProfileMenu(event) {
  if (!event.target.closest('.header-user')) {
    profileMenuOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', closeProfileMenu));
onUnmounted(() => document.removeEventListener('click', closeProfileMenu));
</script>
