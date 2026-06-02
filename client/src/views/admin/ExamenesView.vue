<template>
  <div>
    <h1>Exámenes</h1>
    <div v-for="m in modulos" :key="m.id" class="card">
      <h2>{{ m.nombre }}</h2>
      <template v-if="m.examenes?.length">
        <p>Examen configurado.</p>
        <button class="btn secondary" @click="editar(m)">Editar preguntas</button>
      </template>
      <button v-else class="btn" @click="crear(m)">+ Crear examen</button>
    </div>

    <AppModal v-if="modal" @close="modal = null">
      <h2>{{ modalTitle }}</h2>
      <form v-if="mode === 'create'" @submit.prevent="saveCreate">
        <div class="form-group"><label>Título</label><input v-model="exForm.titulo" required></div>
        <div class="form-group"><label>Descripción</label><textarea v-model="exForm.descripcion" rows="2"></textarea></div>
        <div class="form-group"><label>Intentos</label><input v-model.number="exForm.intentosPermitidos" type="number"></div>
        <div class="form-group"><label>Mínimo %</label><input v-model.number="exForm.calificacionMinima" type="number"></div>
        <button type="submit" class="btn">Crear</button>
      </form>
      <template v-else>
        <ol>
          <li v-for="p in preguntas" :key="p.id" style="margin-bottom:12px">
            <strong>{{ p.texto }}</strong>
            <ul><li v-for="o in p.opciones" :key="o.id">{{ o.texto }}</li></ul>
            <button class="btn danger" @click="delPreg(p.id)">Eliminar</button>
          </li>
        </ol>
        <h3>Agregar pregunta</h3>
        <form @submit.prevent="addPreg">
          <div class="form-group"><label>Pregunta</label><textarea v-model="pregForm.texto" required rows="2"></textarea></div>
          <div v-for="(o, i) in pregForm.opciones" :key="i" class="form-group">
            <label>Opción {{ i + 1 }} <input v-model="o.esCorrecta" type="checkbox"> correcta</label>
            <input v-model="o.texto" :required="i < 2">
          </div>
          <button type="submit" class="btn">Agregar</button>
        </form>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAppAlert } from '../../composables/useAppAlert';
import { useAppConfirm } from '../../composables/useAppConfirm';
import { api } from '../../api';
const { showAlert } = useAppAlert();
const { showConfirm } = useAppConfirm();
import AppModal from '../../components/AppModal.vue';

const modulos = ref([]);
const modal = ref(null);
const mode = ref('create');
const modalTitle = ref('');
const exForm = ref({ titulo: '', descripcion: '', intentosPermitidos: 3, calificacionMinima: 70 });
const examenId = ref('');
const moduloId = ref('');
const preguntas = ref([]);
const pregForm = ref({
  texto: '',
  opciones: [
    { texto: '', esCorrecta: false },
    { texto: '', esCorrecta: false },
    { texto: '', esCorrecta: false },
    { texto: '', esCorrecta: false },
  ],
});

onMounted(async () => {
  modulos.value = await api.get('/api/modulos');
});

function crear(m) {
  mode.value = 'create';
  modalTitle.value = `Nuevo examen — ${m.nombre}`;
  moduloId.value = m.id;
  exForm.value = { titulo: `Examen — ${m.nombre}`, descripcion: '', intentosPermitidos: 3, calificacionMinima: 70 };
  modal.value = true;
}

async function saveCreate() {
  const ex = await api.post('/api/examenes', { ...exForm.value, moduloId: moduloId.value });
  await api.put(`/api/modulos/${moduloId.value}`, { requiereExamen: true });
  examenId.value = ex.id;
  await editarLoad(moduloId.value);
  mode.value = 'edit';
  modalTitle.value = 'Editor de examen';
  modulos.value = await api.get('/api/modulos');
}

async function editar(m) {
  examenId.value = m.examenes[0].id;
  moduloId.value = m.id;
  mode.value = 'edit';
  modalTitle.value = `Examen — ${m.nombre}`;
  modal.value = true;
  await editarLoad(m.id);
}

async function editarLoad(mid) {
  const ex = await api.get(`/api/examenes/${mid}`);
  preguntas.value = ex.preguntas || [];
}

async function addPreg() {
  const opciones = pregForm.value.opciones.filter((o) => o.texto).map((o) => ({
    texto: o.texto,
    esCorrecta: !!o.esCorrecta,
  }));
  if (!opciones.some((o) => o.esCorrecta)) { showAlert({ title: 'Opción correcta requerida', message: 'Marca al menos una opción como correcta.', variant: 'info' }); return; }
  await api.post(`/api/examenes/${examenId.value}/preguntas`, { texto: pregForm.value.texto, opciones });
  pregForm.value.texto = '';
  pregForm.value.opciones.forEach((o) => { o.texto = ''; o.esCorrecta = false; });
  await editarLoad(moduloId.value);
}

async function delPreg(pid) {
  const ok = await showConfirm({ title: '¿Eliminar pregunta?', message: 'Esta acción no se puede deshacer.', variant: 'danger', confirmLabel: 'Eliminar' });
  if (!ok) return;
  await api.del(`/api/examenes/${examenId.value}/preguntas/${pid}`);
  await editarLoad(moduloId.value);
}
</script>
