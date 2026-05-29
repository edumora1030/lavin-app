<template>
  <section :id="sectionId" class="section" :class="{ 'module-complete': moduloCompletado }">
    <div class="section-header">
      <p class="section-label">{{ sectionLabel }}</p>
      <h2 class="section-title">
        {{ moduloTitle }}
        <CircleCheck v-if="moduloCompletado" :size="22" stroke-width="2.5" class="section-title-check" />
      </h2>
      <p class="section-desc">{{ modulo.descripcion || '' }}</p>
      <button type="button" class="btn-dudas" @click="$emit('duda')">¿Tienes dudas?</button>
    </div>

    <div v-if="isCultura" class="module-tabs">
      <a href="#cultura" class="module-tab">Etapas</a>
      <a href="#cultura-recursos" class="module-tab">Materiales</a>
    </div>

    <p class="module-progress-hint">Revisado: {{ viewed }} de {{ total }} elementos</p>

    <div class="steps-grid">
      <article
        v-for="(item, i) in pasos"
        :key="item.id"
        class="step-card module-trackable"
        :class="{ 'is-viewed': isViewed(item.id) }"
        tabindex="0"
        role="button"
        @click="markViewed(item)"
        @keydown.enter.prevent="markViewed(item)"
        @keydown.space.prevent="markViewed(item)"
      >
        <span v-if="isViewed(item.id)" class="viewed-badge" aria-label="Revisado">
          <Check :size="12" stroke-width="3" />
        </span>
        <div class="step-num">{{ String(i + 1).padStart(2, '0') }}</div>
        <h3>{{ item.titulo }}</h3>
        <p>{{ item.descripcion }}</p>
        <a v-if="item.archivoUrl" :href="item.archivoUrl" class="step-link" target="_blank" rel="noopener" @click.stop>
          Ver recurso <ChevronRight :size="14" stroke-width="2.5" class="step-link-icon" />
        </a>
        <span v-else class="step-link">
          Marcar como revisado <ChevronRight :size="14" stroke-width="2.5" class="step-link-icon" />
        </span>
        <div v-if="item.videoUrl" class="item-video" @click.stop>
          <video controls preload="metadata" :src="item.videoUrl"></video>
        </div>
      </article>
    </div>

    <div v-if="recursos.length" :id="isCultura ? 'cultura-recursos' : undefined" style="padding-top:2rem;">
      <h3 class="section-title" style="font-size:1.25rem; margin-bottom:1rem;">Materiales</h3>
      <div class="resources-grid">
        <div
          v-for="item in recursos"
          :key="item.id"
          class="resource-item module-trackable"
          :class="{ 'is-viewed': isViewed(item.id) }"
          tabindex="0"
          role="button"
          @click="markViewed(item)"
          @keydown.enter.prevent="markViewed(item)"
        >
          <span v-if="isViewed(item.id)" class="viewed-badge" aria-label="Revisado">
            <Check :size="12" stroke-width="3" />
          </span>
          <div class="resource-icon">
            <AppIcon :name="parseResource(item).icon" :size="22" />
          </div>
          <div>
            <h3>{{ item.titulo }}</h3>
            <span>{{ parseResource(item).span }}</span>
            <a v-if="item.archivoUrl" :href="item.archivoUrl" class="step-link" style="display:inline-flex;align-items:center;gap:4px;margin-top:0.35rem" target="_blank" rel="noopener" @click.stop>
              Abrir <ChevronRight :size="14" stroke-width="2.5" class="step-link-icon" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="module-footer" :class="{ 'is-complete': moduloCompletado }">
      <p class="module-view-hint">Haz clic en cada etapa y material para marcarlos como revisados. Al terminar, podrás finalizar el módulo.</p>
      <button v-if="modulo.examenes?.length" type="button" class="btn secondary" style="margin-bottom:0.5rem" @click="$emit('examen', modulo.id)">Realizar examen</button>
      <button
        type="button"
        class="btn module-finish-btn"
        :disabled="!canFinish || moduloCompletado"
        @click="finishModulo"
      >
        {{ moduloCompletado ? 'Módulo finalizado' : 'Finalizar módulo' }}
      </button>
      <p v-if="moduloCompletado" class="module-done-msg">{{ sectionLabel }} completado</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { Check, CircleCheck, ChevronRight } from '@lucide/vue';
import { api } from '../api';
import { parseResourceDesc } from '../constants/hero';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  modulo: { type: Object, required: true },
  progreso: { type: Array, default: () => [] },
  sectionLabel: { type: String, required: true },
  sectionId: { type: String, required: true },
  isCultura: { type: Boolean, default: false },
  isEncuesta: { type: Boolean, default: false },
});

const emit = defineEmits(['refresh', 'examen', 'duda']);

const idsVistos = computed(() =>
  new Set(
    props.progreso
      .filter((p) => p.moduloId === props.modulo.id && p.tipo === 'item_visto' && p.completado)
      .map((p) => p.itemId)
  )
);

const moduloCompletado = computed(() =>
  props.progreso.some((p) => p.moduloId === props.modulo.id && p.tipo === 'modulo_completado' && p.completado)
);

const pasos = computed(() => props.modulo.items.filter((i) => i.tipo === 'paso'));
const recursos = computed(() => props.modulo.items.filter((i) => i.tipo === 'recurso'));
const total = computed(() => props.modulo.items.length);
const viewed = computed(() => props.modulo.items.filter((i) => idsVistos.value.has(i.id)).length);
const canFinish = computed(() => total.value > 0 && viewed.value >= total.value);

const moduloTitle = computed(() =>
  props.modulo.nombre.replace(/^[^:]+:\s*/, '') || props.sectionLabel
);

function isViewed(id) {
  return idsVistos.value.has(id);
}

function parseResource(item) {
  return parseResourceDesc(item.descripcion);
}

async function markViewed(item) {
  if (isViewed(item.id)) return;
  await api.post('/api/progreso/item', { itemId: item.id, moduloId: props.modulo.id });
  emit('refresh');
}

async function finishModulo() {
  await api.post('/api/progreso/modulo', { moduloId: props.modulo.id });
  emit('refresh');
}
</script>

<style scoped>
.btn-dudas {
  margin-top: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: var(--warning, #f59e0b);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-dudas:hover {
  opacity: 0.85;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.section-title-check {
  color: var(--blue-600);
  flex-shrink: 0;
}

.viewed-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 22px;
  height: 22px;
  background: var(--blue-600);
  color: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-card .viewed-badge {
  top: 0.5rem;
  right: 0.5rem;
}

.step-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.step-link-icon {
  flex-shrink: 0;
}
</style>
