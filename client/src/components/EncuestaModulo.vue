<template>
  <section :id="sectionId" class="section" :class="{ 'module-complete': completada }">
    <div class="section-header">
      <p class="section-label">{{ sectionLabel }}</p>
      <h2 class="section-title">
        {{ modulo.nombre }}
        <CircleCheck v-if="completada" :size="22" stroke-width="2.5" class="section-title-check" />
      </h2>
      <p class="section-desc">{{ modulo.descripcion }}</p>
      <button type="button" class="btn-dudas" @click="$emit('duda')">¿Tienes dudas?</button>
    </div>

    <div v-if="completada" class="module-footer is-complete">
      <p class="module-done-msg">Encuesta completada. ¡Gracias por tu retroalimentación!</p>
    </div>

    <form v-else @submit.prevent="enviar">
      <div v-for="p in preguntas" :key="p.id" class="form-group" style="margin-bottom:1.5rem;">
        <label style="font-weight:600; display:block; margin-bottom:8px;">{{ p.orden }}. {{ p.texto }}</label>
        <textarea v-model="respuestas[p.id]" rows="2" required placeholder="Tu respuesta..." style="width:100%;"></textarea>
      </div>
      <button type="submit" class="btn" :disabled="enviando">{{ enviando ? 'Enviando...' : 'Enviar encuesta y finalizar módulo' }}</button>
    </form>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { CircleCheck } from '@lucide/vue';
import { api } from '../api';

const props = defineProps({
  modulo: { type: Object, required: true },
  progreso: { type: Array, default: () => [] },
  sectionLabel: { type: String, required: true },
  sectionId: { type: String, required: true },
});

const emit = defineEmits(['refresh', 'duda']);

const preguntas = ref([]);
const respuestas = ref({});
const enviando = ref(false);

const completada = computed(() =>
  props.progreso.some((p) => p.moduloId === props.modulo.id && p.tipo === 'modulo_completado' && p.completado)
);

onMounted(async () => {
  preguntas.value = await api.get('/api/encuesta/preguntas');
});

async function enviar() {
  enviando.value = true;
  try {
    const respArray = Object.entries(respuestas.value).map(([preguntaId, valor]) => ({ preguntaId, valor }));
    await api.post('/api/encuesta/respuestas', { respuestas: respArray });

    // Mark all module items as viewed, then finalize
    for (const item of props.modulo.items) {
      await api.post('/api/progreso/item', { itemId: item.id, moduloId: props.modulo.id });
    }
    await api.post('/api/progreso/modulo', { moduloId: props.modulo.id });
    emit('refresh');
  } finally {
    enviando.value = false;
  }
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
</style>
