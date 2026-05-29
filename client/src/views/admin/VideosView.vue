<template>
  <div class="videos-page">
    <div class="videos-header">
      <div class="videos-header__text">
        <h1>Subir video</h1>
        <p>Completa la información para subir el video al panel de inducción.</p>
      </div>
      <div class="videos-help">
        <CircleHelp :size="20" stroke-width="2" class="videos-help__icon" />
        <div>
          <strong>¿Necesitas ayuda?</strong>
          <span>Especificaciones de video recomendadas: MP4 (H.264), resolución 1080p, audio estéreo.</span>
        </div>
      </div>
    </div>

    <div class="videos-card videos-upload-card">
      <div class="videos-upload-layout">
        <ol class="videos-stepper" aria-label="Pasos para subir video">
          <li
            v-for="s in steps"
            :key="s.num"
            class="videos-step"
            :class="{
              'videos-step--active': currentStep === s.num,
              'videos-step--done': currentStep > s.num,
            }"
          >
            <span class="videos-step__num">{{ s.num }}</span>
            <div class="videos-step__text">
              <strong>{{ s.title }}</strong>
              <span>{{ s.desc }}</span>
            </div>
          </li>
        </ol>

        <form class="videos-upload-body" @submit.prevent="onContinuar">
          <div
            v-show="currentStep === 1"
            class="videos-dropzone"
            :class="{ 'videos-dropzone--drag': isDragging, 'videos-dropzone--has-file': file }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @click="fileInputRef?.click()"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              class="videos-dropzone__input"
              @change="onFile"
            >
            <CloudUpload :size="40" stroke-width="1.5" class="videos-dropzone__icon" />
            <p class="videos-dropzone__title">Arrastra y suelta tu video aquí</p>
            <p class="videos-dropzone__hint">o selecciona un archivo desde tu dispositivo</p>
            <button type="button" class="videos-btn videos-btn--primary" @click.stop="fileInputRef?.click()">
              Seleccionar archivo
            </button>
            <p class="videos-dropzone__formats">Formatos: mp4, webm, mov · Máx. 2 GB</p>
            <p v-if="file" class="videos-dropzone__selected">
              <FileVideo :size="16" stroke-width="2" />
              {{ file.name }} ({{ formatSize(file.size) }})
            </p>
          </div>

          <div v-show="currentStep >= 2" class="videos-fields">
            <div class="videos-field">
              <label for="video-titulo">Título <span class="videos-required">*</span></label>
              <input
                id="video-titulo"
                v-model="form.titulo"
                type="text"
                required
                placeholder="Ej. Historia de nuestra empresa"
              >
            </div>
            <div class="videos-field">
              <label for="video-modulo">Módulo (opcional)</label>
              <select id="video-modulo" v-model="form.moduloId">
                <option value="">— General —</option>
                <option v-for="m in modulosConfigurados" :key="m.id" :value="m.id">{{ m.nombre }}</option>
              </select>
            </div>
            <div class="videos-field">
              <label for="video-desc">Descripción</label>
              <textarea
                id="video-desc"
                v-model="form.descripcion"
                rows="3"
                maxlength="500"
                placeholder="Breve descripción del contenido del video"
              ></textarea>
              <span class="videos-char-count">{{ form.descripcion.length }}/500</span>
            </div>
          </div>

          <div v-if="currentStep === 3" class="videos-review">
            <h3>Revisión</h3>
            <dl>
              <div><dt>Archivo</dt><dd>{{ file?.name }}</dd></div>
              <div><dt>Título</dt><dd>{{ form.titulo }}</dd></div>
              <div><dt>Módulo</dt><dd>{{ moduloNombre(form.moduloId) }}</dd></div>
              <div v-if="form.descripcion"><dt>Descripción</dt><dd>{{ form.descripcion }}</dd></div>
            </dl>
          </div>

          <div v-if="uploading" class="videos-progress">
            <div class="videos-progress__bar">
              <div class="videos-progress__fill" :style="{ width: pct + '%' }"></div>
            </div>
            <p>{{ pct }}% — {{ uploadText }}</p>
          </div>

          <div class="videos-upload-actions">
            <button
              v-if="currentStep > 1 && !uploading"
              type="button"
              class="videos-btn videos-btn--ghost"
              @click="currentStep--"
            >
              <ChevronLeft :size="18" stroke-width="2" />
              Atrás
            </button>
            <button
              type="submit"
              class="videos-btn videos-btn--primary"
              :disabled="uploading || !canContinue"
            >
              {{ currentStep === 3 ? 'Subir video' : 'Continuar' }}
              <ChevronRight v-if="currentStep < 3" :size="18" stroke-width="2" />
              <CloudUpload v-else :size="18" stroke-width="2" />
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="videos-card videos-list-card">
      <div class="videos-list-header">
        <div>
          <h2>Videos cargados ({{ videos.length }})</h2>
          <p>Gestiona los videos disponibles para los módulos de inducción.</p>
        </div>
      </div>

      <div v-if="loading" class="videos-empty">Cargando videos…</div>

      <div v-else-if="!videos.length" class="videos-empty">
        <Video :size="32" stroke-width="1.5" />
        <p>No hay videos cargados todavía.</p>
      </div>

      <template v-else>
        <div class="videos-table-wrap">
          <table class="videos-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tamaño</th>
                <th>Módulo</th>
                <th>Subido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in paginatedVideos" :key="v.id">
                <td>
                  <div class="videos-title-cell">
                    <button type="button" class="videos-thumb" @click="preview = v" :aria-label="`Ver ${v.titulo}`">
                      <video
                        :src="`/api/videos/${v.id}/stream`"
                        preload="metadata"
                        muted
                        playsinline
                      ></video>
                      <span class="videos-thumb__overlay">
                        <Play :size="18" stroke-width="2.5" fill="currentColor" />
                      </span>
                      <span v-if="v.duracionSegundos" class="videos-thumb__duration">
                        {{ formatDuration(v.duracionSegundos) }}
                      </span>
                    </button>
                    <div>
                      <strong>{{ v.titulo }}</strong>
                      <span v-if="v.descripcion" class="videos-title-desc">{{ v.descripcion }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ formatSize(Number(v.tamanioBytes)) }}</td>
                <td>{{ moduloNombre(v.moduloId) }}</td>
                <td>{{ fmt(v.subidoEn) }}</td>
                <td>
                  <div class="videos-actions">
                    <button type="button" class="videos-action-btn" @click="preview = v">
                      <Eye :size="15" stroke-width="2" />
                      Ver
                    </button>
                    <button type="button" class="videos-action-btn" @click="abrirAsignar(v)">
                      <Link2 :size="15" stroke-width="2" />
                      Asignar a ítem
                    </button>
                    <button type="button" class="videos-action-btn videos-action-btn--danger" @click="eliminar(v.id)">
                      <Trash2 :size="15" stroke-width="2" />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="videos-footer">
          <span>{{ rangeText }}</span>
          <div class="videos-pagination">
            <button type="button" class="videos-page-btn" :disabled="currentPage <= 1" @click="currentPage--">
              <ChevronLeft :size="16" stroke-width="2" />
            </button>
            <button
              v-for="p in visiblePages"
              :key="p"
              type="button"
              class="videos-page-btn"
              :class="{ 'is-active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
            <button type="button" class="videos-page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
              <ChevronRight :size="16" stroke-width="2" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <AppModal v-if="preview" @close="preview = null">
      <h2>{{ preview.titulo }}</h2>
      <video controls style="width:100%; border-radius:12px;" :src="`/api/videos/${preview.id}/stream`"></video>
      <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">
        URL: <code>/api/videos/{{ preview.id }}/stream</code>
      </p>
    </AppModal>

    <AppModal v-if="assign" @close="assign = null">
      <h2>Asignar video a un ítem</h2>
      <p style="color:var(--text-muted); margin-bottom:1rem;">{{ assign.titulo }}</p>
      <div class="form-group">
        <label>Módulo</label>
        <select v-model="assignModuloId" @change="assignItemId = ''">
          <option value="">Selecciona módulo</option>
          <option v-for="m in modulosConfigurados" :key="m.id" :value="m.id">{{ m.nombre }}</option>
        </select>
      </div>
      <div v-if="assignModuloId" class="form-group">
        <label>Ítem</label>
        <select v-model="assignItemId">
          <option value="">Selecciona ítem</option>
          <option v-for="i in itemsDelModulo" :key="i.id" :value="i.id">{{ i.tipo }}: {{ i.titulo }}</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn secondary" @click="assign = null">Cancelar</button>
        <button type="button" class="btn" :disabled="!assignItemId" @click="guardarAsignacion">Guardar</button>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  CircleHelp,
  CloudUpload,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileVideo,
  Link2,
  Play,
  Trash2,
  Video,
} from '@lucide/vue';
import { api, uploadVideo } from '../../api';
import AppModal from '../../components/AppModal.vue';
import { esModuloConfigurado } from '../../constants/modulos';

