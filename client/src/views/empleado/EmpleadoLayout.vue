<template>
  <div class="empleado-app">
    <div class="app-shell">
      <header v-if="showChrome" class="header">
        <div class="header-inner">
          <router-link to="/induccion" class="logo">
            <div class="logo-icon" aria-hidden="true"></div>
            <div>
              <span class="logo-text">Recursos Humanos</span>
              <span class="logo-sub">Programa de inducción</span>
            </div>
          </router-link>
          <div class="header-user">
            <span v-if="badgeText" class="profile-badge" :class="badgeClass">{{ badgeText }}</span>
            <button type="button" class="btn-text" @click="goGate">Cambiar perfil</button>
            <button type="button" class="btn-text" @click="logout">Cerrar sesión</button>
          </div>
          <nav class="nav" aria-label="Navegación principal">
            <a href="#inicio" @click.prevent="scrollTo('inicio')">Inicio</a>
            <a href="#modulos" @click.prevent="scrollTo('modulos')">Módulos</a>
            <a href="#contacto" @click.prevent="scrollTo('contacto')">Contacto</a>
          </nav>
        </div>
      </header>

      <router-view @profile-updated="refreshBadge" />

      <footer v-if="showChrome" class="app-footer">
        <div class="app-footer-inner">
          <p>© 2026 Recursos Humanos · Programa de inducción · Uso interno</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const showChrome = computed(() => route.name === 'empleado-induccion');

const badgeText = computed(() => {
  const u = auth.user;
  if (!u?.programa) return '';
  const label = u.programa === 'administrativo' ? 'Administrativo' : 'Operativo';
  return label;
});

const badgeClass = computed(() => '');

function goGate() {
  router.push({ name: 'empleado-gate' });
}

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
</script>
