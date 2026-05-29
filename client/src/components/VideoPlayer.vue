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
    />
    <p v-else class="video-player__error">No se pudo cargar el video.</p>
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
import { getToken } from '../api';

const props = defineProps({
  src: { type: String, required: true },
});

defineEmits(['ended']);

const containerRef = ref(null);
const videoRef = ref(null);
const isFullscreen = ref(false);
const resolvedSrc = ref('');
const loading = ref(false);
let blobUrl = null;

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

async function loadSrc(src) {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = null;
  }
  resolvedSrc.value = '';

  if (!src) return;

  if (!src.startsWith('/api/')) {
    resolvedSrc.value = src;
    return;
  }

  loading.value = true;
  try {
    const res = await fetch(src, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Error al cargar');
    blobUrl = URL.createObjectURL(await res.blob());
    resolvedSrc.value = blobUrl;
  } catch {
    resolvedSrc.value = '';
  } finally {
    loading.value = false;
  }
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
  if (blobUrl) URL.revokeObjectURL(blobUrl);
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
