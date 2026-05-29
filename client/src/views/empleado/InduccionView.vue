<template>
  <div v-if="loading" class="hero"><div class="hero-inner"><p>Cargando…</p></div></div>

  <template v-else>
    <div class="inicio-section">
      <section class="hero-banner" id="inicio">
        <img
          :src="portadaUrl"
          alt="Instalaciones Lavín"
          class="hero-banner__photo"
        >
        <div class="hero-banner__overlay" aria-hidden="true" />
        <div class="hero-banner__inner">
          <div class="hero-banner__content">
            <span class="hero-banner__badge">
              <Building2 :size="14" stroke-width="2" />
              {{ heroBadge }}
            </span>
            <h1>{{ heroTitle }}</h1>
            <p>{{ heroDesc }}</p>
            <div class="hero-banner__actions">
              <button type="button" class="hero-btn hero-btn--primary" @click="scrollToModulos">
                <Play :size="18" fill="currentColor" />
                Comenzar inducción
              </button>
              <button type="button" class="hero-btn hero-btn--ghost" @click="scrollToModulosHelp">
                <CircleHelp :size="18" stroke-width="2" />
                ¿Cómo funciona?
              </button>
            </div>
          </div>
        </div>
      </section>

      <section v-if="showAlcanceSelector" class="route-picker">
        <div class="route-picker__head">
          <Layers :size="20" stroke-width="2" />
          <div>
            <h2>Elige tu ruta de inducción</h2>
            <p>Selecciona el tipo de inducción que te corresponde.</p>
          </div>
        </div>

        <div class="route-picker__grid">
          <button
            type="button"
            class="route-card route-card--empresa"
            :class="{ 'is-active': alcance === 'empresa' }"
            @click="selectAlcance('empresa')"
          >
            <span class="route-card__icon">
              <Building2 :size="18" stroke-width="1.75" />
            </span>
            <div class="route-card__body">
              <strong>Inducción a la empresa</strong>
              <span>Cultura, normas, beneficios y todo lo que necesitas para integrarte.</span>
            </div>
            <ChevronRight :size="16" class="route-card__arrow" />
          </button>

          <button
            type="button"
            class="route-card route-card--puesto"
            :class="{ 'is-active': alcance === 'puesto' }"
            @click="selectAlcance('puesto')"
          >
            <span class="route-card__icon">
              <Briefcase :size="18" stroke-width="1.75" />
            </span>
            <div class="route-card__body">
              <strong>Inducción al puesto</strong>
              <span>Funciones de tu área, herramientas del rol y actividades específicas.</span>
            </div>
            <ChevronRight :size="16" class="route-card__arrow" />
          </button>

          <button type="button" class="route-help" @click="scrollToContacto">
            <span class="route-help__icon">
              <CircleHelp :size="18" stroke-width="2" />
            </span>
            <strong>¿Necesitas ayuda?</strong>
            <p>El equipo de RR.HH. está disponible para apoyarte en tu proceso de integración.</p>
            <span class="route-help__link">Ver ayuda →</span>
          </button>
        </div>
      </section>
    </div>

    <div class="empleado-main">
      <section id="modulos" class="induccion-course-section">
        <div class="modules-section-header">
          <div class="modules-section-header__text">
            <p class="section-label">Programa</p>
            <h2 class="section-title">Tus módulos de inducción</h2>
            <p class="section-desc">Sigue el orden recomendado para completar tu inducción de forma clara y efectiva.</p>
          </div>
          <div v-if="!showAlcanceSelector" class="modules-help-card" id="modulos-ayuda">
            <span class="modules-help-card__icon" aria-hidden="true">
              <PlayCircle :size="22" />
            </span>
            <div>
              <strong>¿Cómo funciona?</strong>
              <p>Cada módulo incluye un video. Debes completarlos en orden para avanzar en tu inducción.</p>
            </div>
          </div>
        </div>

        <InduccionCourse
          ref="courseRef"
          embedded
          :modulos="modulos"
          :progreso="progreso"
          :pct="pct"
          :progress-note="progressNote"
          @refresh="refreshProgreso"
          @examen="openExamen"
          @duda="abrirDuda"
          @module-change="activeModuloId = $event"
        />

        <div v-if="induccionCompleta" class="post-induccion">
          <div class="post-induccion__header">
            <CircleCheck :size="28" stroke-width="2" />
            <div>
              <h3>¡Felicidades! Completaste tu inducción</h3>
              <p>Solicita los siguientes pasos y el equipo de RR.HH. recibirá tu aviso para coordinarte.</p>
            </div>
          </div>

          <div class="post-induccion__actions">
            <button
              type="button"
              class="post-induccion__btn"
              :class="{ 'is-sent': solicitudEstado('recorrido_planta') === 'pendiente', 'is-done': solicitudEstado('recorrido_planta') === 'atendida' }"
              :disabled="solicitando === 'recorrido_planta' || solicitudEstado('recorrido_planta') !== null"
              @click="solicitarPaso('recorrido_planta')"
            >
              <span class="post-induccion__btn-icon">
                <Factory :size="22" />
              </span>
              <span class="post-induccion__btn-text">
                <strong>Recorrido en planta</strong>
                <span>{{ labelSolicitud('recorrido_planta') }}</span>
              </span>
            </button>

            <button
              type="button"
              class="post-induccion__btn"
              :class="{ 'is-sent': solicitudEstado('sistemas') === 'pendiente', 'is-done': solicitudEstado('sistemas') === 'atendida' }"
              :disabled="solicitando === 'sistemas' || solicitudEstado('sistemas') !== null"
              @click="solicitarPaso('sistemas')"
            >
              <span class="post-induccion__btn-icon">
                <Monitor :size="22" />
              </span>
              <span class="post-induccion__btn-text">
                <strong>Sistemas</strong>
                <span>{{ labelSolicitud('sistemas') }}</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section id="contacto" class="section section--contact">
        <div class="section-header">
          <p class="section-label">Contacto</p>
          <h2 class="section-title">¿Necesitas ayuda?</h2>
          <p class="section-desc">El equipo de Recursos Humanos está para apoyarte durante todo tu proceso de integración.</p>
        </div>
        <div class="contact-grid">
          <div class="contact-card">
            <h3>Nómina, vacaciones, contrataciones, etc.</h3>
            <a href="mailto:dbajonero@lavin.com.mx">dbajonero@lavin.com.mx</a>
            <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 221 y 112</a>
          </div>
          <div class="contact-card">
            <h3>Capacitación y Sistegrama</h3>
            <a href="mailto:ljuarez@lavin.com.mx">ljuarez@lavin.com.mx</a>
            <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 117</a>
          </div>
          <div class="contact-card">
            <h3>Administración de personal</h3>
            <a href="mailto:sperez@lavin.com.mx">sperez@lavin.com.mx</a>
            <a href="mailto:ycalderon@lavin.com.mx">ycalderon@lavin.com.mx</a>
            <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 281 y 136</a>
          </div>
        </div>
      </section>
    </div>

    <AppModal v-if="examenModal" @close="examenModal = null">
      <h2>{{ examenModal.titulo }}</h2>
      <p style="color:var(--text-muted)">{{ examenModal.descripcion }} · Mínimo: {{ examenModal.calificacionMinima }}%</p>
      <form @submit.prevent="submitExamen">
        <div v-for="(p, i) in examenModal.preguntas" :key="p.id" class="form-group" style="margin-top:16px">
          <div style="font-weight:600; margin-bottom:8px">{{ i + 1 }}. {{ p.texto }}</div>
          <label v-for="o in p.opciones" :key="o.id" style="display:flex; gap:8px; padding:8px; cursor:pointer;">
            <input v-model="respuestas[p.id]" type="radio" :value="o.id" required>
            <span>{{ o.texto }}</span>
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="examenModal = null">Cancelar</button>
          <button type="submit" class="btn">Enviar examen</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-if="dudaModal" @close="dudaModal = null">
      <h2>¿Tienes dudas?</h2>
      <p style="color:var(--text-muted); margin-bottom:16px;">Módulo: {{ dudaModal.nombre }}</p>
      <form @submit.prevent="enviarDuda">
        <div class="form-group">
          <label>Escribe tu pregunta o duda</label>
          <textarea v-model="dudaTexto" required rows="4" placeholder="Describe tu duda aquí..."></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="dudaModal = null">Cancelar</button>
          <button type="submit" class="btn">Enviar</button>
        </div>
      </form>
    </AppModal>
  </template>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../api';