const steps = [
  { num: 1, title: 'Archivo', desc: 'Sube tu video' },
  { num: 2, title: 'Información', desc: 'Completa los datos' },
  { num: 3, title: 'Revisión', desc: 'Verifica antes de publicar' },
];

const videos = ref([]);
const modulos = ref([]);
const file = ref(null);
const fileInputRef = ref(null);
const isDragging = ref(false);
const uploading = ref(false);
const loading = ref(true);
const pct = ref(0);
const uploadText = ref('');
const preview = ref(null);
const assign = ref(null);
const assignModuloId = ref('');
const assignItemId = ref('');
const currentStep = ref(1);
const currentPage = ref(1);
const pageSize = ref(10);
const form = ref({ titulo: '', descripcion: '', moduloId: '' });

const modulosConfigurados = computed(() =>
  modulos.value
    .filter(esModuloConfigurado)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
);

const itemsDelModulo = computed(() => {
  const m = modulosConfigurados.value.find((x) => x.id === assignModuloId.value);
  return m?.items || [];
});

const canContinue = computed(() => {
  if (currentStep.value === 1) return !!file.value;
  if (currentStep.value === 2) return !!form.value.titulo.trim();
  return !!file.value && !!form.value.titulo.trim();
});

const totalPages = computed(() => Math.max(1, Math.ceil(videos.value.length / pageSize.value)));
const paginatedVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return videos.value.slice(start, start + pageSize.value);
});
const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  return pages.length <= 7 ? pages : [currentPage.value];
});
const rangeText = computed(() => {
  const total = videos.value.length;
  if (!total) return 'Mostrando 0 de 0 videos';
  const start = (currentPage.value - 1) * pageSize.value + 1;
  const end = Math.min(currentPage.value * pageSize.value, total);
  return `Mostrando ${start} a ${end} de ${total} video${total === 1 ? '' : 's'}`;
});

