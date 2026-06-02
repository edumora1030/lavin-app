<template>
  <div ref="containerRef" class="video-player">
    <div v-if="loading" class="video-player__loading">Cargando video…</div>
    <video
      v-else-if="resolvedSrc"
      ref="videoRef"
      class="video-player__video"
      controls
      playsinline
      preload="metadata"
      :src="resolvedSrc"
      @ended="$emit('ended')"
      @error="onVideoError"
    />
    <p v-else class="video-player__error">{{ errorMessage || 'No se pudo cargar el video.' }}</p>
    <button
      v-if="resolvedSrc && !loading"
      type="button"
      class="video-player__fullscreen"
      aria-label="Pantalla completa"
      @click="toggleFullscreen"
    >
      <Maximize2 v-if="!isFullscreen" :size="18" stroke-width="2" />
      <Minimize2 v-else :size="18" stroke-width="2" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { Maximize2, Minimize2 } from '@lucide/vue';
import { videoStreamUrl } from '../api';

const props = defineProps({
  src: { type: String, required: true },
});

defineEmits(['ended']);

const containerRef = ref(null);
const videoRef = ref(null);
const isFullscreen = ref(false);
const resolvedSrc = ref('');
const loading = ref(false);
const errorMessage = ref('');

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

function resolvePlaybackUrl(src) {
  if (!src) return '';
  if (src.startsWith('/api/videos/') && src.includes('/stream')) {
    const match = src.match(/\/api\/videos\/([^/?]+)\/stream/);
    if (match) return videoStreamUrl(match[1]);
  }
  return src;
}

function loadSrc(src) {
  errorMessage.value = '';
  if (!src) {
    resolvedSrc.value = '';
    return;
  }
  loading.value = true;
  resolvedSrc.value = resolvePlaybackUrl(src);
  loading.value = false;
}

function onVideoError() {
  errorMessage.value = 'No se pudo reproducir el video. Verifica que el archivo exista y vuelve a intentarlo.';
  resolvedSrc.value = '';
}

async function toggleFullscreen() {
  const el = containerRef.value;
  if (!el) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (el.requestFullscreen) {
    await el.requestFullscreen();
    return;
  }
  if (videoRef.value?.webkitEnterFullscreen) {
    videoRef.value.webkitEnterFullscreen();
  }
}

watch(() => props.src, (src) => loadSrc(src), { immediate: true });

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
});
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.video-player__video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  background: #000;
}

.video-player__loading,
.video-player__error {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9375rem;
  margin: 0;
  padding: 1rem;
  text-align: center;
}

.video-player__fullscreen {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.75);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.video-player__fullscreen:hover {
  background: rgba(15, 23, 42, 0.92);
}

.video-player:fullscreen,
.video-player:-webkit-full-screen {
  aspect-ratio: auto;
  border-radius: 0;
  width: 100vw;
  height: 100vh;
}

.video-player:fullscreen .video-player__video,
.video-player:-webkit-full-screen .video-player__video {
  width: 100%;
  height: 100%;
}
</style>
