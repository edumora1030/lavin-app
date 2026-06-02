import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, getStoredUser, getToken, setSession, clearSession } from '../api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(getStoredUser());
  const token = ref(getToken());

  const isLoggedIn = computed(() => !!token.value);
  const rol = computed(() => user.value?.rol);

  function applySession(t, u) {
    token.value = t;
    user.value = u;
    setSession(t, u);
  }

  async function ingreso(nomina, password) {
    const body = { nomina: String(nomina).trim() };
    if (password) body.password = password;
    try {
      const data = await api.post('/api/auth/ingreso', body);
      applySession(data.token, data.usuario);
      return data.usuario;
    } catch (err) {
      if (err.codigo === 'REQUIERE_ESTABLECER_PASSWORD') {
        const e = new Error(err.message);
        e.codigo = err.codigo;
        e.nombre = err.nombre;
        throw e;
      }
      throw err;
    }
  }

  async function establecerPassword(nomina, passwordNueva) {
    const data = await api.post('/api/auth/establecer-password', {
      nomina: String(nomina).trim(),
      passwordNueva,
    });
    applySession(data.token, data.usuario);
    return data.usuario;
  }

  async function fetchMe() {
    const me = await api.get('/api/auth/me');
    user.value = me;
    setSession(token.value, me);
    return me;
  }

  async function updatePerfil(payload) {
    await api.put('/api/auth/me', payload);
    return fetchMe();
  }

  function logout() {
    clearSession();
    token.value = null;
    user.value = null;
  }

  function homeRoute() {
    if (user.value?.rol === 'admin') return '/admin';
    if (user.value?.rol === 'supervisor') return '/supervisor';
    return '/';
  }

  return {
    user,
    token,
    isLoggedIn,
    rol,
    applySession,
    ingreso,
    establecerPassword,
    fetchMe,
    updatePerfil,
    logout,
    homeRoute,
  };
});
