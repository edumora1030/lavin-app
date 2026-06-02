<template>
  <Teleport to="body">
    <Transition name="app-alert">
      <div v-if="state.visible" class="app-alert-overlay" @click.self="closeAlert">
        <div
          class="app-alert"
          :class="`app-alert--${state.variant}`"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <div class="app-alert__icon" aria-hidden="true">
            <CircleCheck v-if="state.variant === 'success'" :size="28" stroke-width="2" />
            <CircleX v-else-if="state.variant === 'error'" :size="28" stroke-width="2" />
            <CircleAlert v-else :size="28" stroke-width="2" />
          </div>

          <h2 :id="titleId" class="app-alert__title">{{ state.title }}</h2>

          <div v-if="state.score" class="app-alert__score">
            <span class="app-alert__score-value">{{ state.score.correctas }}/{{ state.score.total }}</span>
            <span class="app-alert__score-pct">{{ state.score.calificacion }}%</span>
            <span class="app-alert__score-label">
              {{ state.score.aprobado ? 'Aprobado' : 'No aprobado' }}
            </span>
          </div>

          <p v-if="state.message" class="app-alert__message">{{ state.message }}</p>

          <button type="button" class="app-alert__btn" @click="closeAlert">
            Aceptar
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { CircleAlert, CircleCheck, CircleX } from '@lucide/vue';
import { useAppAlert } from '../composables/useAppAlert';

const { state, closeAlert } = useAppAlert();
const titleId = 'app-alert-title';
</script>

<style scoped>
.app-alert-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(8, 18, 34, 0.55);
  backdrop-filter: blur(4px);
}

.app-alert {
  width: 100%;
  max-width: 380px;
  padding: 1.75rem 1.5rem 1.5rem;
  background: #fff;
  border-radius: 16px;
  text-align: center;
  box-shadow:
    0 4px 6px rgba(15, 23, 42, 0.06),
    0 24px 48px rgba(15, 23, 42, 0.18);
}

.app-alert__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: 1rem;
  border-radius: 50%;
}

.app-alert--success .app-alert__icon {
  background: #ecfdf5;
  color: #15803d;
}

.app-alert--error .app-alert__icon {
  background: #fef2f2;
  color: #dc2626;
}

.app-alert--info .app-alert__icon {
  background: var(--blue-50, #eff6ff);
  color: var(--blue-600, #2563eb);
}

.app-alert__title {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--blue-900, #0f172a);
}

.app-alert__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  margin-bottom: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
}

.app-alert--success .app-alert__score {
  background: #f0fdf4;
  border: 1px solid rgba(22, 163, 74, 0.15);
}

.app-alert--error .app-alert__score {
  background: #fef2f2;
  border: 1px solid rgba(220, 38, 38, 0.12);
}

.app-alert__score-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--blue-900, #0f172a);
}

.app-alert__score-pct {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--slate-500, #64748b);
}

.app-alert__score-label {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.app-alert--success .app-alert__score-label {
  color: #15803d;
}

.app-alert--error .app-alert__score-label {
  color: #dc2626;
}

.app-alert__message {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--slate-500, #64748b);
}

.app-alert__btn {
  width: 100%;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  color: #fff;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.app-alert--success .app-alert__btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.app-alert--error .app-alert__btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.app-alert--info .app-alert__btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.app-alert__btn:hover {
  opacity: 0.92;
}

.app-alert__btn:active {
  transform: scale(0.98);
}

.app-alert-enter-active,
.app-alert-leave-active {
  transition: opacity 0.2s ease;
}

.app-alert-enter-active .app-alert,
.app-alert-leave-active .app-alert {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.app-alert-enter-from,
.app-alert-leave-to {
  opacity: 0;
}

.app-alert-enter-from .app-alert,
.app-alert-leave-to .app-alert {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
</style>
