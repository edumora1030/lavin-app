<template>
  <div class="gate-inline">
    <div class="gate-panel">
      <LogoBlock />
      <div class="user-summary">
        <strong>{{ auth.user?.nombre }}</strong> · Nómina {{ auth.user?.nomina }}
      </div>

      <!-- Empleado sin acceso habilitado -->
      <div v-if="!tieneAcceso" class="gate-step-profile is-visible">
        <h2 class="profile-picker-title">Inducción no disponible</h2>
        <p class="profile-picker-desc gate-step-profile__desc">
          Tu acceso al programa de inducción aún no ha sido habilitado. Contacta a Recursos Humanos para más información.
        </p>
        <button type="button" class="btn btn-gate" @click="volverLogin">
          Volver a inicio de sesión
        </button>
      </div>

      <!-- Administrativo con ambas: muestra selector -->
      <div v-else-if="mostrarSelector" class="gate-step-scope is-visible">
        <h2 class="profile-picker-title">¿Qué inducción deseas realizar?</h2>
        <p class="profile-picker-desc">{{ PROGRAM_META[auth.user?.programa]?.programName ?? 'Programa de Inducción' }}</p>
        <div class="profile-grid">
          <button v-if="auth.user?.induccionEmpresaHabilitada" type="button" class="profile-option profile-option--scope" @click="ir('empresa')">
            <span class="profile-option-icon" aria-hidden="true">
              <Building2 :size="32" stroke-width="1.75" />
            </span>
            <h3>Inducción a la empresa</h3>
            <p>Cultura, normas, beneficios y todo lo que necesitas para integrarte.</p>
          </button>
          <button v-if="auth.user?.induccionPuestoHabilitada" type="button" class="profile-option profile-option--scope" @click="ir('puesto')">
            <span class="profile-option-icon" aria-hidden="true">
              <ClipboardList :size="32" stroke-width="1.75" />
            </span>
            <h3>Inducción al puesto</h3>
            <p>Funciones de tu área, herramientas del rol y actividades específicas.</p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { PROGRAM_META } from '../../constants/hero';
import LogoBlock from '../../components/LogoBlock.vue';
import { Building2, ClipboardList } from '@lucide/vue';

const auth = useAuthStore();
const router = useRouter();

const tieneAcceso = computed(() =>
  auth.user?.induccionEmpresaHabilitada || auth.user?.induccionPuestoHabilitada
);

const mostrarSelector = computed(() =>
  auth.user?.programa === 'administrativo' &&
  auth.user?.induccionEmpresaHabilitada &&
  auth.user?.induccionPuestoHabilitada
);

function ir(alcance) {
  router.push({ name: 'empleado-induccion', params: { alcance } });
}

function volverLogin() {
  auth.logout();
  router.push({ name: 'login' });
}

onMounted(async () => {
  await auth.fetchMe();
  const u = auth.user;
  if (!u?.induccionEmpresaHabilitada && !u?.induccionPuestoHabilitada) return;
  // Operativos or single-access → redirect directly
  const mostrar = u.programa === 'administrativo' && u.induccionEmpresaHabilitada && u.induccionPuestoHabilitada;
  if (!mostrar) {
    const alcance = u.induccionEmpresaHabilitada ? 'empresa' : 'puesto';
    router.replace({ name: 'empleado-induccion', params: { alcance } });
  }
});
</script>