import InduccionCourse from '../../components/InduccionCourse.vue';
import AppModal from '../../components/AppModal.vue';
import { PlayCircle, CircleCheck, Factory, Monitor, Building2, Briefcase, Layers, CircleHelp, ChevronRight, Play } from '@lucide/vue';

const portadaUrl = '/assets/lavin-portada.jpg';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(true);
const modulos = ref([]);
const progreso = ref([]);
const courseRef = ref(null);
const activeModuloId = ref(null);
const examenModal = ref(null);
const intentoId = ref(null);
const respuestas = ref({});
const dudaModal = ref(null);
const dudaTexto = ref('');
const solicitudes = ref([]);
const solicitando = ref(null);

const alcance = computed(() => route.params.alcance || 'empresa');

const showAlcanceSelector = computed(() => {
  const u = auth.user;
  return u?.programa === 'administrativo' && u?.induccionEmpresaHabilitada && u?.induccionPuestoHabilitada;
});

const heroBadge = computed(() => {
  const programa = auth.user?.programa === 'administrativo' ? 'Administrativo' : 'Operativo';
  const scope = alcance.value === 'empresa' ? 'Inducción a la empresa' : 'Inducción al puesto';
  return `${programa} · ${scope} · Colaborador`;
});

const heroTitle = computed(() => 'Bienvenido/a a Industrias Lavin');

