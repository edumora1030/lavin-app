<template>
  <div class="empleado-main">
    <section class="hero-banner" id="inicio">
      <img
        :src="portadaUrl"
        alt="Instalaciones Lavín"
        class="hero-banner__photo"
        fetchpriority="high"
        decoding="async"
      >
      <div class="hero-banner__overlay" aria-hidden="true" />
      <div class="hero-banner__content">
        <span class="hero-banner__badge">
          <Building2 :size="13" stroke-width="2" />
          {{ heroBadge }}
        </span>
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroDesc }}</p>
        <button type="button" class="hero-btn" @click="scrollToModulos">
          <span class="hero-btn__icon">
            <Play :size="15" fill="currentColor" stroke-width="0" />
          </span>
          Comenzar inducción
        </button>
      </div>
    </section>

    <section v-if="showRoutePicker" class="route-picker">
        <div class="route-picker__head">
          <Layers :size="20" stroke-width="2" />
          <div>
            <h2>Elige tu ruta de inducción</h2>
            <p>Selecciona el tipo de inducción que te corresponde.</p>
          </div>
        </div>

        <div class="route-picker__grid" :class="routeGridClass">
          <button
            v-if="canEmpresa"
            type="button"
            class="route-card route-card--empresa"
            :class="{ 'is-active': alcance === 'empresa' }"
            @click="selectAlcance('empresa')"
          >
            <span class="route-card__icon">
              <Building2 :size="16" stroke-width="1.75" />
            </span>
            <div class="route-card__body">
              <strong>Inducción a la empresa</strong>
            </div>
            <span class="route-card__arrow-btn" aria-hidden="true">
              <ChevronRight :size="16" />
            </span>
          </button>

          <button
            v-if="canPuesto"
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
            <span class="route-card__arrow-btn" aria-hidden="true">
              <ChevronRight :size="16" />
            </span>
          </button>

          <button type="button" class="route-card route-card--help" @click="scrollToContacto">
            <span class="route-card__icon">
              <CircleHelp :size="16" stroke-width="2" />
            </span>
            <div class="route-card__body">
              <strong>¿Necesitas ayuda?</strong>
            </div>
            <span class="route-card__arrow-btn" aria-hidden="true">
              <ChevronRight :size="16" />
            </span>
          </button>
        </div>
      </section>

      <section id="modulos" class="induccion-course-section">
        <div class="modules-section-header">
          <p class="section-label">Programa</p>
          <h2 class="section-title">Tus módulos de inducción</h2>
        </div>

      <div v-if="modulesLoading" class="modules-loading">
        <p>Cargando módulos…</p>
      </div>

      <InduccionCourse
        v-else
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

      <!-- ── MIS DUDAS ─────────────────────────────────── -->
      <section v-if="misDudas.length" id="mis-dudas" class="mis-dudas-block">
        <div class="mis-dudas-block__inner">
          <header class="mis-dudas-block__head">
            <CircleHelp :size="20" stroke-width="2" />
            <div>
              <h2>Mis dudas enviadas</h2>
              <p>Aquí puedes ver las respuestas de RR.HH. a tus preguntas.</p>
            </div>
          </header>
          <ul class="mis-dudas-list">
            <li v-for="d in misDudas" :key="d.id" class="mis-dudas-item" :class="{ 'is-respondida': d.estado === 'respondida' }">
              <div class="mis-dudas-item__top">
                <span class="mis-dudas-item__modulo">{{ d.modulo?.nombre }}</span>
                <span class="mis-dudas-item__badge" :class="d.estado === 'respondida' ? 'badge--ok' : 'badge--pending'">
                  {{ d.estado === 'respondida' ? 'Respondida' : 'Pendiente' }}
                </span>
              </div>
              <p class="mis-dudas-item__pregunta">{{ d.texto }}</p>
              <div v-if="d.respuesta" class="mis-dudas-item__respuesta">
                <span class="mis-dudas-item__respuesta-label">Respuesta de RR.HH.:</span>
                <p>{{ d.respuesta }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section id="contacto" class="contact-block">
        <div class="contact-block__panel">
          <header class="contact-block__header">
            <p class="contact-block__label">Contacto</p>
            <h2 class="contact-block__title">¿Necesitas ayuda?</h2>
            <p class="contact-block__desc">
              El equipo de Recursos Humanos está para apoyarte durante todo tu proceso de integración.
            </p>
          </header>

          <div class="contact-block__grid">
            <article class="contact-block__card">
              <h3>Nómina, vacaciones, contrataciones, etc.</h3>
              <div class="contact-block__links">
                <a href="mailto:dbajonero@lavin.com.mx">dbajonero@lavin.com.mx</a>
                <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 221 y 112</a>
              </div>
            </article>

            <article class="contact-block__card">
              <h3>Capacitación y Sistegrama</h3>
              <div class="contact-block__links">
                <a href="mailto:ljuarez@lavin.com.mx">ljuarez@lavin.com.mx</a>
                <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 117</a>
              </div>
            </article>

            <article class="contact-block__card">
              <h3>Administración de personal</h3>
              <div class="contact-block__links">
                <a href="mailto:sperez@lavin.com.mx">sperez@lavin.com.mx</a>
                <a href="mailto:ycalderon@lavin.com.mx">ycalderon@lavin.com.mx</a>
                <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 281 y 136</a>
              </div>
            </article>
          </div>
        </div>
      </section>
  </div>

  <AppModal v-if="examenModal" wide exam @close="examenModal = null">
      <div class="modal-exam">
        <header class="modal-exam__head">
          <h2>{{ examenModal.titulo }}</h2>
          <p class="examen-form__meta">{{ examenModal.descripcion }} · Mínimo: {{ examenModal.calificacionMinima }}%</p>
        </header>
        <form class="examen-form modal-exam__body" @submit.prevent="submitExamen">
          <div v-for="(p, i) in examenModal.preguntas" :key="p.id" class="form-group">
            <div class="examen-form__question">{{ i + 1 }}. {{ p.texto }}</div>
            <div class="examen-form__options">
              <label v-for="o in p.opciones" :key="o.id" class="examen-form__option">
                <input v-model="respuestas[p.id]" type="radio" :value="o.id" required>
                <span>{{ o.texto }}</span>
              </label>
            </div>
          </div>
          <footer class="modal-exam__foot modal-actions">
            <button type="button" class="btn secondary" @click="examenModal = null">Cancelar</button>
            <button type="submit" class="btn">Enviar examen</button>
          </footer>
        </form>
      </div>
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

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../api';
import InduccionCourse from '../../components/InduccionCourse.vue';
import AppModal from '../../components/AppModal.vue';
import { useAppAlert } from '../../composables/useAppAlert';
import { CircleCheck, Factory, Monitor, Building2, Briefcase, Layers, CircleHelp, ChevronRight, Play } from '@lucide/vue';

const { showAlert } = useAppAlert();

const portadaUrl = '/assets/lavin-portada.jpg';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const modulesLoading = ref(true);
const modulos = ref([]);
const progreso = ref([]);
const courseRef = ref(null);
const activeModuloId = ref(null);
const examenModal = ref(null);
const examenModuloId = ref(null);
const intentoId = ref(null);
const respuestas = ref({});
const dudaModal = ref(null);
const dudaTexto = ref('');
const misDudas = ref([]);

async function cargarMisDudas() {
  try {
    misDudas.value = await api.get('/api/dudas/mias');
  } catch { /* silenciar */ }
}
const solicitudes = ref([]);
const solicitando = ref(null);

const alcance = computed(() => route.params.alcance || 'empresa');

const showRoutePicker = computed(() => canEmpresa.value || canPuesto.value);

const canEmpresa = computed(() => !!auth.user?.induccionEmpresaHabilitada);

const canPuesto = computed(() =>
  auth.user?.programa === 'administrativo' && !!auth.user?.induccionPuestoHabilitada
);

const routeGridClass = computed(() => {
  const cards = (canEmpresa.value ? 1 : 0) + (canPuesto.value ? 1 : 0) + 1;
  if (cards >= 3) return 'route-picker__grid--three';
  if (cards === 2) return 'route-picker__grid--two';
  return 'route-picker__grid--one';
});

const heroBadge = computed(() => {
  const programa = auth.user?.programa === 'administrativo' ? 'Administrativo' : 'Operativo';
  const scope = alcance.value === 'empresa' ? 'Inducción a la empresa' : 'Inducción al puesto';
  return `${programa} · ${scope} · Colaborador`;
});

const heroTitle = computed(() => {
  const firstName = auth.user?.nombre?.trim().split(/\s+/)[0];
  return firstName ? `Bienvenido(a), ${firstName}` : 'Bienvenido(a) a Industrias Lavin';
});

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

async function loadData({ silent = false } = {}) {
  if (!silent) modulesLoading.value = true;
  try {
    await fetchInduccionData();
  } finally {
    modulesLoading.value = false;
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
    showAlert({
      title: r.yaEnviada ? 'Solicitud registrada' : 'Solicitud enviada',
      message: r.yaEnviada
        ? 'RR.HH. ya recibió tu solicitud. Te contactarán pronto.'
        : 'RR.HH. fue notificado y te contactará para coordinar.',
      variant: 'success',
    });
  } catch (e) {
    showAlert({
      title: 'No se pudo enviar',
      message: e.message || 'No se pudo enviar la solicitud.',
      variant: 'error',
    });
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
  await cargarMisDudas();
  showAlert({
    title: 'Duda enviada',
    message: 'Tu duda ha sido enviada. RR.HH. te contactará pronto.',
    variant: 'success',
  });
}

async function openExamen(moduloId) {
  const examen = await api.get(`/api/examenes/${moduloId}`);
  if (examen.yaAprobado) {
    showAlert({ title: 'Examen completado', message: 'Ya aprobaste este examen.', variant: 'info' });
    return;
  }
  if (examen.intentosRestantes <= 0) {
    showAlert({
      title: 'Intentos agotados',
      message: 'Se agotaron los intentos. Contacta a RR.HH.',
      variant: 'error',
    });
    return;
  }
  const intento = await api.post(`/api/examenes/${examen.id}/iniciar`, {});
  intentoId.value = intento.intentoId;
  respuestas.value = {};
  examenModuloId.value = moduloId;
  examenModal.value = examen;
}

async function submitExamen() {
  const r = await api.post(`/api/examenes/${examenModal.value.id}/enviar`, {
    intentoId: intentoId.value,
    respuestas: respuestas.value,
  });
  examenModal.value = null;
  examenModuloId.value = null;
  showAlert({
    title: r.aprobado ? '¡Examen aprobado!' : 'Examen no aprobado',
    message: r.aprobado
      ? (r.moduloCompletado ? 'Módulo finalizado. Puedes continuar con el siguiente.' : 'Puedes continuar con el siguiente módulo.')
      : 'Revisa el contenido e inténtalo de nuevo.',
    variant: r.aprobado ? 'success' : 'error',
    score: {
      correctas: r.correctas,
      total: r.total,
      calificacion: r.calificacion,
      aprobado: r.aprobado,
    },
  });
  await refreshProgreso();
}

watch(alcance, () => loadData({ silent: true }));
onMounted(() => {
  loadData();
  cargarMisDudas();
});
</script>

<style scoped>
/* ── Contenedor principal ── */
.empleado-main {
  padding-top: 1.25rem;
}

/* ── Hero banner ── */
.hero-banner {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  height: 400px;
  scroll-margin-top: 4rem;
  box-shadow:
    0 4px 6px rgba(10, 22, 40, 0.04),
    0 16px 48px rgba(10, 22, 40, 0.14);
}

.hero-banner__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 62% 78%;
}

.hero-banner__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(8, 18, 34, 0.88) 0%,
      rgba(8, 18, 34, 0.72) 28%,
      rgba(8, 18, 34, 0.38) 52%,
      rgba(8, 18, 34, 0.08) 78%,
      rgba(8, 18, 34, 0) 100%
    ),
    linear-gradient(
      180deg,
      rgba(8, 18, 34, 0.08) 0%,
      rgba(8, 18, 34, 0.24) 100%
    );
}