function fmt(d) { return new Date(d).toLocaleString(); }

function moduloNombre(id) {
  if (!id) return 'General';
  return modulos.value.find((m) => m.id === id)?.nombre || '—';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(secs) {
  const s = Number(secs) || 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function setFile(f) {
  if (!f) return;
  file.value = f;
  if (!form.value.titulo) form.value.titulo = f.name.replace(/\.[^.]+$/, '');
}

function onFile(e) {
  setFile(e.target.files[0]);
}

function onDrop(e) {
  isDragging.value = false;
  setFile(e.dataTransfer.files[0]);
}

function resetUpload() {
  file.value = null;
  currentStep.value = 1;
  form.value = { titulo: '', descripcion: '', moduloId: '' };
  if (fileInputRef.value) fileInputRef.value.value = '';
}

async function onContinuar() {
  if (currentStep.value < 3) {
    currentStep.value++;
    return;
  }
  await subir();
}

async function load() {
  loading.value = true;
  try {
    [videos.value, modulos.value] = await Promise.all([
      api.get('/api/videos'),
      api.get('/api/modulos'),
    ]);
  } finally {
    loading.value = false;
  }
}

async function subir() {
  if (!file.value) return;
  const fd = new FormData();
  fd.append('archivo', file.value);
  fd.append('titulo', form.value.titulo);
  if (form.value.descripcion) fd.append('descripcion', form.value.descripcion);
  if (form.value.moduloId) fd.append('moduloId', form.value.moduloId);
  uploading.value = true;
  pct.value = 0;
  try {
    await uploadVideo(fd, (p, loaded, total) => {
      pct.value = p;
      uploadText.value = `${(loaded / 1024 / 1024).toFixed(1)} MB de ${(total / 1024 / 1024).toFixed(1)} MB`;
    });
    resetUpload();
    currentPage.value = 1;
    await load();
  } catch (e) {
    alert(e.message);
  } finally {
    uploading.value = false;
  }
}

function abrirAsignar(v) {
  assign.value = v;
  assignModuloId.value = v.moduloId || '';
  assignItemId.value = '';
}

async function eliminar(id) {
  if (!confirm('¿Eliminar video?')) return;
  await api.del(`/api/videos/${id}`);
  await load();
}

async function guardarAsignacion() {
  const streamUrl = `/api/videos/${assign.value.id}/stream`;
  await api.put(`/api/modulos/${assignModuloId.value}/items/${assignItemId.value}`, {
    videoUrl: streamUrl,
  });
  assign.value = null;
  alert('Video asignado al ítem.');
  await load();
}

onMounted(load);
</script>

<style scoped>
.videos-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.videos-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.videos-header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--blue-900);
}

