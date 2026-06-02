<template>
  <AppModal v-if="modulo" wide exam @close="$emit('close')">
    <div class="modal-exam">
      <header class="modal-exam__head">
        <h2>{{ headerTitle }}</h2>
        <nav v-if="mode === 'edit'" class="modal-exam__tabs" aria-label="Secciones del examen">
          <button
            type="button"
            class="modal-exam__tab"
            :class="{ 'is-active': editTab === 'preguntas' }"
            @click="editTab = 'preguntas'"
          >
            Preguntas
          </button>
          <button
            type="button"
            class="modal-exam__tab"
            :class="{ 'is-active': editTab === 'config' }"
            @click="editTab = 'config'"
          >
            Configuración
          </button>
        </nav>
        <p v-if="mode === 'edit' && editTab === 'preguntas'" class="examen-form__meta">
          {{ preguntas.length }} pregunta(s) · Mínimo {{ examMeta.calificacionMinima }}% · {{ examMeta.intentosPermitidos }} intentos
        </p>
      </header>

      <div class="modal-exam__body">
        <form v-if="mode === 'create'" class="examen-setup" @submit.prevent="saveCreate">
          <div class="form-group"><label>Título</label><input v-model="exForm.titulo" required></div>
          <div class="form-group"><label>Descripción</label><textarea v-model="exForm.descripcion" rows="2"></textarea></div>
          <div class="examen-setup__grid">
            <div class="form-group">
              <label>Intentos permitidos</label>
              <input v-model.number="exForm.intentosPermitidos" type="number" min="1">
            </div>
            <div class="form-group">
              <label>Calificación mínima (%)</label>
              <input v-model.number="exForm.calificacionMinima" type="number" min="0" max="100">
            </div>
          </div>
          <footer class="modal-exam__foot modal-actions">
            <button type="button" class="btn secondary" @click="$emit('close')">Cancelar</button>
            <button type="submit" class="btn" :disabled="saving">{{ saving ? 'Creando…' : 'Crear examen' }}</button>
          </footer>
        </form>

        <form v-else-if="editTab === 'config'" class="examen-setup" @submit.prevent="saveSettings">
          <div class="form-group"><label>Título</label><input v-model="exForm.titulo" required></div>
          <div class="form-group"><label>Descripción</label><textarea v-model="exForm.descripcion" rows="2"></textarea></div>
          <div class="examen-setup__grid">
            <div class="form-group">
              <label>Intentos permitidos</label>
              <input v-model.number="exForm.intentosPermitidos" type="number" min="1">
            </div>
            <div class="form-group">
              <label>Calificación mínima (%)</label>
              <input v-model.number="exForm.calificacionMinima" type="number" min="0" max="100">
            </div>
          </div>
          <footer class="modal-exam__foot modal-actions">
            <button type="button" class="btn secondary" @click="editTab = 'preguntas'">Volver a preguntas</button>
            <button type="submit" class="btn" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar configuración' }}</button>
          </footer>
        </form>

        <template v-else>
          <ol v-if="preguntas.length" class="examen-preguntas-list">
            <li v-for="(p, i) in preguntas" :key="p.id">
              <div class="examen-preguntas-list__head">
                <strong>{{ i + 1 }}. {{ p.texto }}</strong>
                <button
                  type="button"
                  class="examen-icon-btn examen-icon-btn--danger"
                  title="Eliminar pregunta"
                  aria-label="Eliminar pregunta"
                  @click="delPreg(p.id)"
                >
                  <Trash2 :size="16" stroke-width="2" />
                </button>
              </div>
              <ul>
                <li v-for="o in p.opciones" :key="o.id" :class="{ 'is-correct': o.esCorrecta }">
                  {{ o.texto }}
                </li>
              </ul>
            </li>
          </ol>
          <p v-else class="examen-empty">Este examen aún no tiene preguntas.</p>

          <h3 class="examen-add-title">Agregar pregunta</h3>
          <form @submit.prevent="addPreg">
            <div class="form-group">
              <label>Texto de la pregunta</label>
              <textarea v-model="pregForm.texto" required rows="2"></textarea>
            </div>
            <div v-for="(o, i) in pregForm.opciones" :key="i" class="form-group">
              <label class="examen-option-label">
                <input v-model="o.esCorrecta" type="checkbox">
                Opción {{ i + 1 }} (correcta)
              </label>
              <input v-model="o.texto" :required="i < 2" placeholder="Texto de la opción">
            </div>
            <div class="modal-actions">
              <button type="button" class="btn secondary" @click="$emit('close')">Cerrar</button>
              <button type="submit" class="btn" :disabled="saving">{{ saving ? 'Guardando…' : 'Agregar pregunta' }}</button>
            </div>
          </form>
        </template>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Trash2 } from '@lucide/vue';
import { useAppAlert } from '../composables/useAppAlert';
import { useAppConfirm } from '../composables/useAppConfirm';
import { api } from '../api';
const { showAlert } = useAppAlert();
const { showConfirm } = useAppConfirm();
import AppModal from './AppModal.vue';

const props = defineProps({
  modulo: { type: Object, default: null },
});

const emit = defineEmits(['close', 'updated']);

const mode = ref('create');
const editTab = ref('preguntas');
const saving = ref(false);
const examenId = ref('');
const preguntas = ref([]);
const examMeta = ref({ calificacionMinima: 70, intentosPermitidos: 3 });
const exForm = ref({ titulo: '', descripcion: '', intentosPermitidos: 3, calificacionMinima: 70 });
const pregForm = ref(emptyPregForm());