.hero-banner__content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2.5rem 3rem;
  max-width: 500px;
}

.hero-banner__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: fit-content;
  padding: 0.3rem 0.7rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 100px;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.hero-banner__content h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.75rem, 3.2vw, 2.375rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: #fff;
}

.hero-banner__content p {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
  max-width: 380px;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  width: fit-content;
  padding: 0.75rem 1.375rem 0.75rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  box-shadow:
    0 1px 2px rgba(37, 99, 235, 0.2),
    0 6px 20px rgba(37, 99, 235, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.hero-btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  flex-shrink: 0;
}

.hero-btn:hover {
  transform: translateY(-1px);
  box-shadow:
    0 2px 4px rgba(37, 99, 235, 0.25),
    0 10px 28px rgba(37, 99, 235, 0.4);
}

.hero-btn:active {
  transform: translateY(0);
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

.route-picker__grid--three {
  grid-template-columns: repeat(3, 1fr);
}

.route-picker__grid--two {
  grid-template-columns: repeat(2, 1fr);
}

.route-picker__grid--one {
  grid-template-columns: 1fr;
}

.route-picker__grid {
  display: grid;
  gap: 0.75rem;
  align-items: stretch;
}

.route-picker__grid .route-card {
  padding: 0.875rem 1rem;
  border-radius: 10px;
}

.route-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1rem 1rem 1.125rem;
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  text-align: left;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  border-left-width: 4px;
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

.route-picker__grid .route-card__icon {
  width: 2rem;
  height: 2rem;
}

.route-picker__grid .route-card__body strong {
  font-size: 0.8125rem;
}

.route-picker__grid .route-card__body span {
  display: none;
}

.route-card--help {
  border-left-color: var(--blue-400, #60a5fa);
}

.route-card--help .route-card__icon {
  background: var(--blue-50);
  color: var(--blue-600);
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
  font-size: 0.875rem;
  color: var(--blue-900);
}

.route-card__body span {
  font-size: 0.75rem;
  color: var(--slate-500);
  line-height: 1.45;
}

.route-card__arrow-btn {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  margin-left: auto;
  border: 1px solid rgba(30, 58, 95, 0.12);
  border-radius: 8px;
  background: var(--white);
  color: var(--slate-500);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.induccion-course-section {
  padding-top: 1.75rem;
}

.modules-loading {
  padding: 2rem 1.25rem;
  text-align: center;
  color: var(--slate-500);
  font-size: 0.9375rem;
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}

.modules-section-header {
  margin-bottom: 1.25rem;
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

/* ── Contacto ── */
/* ── Mis dudas ── */
.mis-dudas-block {
  margin-top: 1.5rem;
  scroll-margin-top: 5rem;
}

.mis-dudas-block__inner {
  background: #fff;
  border: 1px solid var(--border, rgba(30,58,95,0.1));
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(30,58,95,0.05);
}

.mis-dudas-block__head {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  color: var(--blue-600, #2563eb);
  margin-bottom: 1.25rem;
}

.mis-dudas-block__head h2 {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--blue-900, #1e3a5f);
  margin: 0 0 0.2rem;
}

.mis-dudas-block__head p {
  font-size: 0.8125rem;
  color: var(--slate-500, #64748b);
  margin: 0;
}

.mis-dudas-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.mis-dudas-item {
  border: 1px solid var(--border, rgba(30,58,95,0.1));
  border-radius: 12px;
  padding: 1rem 1.125rem;
  background: #fafbfc;
}

.mis-dudas-item.is-respondida {
  border-color: rgba(22,163,74,0.25);
  background: #f0fdf4;
}

.mis-dudas-item__top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.mis-dudas-item__modulo {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--slate-500, #64748b);
}

.mis-dudas-item__badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.badge--pending {
  background: #fff7ed;
  color: #d97706;
}

.badge--ok {
  background: #ecfdf5;
  color: #15803d;
}

.mis-dudas-item__pregunta {
  font-size: 0.9375rem;
  color: var(--blue-900, #1e3a5f);
  margin: 0 0 0.625rem;
}

.mis-dudas-item__respuesta {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-left: 3px solid #22c55e;
  border-radius: 0 8px 8px 0;
}

.mis-dudas-item__respuesta-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 0.25rem;
}

.mis-dudas-item__respuesta p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--blue-900, #1e3a5f);
}

.contact-block {
  margin-top: 1.5rem;
  scroll-margin-top: 5rem;
}

.contact-block__panel {
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 14px;
  padding: 1.125rem 1.25rem 1.25rem;
  box-shadow: var(--shadow-card);
}

.contact-block__header {
  margin-bottom: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
}

.contact-block__label {
  margin: 0 0 0.2rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--blue-600);
}

.contact-block__title {
  margin: 0 0 0.3rem;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--blue-900);
}

.contact-block__desc {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--slate-500);
}

.contact-block__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.625rem;
  align-items: stretch;
}

.contact-block__card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 7.5rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(145deg, var(--blue-800), var(--blue-900));
  color: var(--white);
  border-radius: 10px;
}

.contact-block__card h3 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.35;
}

.contact-block__links {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: auto;
}

.contact-block__links a {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--blue-100);
  text-decoration: none;
  word-break: break-word;
}

.contact-block__links a:hover {
  color: var(--white);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .contact-block__grid {
    grid-template-columns: 1fr;
  }

  .contact-block__card {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .post-induccion__actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .hero-banner {
    height: auto;
    min-height: 420px;
  }

  .hero-banner__photo {
    object-position: 58% 82%;
  }

  .hero-banner__overlay {
    background:
      linear-gradient(
        180deg,
        rgba(8, 18, 34, 0.08) 0%,
        rgba(8, 18, 34, 0.45) 42%,
        rgba(8, 18, 34, 0.92) 100%
      );
  }

  .hero-banner__content {
    justify-content: flex-end;
    padding: 2rem 1.5rem;
    max-width: none;
  }

  .route-picker__grid {
    grid-template-columns: 1fr;
  }
}
</style>