.videos-header p {
  margin: 0;
  color: var(--slate-500);
  font-size: 0.9375rem;
}

.videos-help {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  max-width: 360px;
  padding: 1rem 1.125rem;
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  font-size: 0.8125rem;
  color: var(--slate-500);
  line-height: 1.45;
}

.videos-help strong {
  display: block;
  color: var(--blue-900);
  margin-bottom: 0.25rem;
}

.videos-help__icon {
  flex-shrink: 0;
  color: var(--blue-600);
  margin-top: 0.1rem;
}

.videos-card {
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.videos-upload-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 420px;
}

.videos-stepper {
  list-style: none;
  margin: 0;
  padding: 1.5rem 1.25rem;
  border-right: 1px solid rgba(30, 58, 95, 0.08);
  background: var(--blue-50);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.videos-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 10px;
  color: var(--slate-500);
}

.videos-step--active {
  background: var(--white);
  box-shadow: var(--shadow-card);
  color: var(--blue-900);
}

.videos-step--done {
  color: var(--blue-700);
}

.videos-step__num {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--white);
  border: 2px solid rgba(30, 58, 95, 0.12);
  font-size: 0.8125rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--slate-500);
}

.videos-step--active .videos-step__num {
  background: var(--blue-600);
  border-color: var(--blue-600);
  color: var(--white);
}

.videos-step--done .videos-step__num {
  background: var(--blue-100);
  border-color: var(--blue-300, #93c5fd);
  color: var(--blue-700);
}

.videos-step__text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.videos-step__text strong {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.3;
}

.videos-step__text span {
  font-size: 0.75rem;
  line-height: 1.35;
}

.videos-upload-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.videos-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 260px;
  padding: 2rem 1.5rem;
  border: 2px dashed rgba(30, 58, 95, 0.18);
  border-radius: 12px;
  background: var(--surface-2, #f4f7fb);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.videos-dropzone:hover,
.videos-dropzone--drag {
  border-color: var(--blue-400);
  background: var(--blue-50);
}

.videos-dropzone--has-file {
  border-color: var(--blue-500);
  background: var(--blue-50);
}

.videos-dropzone__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.videos-dropzone__icon {
  color: var(--blue-500);
  margin-bottom: 0.25rem;
}

.videos-dropzone__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--blue-900);
}

