<template>
  <div class="course-shell" :class="{ 'course-shell--viewer': isSplit, 'course-shell--embedded': embedded }">
    <!-- Vista principal: progreso + lista de módulos -->
    <div v-if="embedded && !isSplit" class="course-dashboard">
      <div class="course-progress">
        <div class="course-progress__head">
          <span>Tu progreso</span>
          <strong>{{ pct }}% completado</strong>
        </div>
        <div class="course-progress__bar">
          <div class="course-progress__fill" :style="{ width: pct + '%' }" />
        </div>
        <p class="course-progress__note">{{ progressNote }}</p>
      </div>

      <div class="course-dashboard__main">
        <div class="course-dashboard__tab">
          <List :size="18" />
          Módulos en orden recomendado
        </div>

        <ul class="module-list">
            <li
              v-for="(modulo, idx) in modulos"
              :key="modulo.id"
              class="module-row"
              :class="{
                'is-done': isModuloComplete(modulo.id),
                'is-active': activeModuloId === modulo.id,
                'is-locked': !isModuloUnlocked(idx),
              }"
            >
              <span class="module-row__num">{{ idx + 1 }}</span>

              <span class="module-row__icon" aria-hidden="true">
                <component :is="getIconComponent(getModuloMeta(modulo.slug).icon)" :size="20" stroke-width="1.75" />
              </span>

              <div class="module-row__body">
                <span class="module-row__title">{{ modulo.nombre }}</span>
                <span class="module-row__meta">
                  <Clock :size="13" />
                  {{ getModuloMeta(modulo.slug).duracion }}
                </span>
              </div>

              <button
                type="button"
                class="module-row__action"
                :class="{
                  'is-done': isModuloComplete(modulo.id),
                  'is-locked': !isModuloUnlocked(idx),
                }"
                :disabled="!isModuloUnlocked(idx)"
                @click="openModulo(modulo, idx)"
              >
                <Lock v-if="!isModuloUnlocked(idx)" :size="14" />
                <Check v-else-if="isModuloComplete(modulo.id)" :size="14" stroke-width="2.5" />
                <Play v-else :size="14" fill="currentColor" />
                <span>{{ actionLabel(modulo, idx) }}</span>
              </button>
            </li>
        </ul>
      </div>
    </div>

    <!-- Vista compacta (no embedded) -->
    <template v-else-if="!embedded">
      <div class="course-progress-strip">
        <div class="course-progress-strip__info">
          <span class="course-progress-strip__label">Tu avance</span>
          <strong>{{ pct }}%</strong>
          <span class="course-progress-strip__meta">{{ progressNote }}</span>
        </div>
        <div class="course-progress-strip__bar">
          <div class="course-progress-strip__fill" :style="{ width: pct + '%' }" />
        </div>
      </div>
      <div class="module-buttons">
        <button
          v-for="(modulo, idx) in modulos"
          :key="modulo.id"
          type="button"
          class="module-btn"
          :class="{
            'is-active': activeModuloId === modulo.id,
            'is-done': isModuloComplete(modulo.id),
            'is-locked': !isModuloUnlocked(idx),
          }"
          :disabled="!isModuloUnlocked(idx)"
          @click="openModulo(modulo, idx)"
        >
          <span class="module-btn__num">{{ idx + 1 }}</span>
          <span class="module-btn__label">{{ modulo.nombre }}</span>
          <Lock v-if="!isModuloUnlocked(idx)" :size="12" />
          <Check v-else-if="isModuloComplete(modulo.id)" :size="12" stroke-width="3" />
        </button>
      </div>
    </template>

    <!-- Panel de video / encuesta -->
    <div v-if="isSplit" class="course-viewer">
      <div class="course-viewer__toolbar">
        <button type="button" class="course-viewer__back" @click="closeSplit">
          <ChevronRight :size="16" style="transform:rotate(180deg)" />
          Volver a módulos
        </button>
        <span v-if="activeModulo" class="course-viewer__step">
          Módulo {{ activeModuloIndex + 1 }} de {{ modulos.length }}
        </span>
      </div>

      <div v-if="!activeModulo" class="course-panel__empty">
        <PlayCircle :size="48" stroke-width="1.5" />
        <p>Selecciona un módulo</p>
      </div>

      <div v-else-if="activeView === 'encuesta'" class="course-panel__content">
        <header class="course-panel__header">
          <p class="course-panel__label">Evaluación</p>
          <h2>{{ activeModulo.nombre }}</h2>
          <p>{{ activeModulo.descripcion }}</p>
        </header>

        <div v-if="isModuloComplete(activeModulo.id)" class="course-panel__done">
          Encuesta completada. ¡Gracias por tu retroalimentación!
        </div>
        <form v-else class="course-panel__form" @submit.prevent="enviarEncuesta">
          <div v-for="p in encuestaPreguntas" :key="p.id" class="form-group">
            <label>{{ p.orden }}. {{ p.texto }}</label>
            <textarea v-model="encuestaRespuestas[p.id]" rows="3" required />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="encuestaEnviando">
            {{ encuestaEnviando ? 'Enviando…' : 'Enviar encuesta y finalizar módulo' }}
          </button>
        </form>
      </div>

      <div v-else class="course-panel__content">
        <header class="course-panel__header">
          <div class="course-panel__heading">
            <span class="module-row__icon module-row__icon--lg">
              <component
                :is="getIconComponent(getModuloMeta(activeModulo.slug).icon)"
                :size="22"
                stroke-width="1.75"
              />
            </span>
            <div>
              <p class="course-panel__label">Módulo {{ activeModuloIndex + 1 }}</p>
              <h2>{{ activeModulo.nombre }}</h2>
            </div>
          </div>
          <p>{{ activeModulo.descripcion }}</p>
        </header>

        <VideoPlayer
          v-if="moduloVideoSrc"
          :key="activeModulo.id + moduloVideoSrc"
          :src="moduloVideoSrc"
          @ended="onVideoEnded"
        />

        <div v-else class="course-panel__no-video">
          <PlayCircle :size="40" stroke-width="1.5" />
          <p>El video de este módulo estará disponible pronto.</p>
        </div>

        <div v-if="videoVisto || isModuloComplete(activeModulo.id)" class="course-panel__completed">
          <Check :size="16" />
          {{ isModuloComplete(activeModulo.id) ? 'Módulo completado' : 'Video completado' }}
        </div>

        <footer class="course-panel__footer">
          <button type="button" class="btn-text" @click="$emit('duda', activeModulo)">¿Tienes dudas?</button>
          <div class="course-panel__footer-actions">
            <button
              v-if="activeModulo.examenes?.length"
              type="button"
              class="btn secondary"
              @click="$emit('examen', activeModulo.id)"
            >
              Realizar examen
            </button>
            <button
              v-if="!isModuloComplete(activeModulo.id) && !moduloRequiereExamen(activeModulo)"
              type="button"
              class="btn btn-primary"
              :disabled="!canFinishModulo(activeModulo) || finalizandoModulo"
              @click="finishModulo(activeModulo)"
            >
              {{ finalizandoModulo ? 'Finalizando…' : 'Finalizar módulo' }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  Check,
  ChevronRight,
  Clock,
  List,
  Lock,
  Play,
  PlayCircle,
} from '@lucide/vue';
import { api } from '../api';
import { useAppAlert } from '../composables/useAppAlert';
import { getIconComponent } from '../constants/icons';
import { getModuloMeta } from '../constants/modulos';
import VideoPlayer from './VideoPlayer.vue';

