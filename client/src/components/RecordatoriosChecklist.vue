<template>
  <section class="recordatorios">
    <header class="recordatorios__head">
      <AlertCircle :size="18" stroke-width="2" />
      <div>
        <h3>Recordatorios importantes</h3>
        <p>Marca cada actividad cuando la completes. Son obligatorios para tu hoja de evidencia.</p>
      </div>
    </header>

    <ul class="recordatorios__list" role="list">
      <li
        v-for="(item, idx) in items"
        :key="item.id"
        class="recordatorios__item"
        :class="{ 'is-done': isComplete(item.id) }"
      >
        <button
          type="button"
          class="recordatorios__check"
          :class="{ 'is-checked': isComplete(item.id) }"
          :disabled="togglingId === item.id"
          :aria-pressed="isComplete(item.id)"
          :aria-label="`${isComplete(item.id) ? 'Marcar pendiente' : 'Marcar completado'}: ${item.titulo}`"
          @click="toggle(item)"
        >
          <Check v-if="isComplete(item.id)" :size="16" stroke-width="2.5" />
        </button>
        <div class="recordatorios__body">
          <span class="recordatorios__num">{{ idx + 1 }}</span>
          <div>
            <span class="recordatorios__label">{{ item.titulo }}</span>
            <span v-if="item.descripcion" class="recordatorios__desc">{{ item.descripcion }}</span>
          </div>
        </div>
      </li>
    </ul>

    <p v-if="items.length" class="recordatorios__status">
      {{ completados }} de {{ items.length }} completados
    </p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { AlertCircle, Check } from '@lucide/vue';
import { api } from '../api';

const props = defineProps({
  items: { type: Array, default: () => [] },
  progresoIds: { type: Array, default: () => [] },
  completados: { type: Number, default: 0 },
});

const emit = defineEmits(['refresh']);

const localProgresoIds = ref([...props.progresoIds]);
const togglingId = ref(null);

watch(
  () => props.progresoIds,
  (ids) => { localProgresoIds.value = [...ids]; },
  { deep: true },
);

function isComplete(itemId) {
  return localProgresoIds.value.includes(itemId);
}

async function toggle(item) {
  const next = !isComplete(item.id);
  togglingId.value = item.id;
  try {
    await api.post('/api/checklist-recordatorios/toggle', {
      itemId: item.id,
      completado: next,
    });
    if (next) {
      localProgresoIds.value = [...localProgresoIds.value, item.id];
    } else {
      localProgresoIds.value = localProgresoIds.value.filter((id) => id !== item.id);
    }
    emit('refresh');
  } finally {
    togglingId.value = null;
  }
}
</script>

<style scoped>
.recordatorios {
  margin-bottom: 1.25rem;
  padding: 1rem 1.125rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 4px solid #f59e0b;
}

.recordatorios__head {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
  color: #92400e;
}

.recordatorios__head h3 {
  margin: 0 0 0.2rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #78350f;
}

.recordatorios__head p {
  margin: 0;
  font-size: 0.8125rem;
  color: #a16207;
  line-height: 1.4;
}

.recordatorios__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recordatorios__item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  background: #fff;
  border: 1px solid #fde68a;
}

.recordatorios__item.is-done {
  background: #fefce8;
  border-color: #86efac;
}

.recordatorios__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: 2px solid #d97706;
  border-radius: 6px;
  background: #fff;
  color: transparent;
  cursor: pointer;
}

.recordatorios__check.is-checked {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

.recordatorios__check:disabled {
  opacity: 0.6;
  cursor: wait;
}

.recordatorios__body {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
}

.recordatorios__num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.recordatorios__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.35;
}

.recordatorios__desc {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.35;
}

.recordatorios__item.is-done .recordatorios__label {
  color: #166534;
}

.recordatorios__status {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #92400e;
}
</style>