const heroDesc = computed(() =>
  alcance.value === 'empresa'
    ? 'Conoce la cultura corporativa, normas, beneficios y todo lo que necesitas para integrarte a la empresa.'
    : 'Integración a tu área, funciones específicas y herramientas del puesto.'
);

const modulosCompletados = computed(() =>
  modulos.value.filter((m) =>
    progreso.value.some((p) => p.moduloId === m.id && p.tipo === 'modulo_completado' && p.completado)
  ).length
);

const pct = computed(() =>
  modulos.value.length ? Math.round((modulosCompletados.value / modulos.value.length) * 100) : 0
);

const progressNote = computed(() =>
  modulosCompletados.value === modulos.value.length && modulos.value.length
    ? 'Completaste todos los módulos'
    : `${modulosCompletados.value} de ${modulos.value.length} módulos completados`
);

const induccionCompleta = computed(() =>
  modulos.value.length > 0 && modulosCompletados.value === modulos.value.length
);

function solicitudEstado(tipo) {
  const list = solicitudes.value.filter((n) => n.tipo === tipo);
  const pendiente = list.find((n) => n.estado === 'pendiente');
  if (pendiente) return 'pendiente';
  if (list.length) return list[0].estado;
  return null;
}

function labelSolicitud(tipo) {
  const estado = solicitudEstado(tipo);
  if (estado === 'pendiente') return 'Solicitud enviada · RR.HH. fue notificado';
  if (estado === 'atendida') return 'Atendida por RR.HH.';
  return 'Haz clic para notificar a RR.HH.';
}

async function fetchInduccionData() {
  const [m, p, s] = await Promise.all([
    api.get(`/api/modulos?alcance=${alcance.value}`),
    api.get('/api/progreso'),
    api.get('/api/notificaciones/mias').catch(() => []),
  ]);
  modulos.value = m;
  progreso.value = p;
  solicitudes.value = s;
}

async function loadData() {
  loading.value = true;
  try {
    await fetchInduccionData();
  } finally {
    loading.value = false;
  }
}

async function refreshProgreso() {
  try {
    await fetchInduccionData();
  } catch (e) {
    console.error(e);
  }
}