const props = defineProps({
  modulos: { type: Array, default: () => [] },
  progreso: { type: Array, default: () => [] },
  pct: { type: Number, default: 0 },
  progressNote: { type: String, default: '' },
  embedded: { type: Boolean, default: false },
});

const emit = defineEmits(['refresh', 'examen', 'duda', 'module-change']);

const { showAlert } = useAppAlert();

const isSplit = ref(false);
const activeModuloId = ref(null);
const activeView = ref(null);

const encuestaPreguntas = ref([]);
const encuestaRespuestas = ref({});
const encuestaEnviando = ref(false);
const finalizandoModulo = ref(false);

const activeModulo = computed(() =>
  props.modulos.find((m) => m.id === activeModuloId.value) || null
);

const activeModuloIndex = computed(() =>
  props.modulos.findIndex((m) => m.id === activeModuloId.value)
);

function resolveModuloVideo(modulo) {
  if (!modulo) return { src: null, itemId: null };
  const itemWithVideo = modulo.items?.find((i) => i.videoUrl);
  if (itemWithVideo) {
    return { src: itemWithVideo.videoUrl, itemId: itemWithVideo.id };
  }
  const video = modulo.videos?.[0];
  if (video) {
    return {
      src: `/api/videos/${video.id}/stream`,
      itemId: modulo.items?.[0]?.id || null,
    };
  }
  return { src: null, itemId: modulo.items?.[0]?.id || null };
}

