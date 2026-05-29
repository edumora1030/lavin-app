<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <h1>Encargado de área</h1>
      <nav>
        <router-link to="/supervisor">Mi equipo</router-link>
        <router-link v-if="auth.rol === 'admin'" to="/admin">Panel RR.HH.</router-link>
        <router-link v-if="auth.rol === 'empleado'" to="/induccion">Mi inducción</router-link>
      </nav>
      <div style="margin-top:2rem; font-size:13px; opacity:0.7;">
        <p>{{ auth.user?.nombre }}</p>
        <button class="btn ghost" style="margin-top:8px; width:100%;" @click="logout">Cerrar sesión</button>
      </div>
    </aside>
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.admin-sidebar nav a.router-link-active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}
</style>
