<template>
  <component :is="iconComponent" :size="size" :stroke-width="strokeWidth" aria-hidden="true" />
</template>

<script setup>
import { computed } from 'vue';
import { getIconComponent } from '../constants/icons';

const props = defineProps({
  name: { type: String, default: 'file-text' },
  size: { type: [Number, String], default: 22 },
  strokeWidth: { type: [Number, String], default: 2 },
});

const iconComponent = computed(() => getIconComponent(props.name));
</script>