const moduloVideo = computed(() =>
  activeModulo.value ? resolveModuloVideo(activeModulo.value) : { src: null, itemId: null }
);

const moduloVideoSrc = computed(() => moduloVideo.value.src);

function isViewed(moduloId, itemId) {
  if (!itemId) return false;
  return props.progreso.some(
    (p) => p.moduloId === moduloId && p.itemId === itemId && p.tipo === 'item_visto' && p.completado
  );
}

function isModuloComplete(moduloId) {
  return props.progreso.some(
    (p) => p.moduloId === moduloId && p.tipo === 'modulo_completado' && p.completado
  );
}

function isModuloUnlocked(idx) {
  if (idx <= 0) return true;
  const prev = props.modulos[idx - 1];
  return prev ? isModuloComplete(prev.id) : false;
}

function getModuloIndex(moduloId) {
  return props.modulos.findIndex((m) => m.id === moduloId);
}

function actionLabel(modulo, idx) {
  if (!isModuloUnlocked(idx)) return 'Bloqueado';
  if (modulo.slug === 'evaluacion-programa') {
    return isModuloComplete(modulo.id) ? 'Completado' : 'Responder encuesta';
  }
  if (isModuloComplete(modulo.id)) return 'Completado';
  return 'Ver video';
}

const videoVisto = computed(() => {
  if (!activeModulo.value) return false;
  const { itemId } = moduloVideo.value;
  if (!itemId) return isModuloComplete(activeModulo.value.id);
  return isViewed(activeModulo.value.id, itemId);
});

function moduloRequiereExamen(modulo) {
  return !!(modulo?.requiereExamen && modulo?.examenes?.length);
}

function canFinishModulo(modulo) {
  if (modulo.slug === 'evaluacion-programa') return false;
  if (moduloRequiereExamen(modulo)) return false;
  const { src, itemId } = resolveModuloVideo(modulo);
  if (!src) return true;
  if (!itemId) return true;
  return isViewed(modulo.id, itemId);
}

function openModulo(modulo, idx = getModuloIndex(modulo.id)) {
  if (!isModuloUnlocked(idx)) return;
  activeModuloId.value = modulo.id;
  isSplit.value = true;
  emit('module-change', modulo.id);
  activeView.value = modulo.slug === 'evaluacion-programa' ? 'encuesta' : 'video';
}

function closeSplit() {
  isSplit.value = false;
  activeModuloId.value = null;
  activeView.value = null;
  emit('module-change', null);
}

async function markItemsViewed(modulo) {
  const seen = new Set();
  for (const item of modulo.items || []) {
    if (seen.has(item.id) || isViewed(modulo.id, item.id)) continue;
    seen.add(item.id);
    await api.post('/api/progreso/item', { itemId: item.id, moduloId: modulo.id });
  }

  const { itemId } = resolveModuloVideo(modulo);
  if (itemId && !seen.has(itemId) && !isViewed(modulo.id, itemId)) {
    await api.post('/api/progreso/item', { itemId, moduloId: modulo.id });
  }
}