.videos-dropzone__hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--slate-500);
}

.videos-dropzone__formats {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--slate-500);
}

.videos-dropzone__selected {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  padding: 0.5rem 0.875rem;
  background: var(--white);
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 8px;
  font-size: 0.8125rem;
  color: var(--blue-800);
}

.videos-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.videos-field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--blue-900);
  margin-bottom: 0.4rem;
}

.videos-required {
  color: var(--danger);
}

.videos-field input,
.videos-field select,
.videos-field textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid rgba(30, 58, 95, 0.15);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9375rem;
  background: var(--white);
}

.videos-field textarea {
  resize: vertical;
}

.videos-char-count {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--slate-500);
  text-align: right;
}

.videos-review {
  padding: 1rem 1.25rem;
  background: var(--blue-50);
  border-radius: 10px;
  border: 1px solid rgba(30, 58, 95, 0.08);
}

.videos-review h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--blue-900);
}

.videos-review dl {
  margin: 0;
  display: grid;
  gap: 0.625rem;
}

.videos-review div {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.videos-review dt {
  font-weight: 600;
  color: var(--slate-600);
}

.videos-review dd {
  margin: 0;
  color: var(--blue-900);
}

.videos-progress__bar {
  height: 8px;
  background: var(--blue-100);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.videos-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-600), var(--blue-500));
  border-radius: 999px;
  transition: width 0.2s;
}

.videos-progress p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--slate-500);
}

.videos-upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.videos-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1.125rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.videos-btn--primary {
  background: linear-gradient(135deg, var(--blue-600), var(--blue-700));
  color: var(--white);
}

.videos-btn--primary:hover:not(:disabled) {
  box-shadow: var(--shadow-lg);
}

.videos-btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.videos-btn--ghost {
  background: var(--white);
  color: var(--blue-800);
  border: 1px solid rgba(30, 58, 95, 0.15);
}

.videos-list-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
}

.videos-list-header h2 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--blue-900);
}

.videos-list-header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--slate-500);
}

.videos-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  color: var(--slate-500);
}

.videos-table-wrap {
  overflow-x: auto;
}

.videos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.videos-table th,
.videos-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
}

.videos-table th {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--slate-500);
  background: var(--surface-2, #f4f7fb);
}

.videos-title-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.videos-thumb {
  position: relative;
  flex-shrink: 0;
  width: 88px;
  height: 52px;
  padding: 0;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #0f172a;
}

.videos-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.videos-thumb__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.35);
  color: var(--white);
}

.videos-thumb__duration {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--white);
  font-size: 0.6875rem;
}

.videos-title-desc {
  display: block;
  font-size: 0.8125rem;
  color: var(--slate-500);
  margin-top: 0.15rem;
}

.videos-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.videos-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.625rem;
  border: 1px solid rgba(30, 58, 95, 0.12);
  border-radius: 6px;
  background: var(--white);
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;
  color: var(--blue-800);
}

.videos-action-btn--danger {
  color: var(--danger);
  border-color: rgba(220, 38, 38, 0.2);
}

.videos-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-top: 1px solid rgba(30, 58, 95, 0.08);
  font-size: 0.8125rem;
  color: var(--slate-500);
}

.videos-pagination {
  display: flex;
  gap: 0.35rem;
}

.videos-page-btn {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid rgba(30, 58, 95, 0.12);
  border-radius: 6px;
  background: var(--white);
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
  color: var(--blue-800);
}

.videos-page-btn.is-active {
  background: var(--blue-600);
  border-color: var(--blue-600);
  color: var(--white);
}

.videos-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .videos-upload-layout {
    grid-template-columns: 1fr;
  }

  .videos-stepper {
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  }

  .videos-step {
    min-width: 160px;
  }
}
</style>