async function solicitarPaso(tipo) {
  solicitando.value = tipo;
  try {
    const r = await api.post('/api/notificaciones/solicitar', { tipo });
    if (r.notificacion) {
      const idx = solicitudes.value.findIndex((n) => n.tipo === tipo);
      if (idx >= 0) solicitudes.value[idx] = r.notificacion;
      else solicitudes.value.unshift(r.notificacion);
    }
    alert(r.yaEnviada
      ? 'RR.HH. ya recibió tu solicitud. Te contactarán pronto.'
      : 'Solicitud enviada. RR.HH. fue notificado y te contactará para coordinar.');
  } catch (e) {
    alert(e.message || 'No se pudo enviar la solicitud.');
  } finally {
    solicitando.value = null;
  }
}

function scrollToModulos() {
  document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function selectAlcance(nuevoAlcance) {
  if (alcance.value !== nuevoAlcance) {
    await router.push({ name: 'empleado-induccion', params: { alcance: nuevoAlcance } });
    await nextTick();
  }
  scrollToModulos();
}

function scrollToModulosHelp() {
  if (showAlcanceSelector.value) {
    scrollToModulos();
    return;
  }
  document.getElementById('modulos-ayuda')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function scrollToContacto() {
  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function abrirDuda(modulo) {
  dudaModal.value = modulo;
  dudaTexto.value = '';
}

async function enviarDuda() {
  await api.post('/api/dudas', { moduloId: dudaModal.value.id, texto: dudaTexto.value });
  dudaModal.value = null;
  alert('Tu duda ha sido enviada. RR.HH. te contactará.');
}

async function openExamen(moduloId) {
  const examen = await api.get(`/api/examenes/${moduloId}`);
  if (examen.yaAprobado) { alert('Ya aprobaste este examen.'); return; }
  if (examen.intentosRestantes <= 0) { alert('Se agotaron los intentos. Contacta a RR.HH.'); return; }
  const intento = await api.post(`/api/examenes/${examen.id}/iniciar`, {});
  intentoId.value = intento.intentoId;
  respuestas.value = {};
  examenModal.value = examen;
}

async function submitExamen() {
  const r = await api.post(`/api/examenes/${examenModal.value.id}/enviar`, {
    intentoId: intentoId.value,
    respuestas: respuestas.value,
  });
  examenModal.value = null;
  alert(`Resultado: ${r.correctas}/${r.total} (${r.calificacion}%) — ${r.aprobado ? 'APROBADO' : 'No aprobado'}`);
  await loadData();
}

watch(alcance, () => loadData());
onMounted(loadData);
</script>

<style scoped>
/* Hero banner */
.inicio-section {
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}

.hero-banner {
  scroll-margin-top: 4rem;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(15, 39, 68, 0.22);
  position: relative;
  min-height: clamp(420px, 42vw, 520px);
}

.hero-banner__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 68%;
}

.hero-banner__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(15, 39, 68, 0.92) 0%,
    rgba(30, 58, 95, 0.78) 38%,
    rgba(30, 58, 95, 0.35) 62%,
    rgba(15, 39, 68, 0.15) 100%
  );
}

.hero-banner__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: clamp(420px, 42vw, 520px);
  padding: 2.5rem;
}

.hero-banner__content {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-banner__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  padding: 0.4rem 0.875rem;
  margin-bottom: 1.25rem;
  background: rgba(15, 39, 68, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
}

.hero-banner__content h1 {
  margin: 0 0 0.875rem;
  font-size: clamp(1.875rem, 4.5vw, 2.625rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #fff;
  max-width: 520px;
}

.hero-banner__content p {
  margin: 0 0 1.75rem;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
  max-width: 480px;
}

.hero-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  border: none;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}

.hero-btn--primary {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.45);
}

.hero-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
}

.hero-btn--ghost {
  background: transparent;
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
}

.hero-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Route picker */
.route-picker {
  margin-top: 1.5rem;
  padding-bottom: 0.25rem;
}

.route-picker__head {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(30, 58, 95, 0.1);
  color: var(--blue-700);
}

.route-picker__head h2 {
  margin: 0 0 0.15rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--blue-900);
}

.route-picker__head p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--slate-500);
}

.route-picker__grid {
  display: grid;
  grid-template-columns: 1fr 1fr minmax(180px, 0.7fr);
  gap: 0.75rem;
  align-items: stretch;
}

.route-card {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 0.875rem;
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 10px;
  box-shadow: var(--shadow-card);
  text-decoration: none;
  text-align: left;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  border-left-width: 3px;
}

