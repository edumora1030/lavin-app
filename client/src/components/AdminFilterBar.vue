<template>
  <div class="admin-filters" role="group" :aria-label="ariaLabel">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="admin-filter-btn"
      :class="{ 'is-active': modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
      <span v-if="opt.count != null" class="admin-filter-btn__count">{{ opt.count }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: 'Filtros' },
});

defineEmits(['update:modelValue']);
</script>