const headerTitle = computed(() => {
  if (!props.modulo) return '';
  return mode.value === 'create'
    ? `Nuevo examen — ${props.modulo.nombreDisplay || props.modulo.nombre}`
    : `Examen — ${props.modulo.nombreDisplay || props.modulo.nombre}`;
});

function emptyPregForm() {
  return {
    texto: '',
    opciones: [
      { texto: '', esCorrecta: false },
      { texto: '', esCorrecta: false },
      { texto: '', esCorrecta: false },
      { texto: '', esCorrecta: false },
    ],
  };
}

function syncExFormFromExam(ex) {
  exForm.value = {
    titulo: ex.titulo || '',
    descripcion: ex.descripcion || '',
    intentosPermitidos: ex.intentosPermitidos ?? 3,
    calificacionMinima: ex.calificacionMinima ?? 70,
  };
  examMeta.value = {
    calificacionMinima: ex.calificacionMinima ?? 70,
    intentosPermitidos: ex.intentosPermitidos ?? 3,
  };
}

watch(
  () => props.modulo,
  async (m) => {
    if (!m) return;
    editTab.value = 'preguntas';
    if (m.examenes?.length) {
      mode.value = 'edit';
      examenId.value = m.examenes[0].id;
      syncExFormFromExam(m.examenes[0]);
      await loadPreguntas();
    } else {
      mode.value = 'create';
      examenId.value = '';
      preguntas.value = [];
      exForm.value = {
        titulo: `Examen — ${m.nombreDisplay || m.nombre}`,
        descripcion: '',
        intentosPermitidos: 3,
        calificacionMinima: 70,
      };
    }
    pregForm.value = emptyPregForm();
  },
  { immediate: true }
);

async function loadPreguntas() {
  if (!props.modulo) return;
  const ex = await api.get(`/api/examenes/${props.modulo.id}`);
  preguntas.value = ex.preguntas || [];
  syncExFormFromExam(ex);
}

async function saveCreate() {
  if (!props.modulo) return;
  saving.value = true;
  try {
    const ex = await api.post('/api/examenes', { ...exForm.value, moduloId: props.modulo.id });
    await api.put(`/api/modulos/${props.modulo.id}`, { requiereExamen: true });
    examenId.value = ex.id;
    mode.value = 'edit';
    editTab.value = 'preguntas';
    syncExFormFromExam(ex);
    await loadPreguntas();
    emit('updated');
  } finally {
    saving.value = false;
  }
}

async function saveSettings() {
  if (!examenId.value) return;
  saving.value = true;
  try {
    const ex = await api.put(`/api/examenes/${examenId.value}`, { ...exForm.value });
    syncExFormFromExam(ex);
    editTab.value = 'preguntas';
    emit('updated');
  } finally {
    saving.value = false;
  }
}

async function addPreg() {
  const opciones = pregForm.value.opciones
    .filter((o) => o.texto.trim())
    .map((o) => ({ texto: o.texto.trim(), esCorrecta: !!o.esCorrecta }));
  if (!opciones.some((o) => o.esCorrecta)) {
    showAlert({ title: 'Opción correcta requerida', message: 'Marca al menos una opción como correcta.', variant: 'info' });
    return;
  }
  saving.value = true;
  try {
    await api.post(`/api/examenes/${examenId.value}/preguntas`, {
      texto: pregForm.value.texto,
      opciones,
    });
    pregForm.value = emptyPregForm();
    await loadPreguntas();
    emit('updated');
  } finally {
    saving.value = false;
  }
}

async function delPreg(pid) {
  const ok = await showConfirm({ title: '¿Eliminar pregunta?', message: 'Esta acción no se puede deshacer.', variant: 'danger', confirmLabel: 'Eliminar' });
  if (!ok) return;
  await api.del(`/api/examenes/${examenId.value}/preguntas/${pid}`);
  await loadPreguntas();
  emit('updated');
}
</script>

<style scoped>
.examen-setup {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.examen-setup__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-exam__tabs {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.modal-exam__tab {
  padding: 0.4rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--slate-500);
  background: transparent;
  border: 1px solid rgba(30, 58, 95, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.modal-exam__tab:hover {
  color: var(--blue-800);
  background: var(--blue-50, #eff6ff);
}

.modal-exam__tab.is-active {
  color: var(--blue-800);
  background: var(--blue-50, #eff6ff);
  border-color: rgba(37, 99, 235, 0.35);
}

.examen-preguntas-list {
  margin: 0 0 1.25rem;
  padding: 0;
  list-style: none;
}

.examen-preguntas-list li {
  padding: 0.875rem 0;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
}

.examen-preguntas-list__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.examen-preguntas-list ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: var(--slate-600);
}

.examen-preguntas-list ul li.is-correct {
  color: #15803d;
  font-weight: 600;
}

.examen-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid rgba(30, 58, 95, 0.12);
  border-radius: 6px;
  background: var(--white);
  color: var(--blue-800);
  cursor: pointer;
  flex-shrink: 0;
}

.examen-icon-btn:hover {
  background: var(--surface-2, #f4f7fb);
}

.examen-icon-btn--danger {
  color: var(--danger);
  border-color: rgba(220, 38, 38, 0.2);
}

.examen-icon-btn--danger:hover {
  background: rgba(220, 38, 38, 0.06);
}

.examen-empty {
  margin: 0 0 1rem;
  color: var(--slate-500);
  font-size: 0.875rem;
}

.examen-add-title {
  margin: 0 0 0.75rem;
  font-size: 0.9375rem;
}

.examen-option-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  font-size: 0.8125rem;
  cursor: pointer;
}
</style>