async function markVideoViewed() {
  const m = activeModulo.value;
  if (!m) return;
  const { itemId } = resolveModuloVideo(m);
  if (!itemId || isViewed(m.id, itemId)) return;
  await api.post('/api/progreso/item', { itemId, moduloId: m.id });
  emit('refresh');
}

async function onVideoEnded() {
  const m = activeModulo.value;
  if (!m || m.slug === 'evaluacion-programa' || isModuloComplete(m.id) || moduloRequiereExamen(m)) return;
  await finishModulo(m);
}

async function finishModulo(modulo) {
  if (finalizandoModulo.value || isModuloComplete(modulo.id)) return;
  finalizandoModulo.value = true;
  try {
    await markItemsViewed(modulo);
    await api.post('/api/progreso/modulo', { moduloId: modulo.id });
    emit('refresh');
  } catch (e) {
    showAlert({
      title: 'No se pudo finalizar',
      message: e.message || 'No se pudo finalizar el módulo. Intenta de nuevo.',
      variant: 'error',
    });
  } finally {
    finalizandoModulo.value = false;
  }
}

async function enviarEncuesta() {
  if (!activeModulo.value) return;
  encuestaEnviando.value = true;
  try {
    const respArray = Object.entries(encuestaRespuestas.value).map(([preguntaId, valor]) => ({
      preguntaId,
      valor,
    }));
    await api.post('/api/encuesta/respuestas', { respuestas: respArray });
    for (const item of activeModulo.value.items || []) {
      if (!isViewed(activeModulo.value.id, item.id)) {
        await api.post('/api/progreso/item', { itemId: item.id, moduloId: activeModulo.value.id });
      }
    }
    await api.post('/api/progreso/modulo', { moduloId: activeModulo.value.id });
    encuestaRespuestas.value = {};
    emit('refresh');
  } finally {
    encuestaEnviando.value = false;
  }
}

function openModuloById(moduloId) {
  const idx = getModuloIndex(moduloId);
  const modulo = props.modulos[idx];
  if (modulo && isModuloUnlocked(idx)) openModulo(modulo, idx);
}

defineExpose({ openModuloById, isModuloUnlocked, getModuloIndex });

watch(
  () => props.modulos,
  () => {
    if (activeModuloId.value && !props.modulos.find((m) => m.id === activeModuloId.value)) {
      closeSplit();
    }
  }
);

onMounted(async () => {
  try {
    encuestaPreguntas.value = await api.get('/api/encuesta/preguntas');
  } catch {
    encuestaPreguntas.value = [];
  }
});
</script>

<style scoped>
.course-shell {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 72px);
  background: var(--surface-2, #f4f7fb);
}

.course-shell--embedded {
  min-height: auto;
  background: transparent;
}

.course-shell--embedded.course-shell--viewer {
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Dashboard layout */
.course-dashboard {
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.course-dashboard__main {
  min-width: 0;
}

.course-progress {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, transparent 100%);
}

.course-progress__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: var(--slate-600);
}

.course-progress__head strong {
  font-size: 0.8125rem;
  color: var(--blue-600);
  white-space: nowrap;
}

.course-progress__bar {
  height: 8px;
  background: var(--blue-100);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.course-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-600), var(--blue-500));
  border-radius: 999px;
  transition: width 0.35s ease;
}

.course-progress__note {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--slate-500);
}

.course-dashboard__tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--blue-800);
  border-bottom: 2px solid var(--blue-600);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.04) 0%, transparent 100%);
}

/* Module list rows */
.module-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.module-row {
  display: grid;
  grid-template-columns: 2rem 2.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(30, 58, 95, 0.06);
  transition: background 0.15s;
}

.module-row:last-child {
  border-bottom: none;
}

.module-row.is-active {
  background: rgba(37, 99, 235, 0.05);
}

.module-row.is-locked {
  opacity: 0.72;
}

.module-row.is-done .module-row__title {
  color: var(--blue-700);
}

.module-row__num {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--blue-100);
  color: var(--blue-700);
  font-size: 0.8125rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-row.is-done .module-row__num {
  background: var(--blue-600);
  color: var(--white);
}

