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

        <div v-else>
          <h1 class="gate-title">Contraseña de administrador</h1>
          <p class="gate-subtitle">Tu cuenta requiere contraseña para acceder al panel.</p>
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
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="18" stroke-width="2" />
                  <Eye v-else :size="18" stroke-width="2" />
                </button>
              </div>
            </div>
            <p v-if="error" class="form-error" style="display:block; margin-bottom:1rem;">{{ error }}</p>
            <button type="submit" class="btn btn-gate" :disabled="loading">Entrar</button>
            <button type="button" class="btn-text" style="display:block; margin:1rem auto 0;" @click="step = 'nomina'; error = ''; showPassword = false">
              ← Cambiar nómina
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LogoBlock from '../components/LogoBlock.vue';
import { Eye, EyeOff } from '@lucide/vue';

const auth = useAuthStore();
const router = useRouter();

const step = ref('nomina');
const nomina = ref('');
const password = ref('');
const showPassword = ref(false);
const nominaInvalid = ref(false);
const error = ref('');
const loading = ref(false);
const nominaPendiente = ref('');

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
    if (e.codigo === 'REQUIERE_PASSWORD') {
      step.value = 'password';
    } else {
      error.value = e.message;
    }
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