.route-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.route-card--empresa {
  border-left-color: var(--blue-600);
}

.route-card--puesto {
  border-left-color: #16a34a;
}

.route-card.is-active {
  border-color: var(--blue-300, #93c5fd);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.route-card--puesto.is-active {
  border-color: #86efac;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.12);
}

.route-card__icon {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.route-card--empresa .route-card__icon {
  background: var(--blue-50);
  color: var(--blue-600);
}

.route-card--puesto .route-card__icon {
  background: #ecfdf5;
  color: #16a34a;
}

.route-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.route-card__body strong {
  font-size: 0.8125rem;
  color: var(--blue-900);
}

.route-card__body span {
  font-size: 0.75rem;
  color: var(--slate-500);
  line-height: 1.4;
}

.route-card__arrow {
  flex-shrink: 0;
  color: var(--slate-400);
}

.route-help {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.75rem 0.875rem;
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 10px;
  box-shadow: var(--shadow-card);
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.route-help:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.route-help__icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--blue-50);
  color: var(--blue-600);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.15rem;
}

.route-help strong {
  font-size: 0.8125rem;
  color: var(--blue-900);
}

.route-help p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--slate-500);
  line-height: 1.4;
}

.route-help__link {
  margin-top: 0.2rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--blue-600);
}

.induccion-course-section {
  padding-top: 2rem;
}

.modules-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.modules-section-header__text {
  flex: 1;
  min-width: 260px;
}

.modules-help-card {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  max-width: 320px;
  padding: 1rem 1.125rem;
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}

.modules-help-card__icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: var(--blue-50);
  color: var(--blue-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modules-help-card strong {
  display: block;
  font-size: 0.875rem;
  color: var(--blue-900);
  margin-bottom: 0.25rem;
}

.modules-help-card p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--slate-500);
  line-height: 1.45;
}

@media (max-width: 720px) {
  .modules-help-card {
    max-width: none;
    width: 100%;
  }
}

.post-induccion {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ecfdf5 0%, var(--white) 55%);
  border: 1px solid rgba(22, 163, 74, 0.15);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.post-induccion__header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  color: #15803d;
}

.post-induccion__header h3 {
  margin: 0 0 0.35rem;
  font-size: 1.125rem;
  color: var(--blue-900);
}

.post-induccion__header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--slate-500);
  line-height: 1.5;
}

.post-induccion__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.post-induccion__btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.125rem;
  border: 1.5px solid rgba(30, 58, 95, 0.1);
  border-radius: 12px;
  background: var(--white);
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.post-induccion__btn:hover:not(:disabled) {
  border-color: var(--blue-300);
  box-shadow: var(--shadow-card);
  transform: translateY(-1px);
}

.post-induccion__btn:disabled {
  cursor: default;
}

.post-induccion__btn.is-sent {
  border-color: rgba(37, 99, 235, 0.25);
  background: var(--blue-50);
}

.post-induccion__btn.is-done {
  border-color: rgba(22, 163, 74, 0.25);
  background: #f0fdf4;
}

.post-induccion__btn-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  background: var(--blue-50);
  color: var(--blue-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-induccion__btn.is-done .post-induccion__btn-icon {
  background: #dcfce7;
  color: #15803d;
}

.post-induccion__btn-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.post-induccion__btn-text strong {
  font-size: 0.9375rem;
  color: var(--blue-900);
}

.post-induccion__btn-text span {
  font-size: 0.8125rem;
  color: var(--slate-500);
  line-height: 1.4;
}

@media (max-width: 640px) {
  .post-induccion__actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .hero-banner,
  .hero-banner__inner {
    min-height: 380px;
  }

  .hero-banner__photo {
    object-position: center 62%;
  }

  .hero-banner__inner {
    padding: 2rem 1.5rem;
  }

  .hero-banner__overlay {
    background: linear-gradient(
      180deg,
      rgba(15, 39, 68, 0.9) 0%,
      rgba(30, 58, 95, 0.75) 55%,
      rgba(15, 39, 68, 0.45) 100%
    );
  }

  .route-picker__grid {
    grid-template-columns: 1fr;
  }
}
</style>
