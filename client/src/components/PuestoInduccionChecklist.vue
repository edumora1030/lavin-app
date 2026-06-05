<template>
  <div class="puesto-checklist">
    <div class="course-progress puesto-checklist__progress">
      <div class="course-progress__head">
        <span>Tu progreso</span>
        <strong>{{ pct }}% completado</strong>
      </div>
      <div class="course-progress__bar">
        <div class="course-progress__fill" :style="{ width: `${pct}%` }" />
      </div>
      <p class="course-progress__note">{{ progressNote }}</p>
    </div>

    <ul class="puesto-checklist__list" role="list">
      <li
        v-for="(item, idx) in items"
        :key="item.id"
        class="puesto-checklist__item"
        :class="{ 'is-done': isComplete(item.id) }"
      >
        <button
          type="button"
          class="puesto-checklist__check"
          :class="{ 'is-checked': isComplete(item.id) }"
          :disabled="togglingId === item.id"
          :aria-pressed="isComplete(item.id)"
          :aria-label="`${isComplete(item.id) ? 'Marcar pendiente' : 'Marcar completado'}: ${item.titulo}`"
          @click="toggle(item)"
        >
          <Check v-if="isComplete(item.id)" :size="16" stroke-width="2.5" />
        </button>
        <div class="puesto-checklist__body">
          <span class="puesto-checklist__num">{{ idx + 1 }}</span>
          <span class="puesto-checklist__label">{{ item.titulo }}</span>
        </div>
      </li>
    </ul>

    <div class="puesto-checklist__notes">
      <div class="puesto-checklist__field">
        <label for="puesto-comentarios">Comentarios</label>
        <textarea
          id="puesto-comentarios"
          v-model="comentarios"
          rows="4"
          placeholder="Anota observaciones, acuerdos o pendientes de tu integración al puesto…"
          @blur="guardarNotas"
        />
      </div>
      <div class="puesto-checklist__field">
        <label for="puesto-temas">Temas del puesto</label>
        <textarea
          id="puesto-temas"
          v-model="temasPuesto"
          rows="5"
          placeholder="Lista manuales, carpetas, procedimientos o temas adicionales de tu puesto…"
          @blur="guardarNotas"
        />
      </div>
      <p v-if="notasGuardando" class="puesto-checklist__save-hint">Guardando…</p>
      <p v-else-if="notasGuardadas" class="puesto-checklist__save-hint is-ok">Cambios guardados</p>
    </div>

    <div v-if="checklistCompleto" class="puesto-checklist__finish">
      <button
        v-if="!yaNotificado"
        type="button"
        class="btn btn-primary puesto-checklist__finish-btn"
        :disabled="finalizando"
        @click="finalizarInduccion"
      >
        {{ finalizando ? 'Enviando…' : 'Finalizar inducción' }}
      </button>
      <p v-else class="puesto-checklist__finish-done">
        <Check :size="18" stroke-width="2.5" />
        Inducción finalizada. RH fue notificado.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Check } from '@lucide/vue';
import { api } from '../api';
import { useAppAlert } from '../composables/useAppAlert';

const props = defineProps({
  items: { type: Array, default: () => [] },
  progresoIds: { type: Array, default: () => [] },
  pct: { type: Number, default: 0 },
  progressNote: { type: String, default: '' },
  comentariosInicial: { type: String, default: '' },
  temasInicial: { type: String, default: '' },
  yaNotificado: { type: Boolean, default: false },
});

const emit = defineEmits(['refresh', 'finalizada']);

const { showAlert } = useAppAlert();

const comentarios = ref(props.comentariosInicial);
const temasPuesto = ref(props.temasInicial);
const togglingId = ref(null);
const notasGuardando = ref(false);
const notasGuardadas = ref(false);
const finalizando = ref(false);
let notasTimer = null;

const checklistCompleto = computed(
  () => props.items.length > 0 && props.items.every((item) => isComplete(item.id))
);

watch(
  () => [props.comentariosInicial, props.temasInicial],
  ([c, t]) => {
    comentarios.value = c || '';
    temasPuesto.value = t || '';
  }
);

function isComplete(itemId) {
  return props.progresoIds.includes(itemId);
}

