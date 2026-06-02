<template>
  <div class="page-login">
    <div class="gate">
      <div class="gate-panel">
        <LogoBlock />

        <div v-if="step === 'nomina'">
          <h1 class="gate-title">Accede con tu nómina</h1>
          <p class="gate-subtitle">Ingresa tu número de nómina para continuar con tu programa de inducción.</p>
          <form @submit.prevent="submitNomina">
            <div class="form-group" :class="{ 'is-invalid': nominaInvalid }">
              <label for="nomina">Número de nómina</label>
              <input id="nomina" v-model="nomina" required inputmode="numeric" autocomplete="username" placeholder="Ej. 12345">
              <span class="form-error">Ingresa tu número de nómina.</span>
            </div>
            <p v-if="error" class="form-error" style="display:block; margin-bottom:1rem;">{{ error }}</p>
            <button type="submit" class="btn btn-gate" :disabled="loading">Continuar</button>
          </form>
          <p style="margin-top:1.25rem; font-size:0.8125rem; color:var(--slate-500); text-align:center;">
            Personal de RR.HH.: si tu cuenta lo requiere, se pedirá contraseña en el siguiente paso.
          </p>
        </div>

        <div v-else-if="step === 'establecer'">
          <h1 class="gate-title gate-title--reset">REESTABLECE TU CONTRASEÑA</h1>
          <p class="gate-subtitle">
            Hola{{ nombrePendiente ? `, ${nombrePendiente}` : '' }}. Crea una contraseña personal para acceder con tu nómina.
          </p>
          <form @submit.prevent="submitEstablecer">
            <div class="form-group">
              <label for="passwordNueva">Nueva contraseña</label>
              <div class="password-field">
                <input
                  id="passwordNueva"
                  v-model="passwordNueva"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  minlength="8"
                >
                <button
                  type="button"
                  class="password-field__toggle"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="18" stroke-width="2" />
                  <Eye v-else :size="18" stroke-width="2" />
                </button>
              </div>
            </div>
            <div class="form-group">
              <label for="passwordConfirm">Confirmar contraseña</label>
              <input
                id="passwordConfirm"
                v-model="passwordConfirm"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                minlength="8"
              >
            </div>
            <p class="gate-hint">Mínimo 8 caracteres, una mayúscula y un número.</p>
            <p v-if="error" class="form-error" style="display:block; margin-bottom:1rem;">{{ error }}</p>
            <button type="submit" class="btn btn-gate" :disabled="loading">Guardar y entrar</button>
            <button type="button" class="btn-text" style="display:block; margin:1rem auto 0;" @click="volverNomina">
              ← Cambiar nómina
            </button>
          </form>
        </div>

        <div v-else>
          <h1 class="gate-title">{{ tituloPassword }}</h1>
          <p class="gate-subtitle">{{ subtituloPassword }}</p>
          <form @submit.prevent="submitPassword">
            <div class="form-group">
              <label for="password">Contraseña</label>
              <div class="password-field">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                >
                <button
                  type="button"
                  class="password-field__toggle"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="18" stroke-width="2" />
                  <Eye v-else :size="18" stroke-width="2" />
                </button>
              </div>
            </div>
            <p v-if="error" class="form-error" style="display:block; margin-bottom:1rem;">{{ error }}</p>
            <button type="submit" class="btn btn-gate" :disabled="loading">Entrar</button>
            <button type="button" class="btn-text" style="display:block; margin:1rem auto 0;" @click="volverNomina">
              ← Cambiar nómina
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LogoBlock from '../components/LogoBlock.vue';
import { Eye, EyeOff } from '@lucide/vue';

const auth = useAuthStore();
const router = useRouter();

const step = ref('nomina');
const nomina = ref('');
const password = ref('');
const passwordNueva = ref('');
const passwordConfirm = ref('');
const showPassword = ref(false);
const nominaInvalid = ref(false);
const error = ref('');
const loading = ref(false);
const nominaPendiente = ref('');
const nombrePendiente = ref('');
const rolPendiente = ref('');

const tituloPassword = computed(() =>
  rolPendiente.value === 'empleado' ? 'Ingresa tu contraseña' : 'Contraseña de administrador'
);

const subtituloPassword = computed(() =>
  rolPendiente.value === 'empleado'
    ? 'Usa la contraseña que estableciste con tu nómina.'
    : 'Tu cuenta requiere contraseña para acceder al panel.'
);

function volverNomina() {
  step.value = 'nomina';
  error.value = '';
  password.value = '';
  passwordNueva.value = '';
  passwordConfirm.value = '';
  showPassword.value = false;
}

async function submitNomina() {
  error.value = '';
  nominaInvalid.value = !nomina.value.trim();
  if (nominaInvalid.value) return;
  nominaPendiente.value = nomina.value.trim();
  loading.value = true;
  try {
    const u = await auth.ingreso(nominaPendiente.value);
    await router.push(auth.homeRoute());
  } catch (e) {
    if (e.codigo === 'REQUIERE_ESTABLECER_PASSWORD') {
      nombrePendiente.value = e.nombre || '';
      step.value = 'establecer';
    } else if (e.codigo === 'REQUIERE_PASSWORD') {
      rolPendiente.value = e.rol || 'empleado';
      step.value = 'password';
    } else {
      error.value = e.message;
    }
  } finally {
    loading.value = false;
  }
}

async function submitEstablecer() {
  error.value = '';
  if (passwordNueva.value !== passwordConfirm.value) {
    error.value = 'Las contraseñas no coinciden.';
    return;
  }
  loading.value = true;
  try {
    await auth.establecerPassword(nominaPendiente.value, passwordNueva.value);
    await router.push(auth.homeRoute());
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function submitPassword() {
  error.value = '';
  loading.value = true;
  try {
    await auth.ingreso(nominaPendiente.value, password.value);
    await router.push(auth.homeRoute());
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.gate-title--reset {
  font-size: 1.35rem;
  letter-spacing: 0.04em;
  color: var(--blue-900, #0f2744);
}

.gate-hint {
  margin: -0.25rem 0 1rem;
  font-size: 0.8125rem;
  color: var(--slate-500);
}
</style>