.module-row__icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: var(--blue-50);
  color: var(--blue-600);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-row__icon--lg {
  width: 2.75rem;
  height: 2.75rem;
}

.module-row__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.module-row__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--blue-900);
  line-height: 1.35;
}

.module-row__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8125rem;
  color: var(--slate-500);
}

.module-row__action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.875rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--blue-600);
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.module-row__action:hover:not(:disabled) {
  background: var(--blue-50);
  color: var(--blue-700);
}

.module-row__action.is-done {
  color: #16a34a;
}

.module-row__action.is-done:hover:not(:disabled) {
  background: #f0fdf4;
}

.module-row__action.is-locked {
  color: var(--slate-400);
  cursor: not-allowed;
}

/* Video viewer */
.course-viewer {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.course-viewer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  background: var(--white);
}

.course-viewer__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: none;
  color: var(--blue-700);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  padding: 0.25rem 0;
}

.course-viewer__back:hover {
  color: var(--blue-900);
}

.course-viewer__step {
  font-size: 0.8125rem;
  color: var(--slate-500);
  font-weight: 500;
}

.course-panel__content {
  max-width: 920px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2rem;
  width: 100%;
}

.course-panel__heading {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.5rem;
}

.course-panel__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--blue-600);
  margin: 0 0 0.2rem;
}

.course-panel__header h2 {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--blue-900);
  line-height: 1.25;
}

.course-panel__header > p {
  margin: 0.75rem 0 0;
  color: var(--slate-500);
  line-height: 1.6;
}

.course-panel__no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  background: var(--blue-50);
  border-radius: 12px;
  color: var(--slate-500);
  text-align: center;
}

.course-panel__completed {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: #16a34a;
  font-weight: 600;
  font-size: 0.9375rem;
}

.course-panel__footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(30, 58, 95, 0.08);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.course-panel__footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.course-panel__empty {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--slate-500);
  padding: 2rem;
}

.course-panel__done {
  padding: 1.25rem;
  background: var(--blue-50);
  border-radius: 12px;
  color: var(--blue-700);
  font-weight: 600;
}

.course-panel__form .form-group {
  margin-bottom: 1.25rem;
}

.course-panel__form label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--blue-900);
}

.course-panel__form textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(30, 58, 95, 0.15);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9375rem;
  resize: vertical;
}

.course-shell :deep(.btn-primary) {
  background: linear-gradient(135deg, var(--blue-600), var(--blue-700));
  color: var(--white);
  border: none;
}

.course-shell :deep(.secondary) {
  background: var(--white);
  color: var(--blue-800);
  border: 1px solid rgba(30, 58, 95, 0.15);
}

/* Legacy compact mode */
.course-progress-strip {
  background: var(--white);
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  padding: 1rem 1.5rem;
}

.course-progress-strip__info {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.course-progress-strip__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slate-500);
  text-transform: uppercase;
}

.course-progress-strip__info strong {
  font-size: 1.25rem;
  color: var(--blue-600);
}

.course-progress-strip__meta {
  font-size: 0.875rem;
  color: var(--slate-500);
}

.course-progress-strip__bar {
  height: 6px;
  background: var(--blue-100);
  border-radius: 999px;
  overflow: hidden;
}

.course-progress-strip__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-600), var(--blue-500));
  border-radius: 999px;
}

.module-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
}

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1.5px solid rgba(30, 58, 95, 0.1);
  border-radius: 100px;
  background: var(--blue-50);
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
}

.module-btn.is-locked {
  opacity: 0.55;
  cursor: not-allowed;
}

.module-btn__num {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  background: var(--white);
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 960px) {
  .module-row {
    grid-template-columns: 2rem 2.25rem minmax(0, 1fr);
    grid-template-rows: auto auto;
  }

  .module-row__action {
    grid-column: 2 / -1;
    justify-self: start;
    margin-left: 2.75rem;
  }
}

@media (max-width: 540px) {
  .module-row {
    padding: 0.875rem 1rem;
    gap: 0.5rem;
  }

  .module-row__action span {
    display: none;
  }
}
</style>