async function toggle(item) {
  togglingId.value = item.id;
  try {
    await api.post('/api/checklist-puesto/toggle', {
      itemId: item.id,
      completado: !isComplete(item.id),
    });
    emit('refresh');
  } finally {
    togglingId.value = null;
  }
}

async function finalizarInduccion() {
  finalizando.value = true;
  try {
    const r = await api.post('/api/notificaciones/solicitar', {
      tipo: 'induccion_puesto_completada',
    });
    if (r.notificacion) {
      emit('finalizada', r.notificacion);
    }
    showAlert({
      title: 'RH fue notificado',
      message: r.yaEnviada
        ? 'Recursos Humanos ya tenía registrado que terminaste tu inducción al puesto.'
        : 'Recursos Humanos recibió el aviso de que terminaste tu inducción al puesto.',
      variant: 'success',
    });
  } catch (e) {
    showAlert({
      title: 'No se pudo enviar',
      message: e.message || 'Intenta de nuevo en unos momentos.',
      variant: 'error',
    });
  } finally {
    finalizando.value = false;
  }
}

async function guardarNotas() {
  notasGuardando.value = true;
  notasGuardadas.value = false;
  clearTimeout(notasTimer);
  try {
    await api.put('/api/checklist-puesto/notas', {
      comentarios: comentarios.value,
      temasPuesto: temasPuesto.value,
    });
    notasGuardadas.value = true;
    notasTimer = setTimeout(() => { notasGuardadas.value = false; }, 2000);
  } finally {
    notasGuardando.value = false;
  }
}
</script>

<style scoped>
.puesto-checklist {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.puesto-checklist__progress {
  background: #fff;
  border: 1px solid rgba(15, 39, 68, 0.08);
  border-radius: 14px;
  padding: 1.15rem 1.25rem;
  box-shadow: 0 4px 20px rgba(15, 39, 68, 0.06);
}

.puesto-checklist__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.puesto-checklist__item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  background: #fff;
  border: 1px solid rgba(15, 39, 68, 0.08);
  border-radius: 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.puesto-checklist__item.is-done {
  border-color: rgba(22, 163, 74, 0.35);
  background: linear-gradient(90deg, #f0fdf4 0%, #fff 100%);
}

.puesto-checklist__check {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: background 0.15s, border-color 0.15s;
}

.puesto-checklist__check:hover:not(:disabled) {
  border-color: var(--blue-600, #2563eb);
}

.puesto-checklist__check.is-checked {
  background: var(--success, #16a34a);
  border-color: var(--success, #16a34a);
}

.puesto-checklist__check:disabled {
  opacity: 0.6;
  cursor: wait;
}

.puesto-checklist__body {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.puesto-checklist__num {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  background: var(--blue-50, #eff6ff);
  color: var(--blue-800, #1e3a5f);
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.puesto-checklist__label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--blue-900, #0f2744);
  line-height: 1.45;
}

.puesto-checklist__item.is-done .puesto-checklist__label {
  color: var(--slate-600, #475569);
  text-decoration: line-through;
  text-decoration-color: rgba(71, 85, 105, 0.45);
}

.puesto-checklist__notes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.puesto-checklist__field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--blue-900, #0f2744);
  margin-bottom: 0.5rem;
}

.puesto-checklist__field textarea {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(15, 39, 68, 0.12);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
}

.puesto-checklist__field textarea:focus {
  outline: none;
  border-color: var(--blue-500, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.puesto-checklist__save-hint {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.8125rem;
  color: var(--slate-500);
}

.puesto-checklist__save-hint.is-ok {
  color: var(--success, #16a34a);
}

.puesto-checklist__finish {
  padding: 1.25rem 1.35rem;
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.06) 0%, #fff 100%);
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 12px;
  text-align: center;
}

.puesto-checklist__finish-btn {
  min-width: 220px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--blue-600, #2563eb), var(--blue-700, #1d4ed8));
  color: #fff;
  cursor: pointer;
  font-family: inherit;
}

.puesto-checklist__finish-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.puesto-checklist__finish-done {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #15803d;
}

@media (max-width: 768px) {
  .puesto-checklist__notes {
    grid-template-columns: 1fr;
  }
}
</style>
