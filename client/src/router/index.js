import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../views/empleado/EmpleadoLayout.vue'),
    meta: { roles: ['empleado'] },
    children: [
      { path: '', name: 'empleado-gate', component: () => import('../views/empleado/GateView.vue') },
      { path: 'induccion/:alcance?', name: 'empleado-induccion', component: () => import('../views/empleado/InduccionView.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { roles: ['admin'] },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/DashboardView.vue') },
      { path: 'usuarios', name: 'admin-usuarios', component: () => import('../views/admin/UsuariosView.vue') },
      { path: 'progreso', name: 'admin-progreso', component: () => import('../views/admin/ProgresoView.vue') },
      { path: 'modulos', name: 'admin-modulos', component: () => import('../views/admin/ModulosView.vue') },
      { path: 'videos', name: 'admin-videos', component: () => import('../views/admin/VideosView.vue') },
      { path: 'examenes', name: 'admin-examenes', component: () => import('../views/admin/ExamenesView.vue') },
      { path: 'areas', name: 'admin-areas', component: () => import('../views/admin/AreasView.vue') },
      { path: 'dudas', name: 'admin-dudas', component: () => import('../views/admin/DudasView.vue') },
      { path: 'notificaciones', name: 'admin-notificaciones', component: () => import('../views/admin/NotificacionesView.vue') },
      { path: 'encuesta', name: 'admin-encuesta', component: () => import('../views/admin/EncuestaView.vue') },
    ],
  },
  {
    path: '/supervisor',
    component: () => import('../views/supervisor/SupervisorLayout.vue'),
    meta: { roles: ['supervisor', 'admin'] },
    children: [
      { path: '', name: 'supervisor-equipo', component: () => import('../views/supervisor/EquipoView.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    if (to.name === 'empleado-induccion' && from?.name === 'empleado-induccion') {
      return false;
    }
    return savedPosition ?? { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.token && !auth.user) {
    try { await auth.fetchMe(); } catch { auth.logout(); return { name: 'login' }; }
  }
  if (to.meta.public) {
    if (auth.isLoggedIn && to.name === 'login') return auth.homeRoute();
    return true;
  }

  if (!auth.isLoggedIn) return { name: 'login' };

  const roles = to.matched.find((r) => r.meta.roles)?.meta.roles;
  if (roles && !roles.includes(auth.rol)) {
    return auth.homeRoute();
  }

  if (auth.rol === 'empleado' && (to.path === '/' || to.name === 'empleado-gate')) {
    const u = auth.user;
    if (u?.induccionEmpresaHabilitada || u?.induccionPuestoHabilitada) {
      if (u.programa === 'operativo') {
        return { name: 'empleado-induccion', params: { alcance: 'empresa' } };
      }
      return { name: 'empleado-induccion', params: { alcance: 'empresa' } };
    }
  }

  return true;
});

export default router;
