<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" :class="{ 'modal--wide': wide, 'modal--exam': exam, 'modal--evidencia': evidencia }">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  wide: { type: Boolean, default: false },
  exam: { type: Boolean, default: false },
  evidencia: { type: Boolean, default: false },
});

defineEmits(['close']);
</script>
