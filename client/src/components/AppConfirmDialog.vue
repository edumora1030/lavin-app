<template>
  <Teleport to="body">
    <Transition name="app-confirm">
      <div v-if="state.visible" class="app-confirm-overlay" @click.self="cancel">
        <div
          class="app-confirm"
          :class="`app-confirm--${state.variant}`"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="app-confirm-title"
        >
          <div class="app-confirm__icon" aria-hidden="true">
            <AlertTriangle v-if="state.variant === 'warning'" :size="26" stroke-width="2" />
            <Trash2       v-else-if="state.variant === 'danger'"  :size="26" stroke-width="2" />
            <CircleAlert  v-else                                   :size="26" stroke-width="2" />
          </div>

          <h2 id="app-confirm-title" class="app-confirm__title">{{ state.title }}</h2>
          <p v-if="state.message" class="app-confirm__message">{{ state.message }}</p>

          <div class="app-confirm__actions">
            <button type="button" class="app-confirm__btn app-confirm__btn--cancel" @click="cancel">
              {{ state.cancelLabel }}
            </button>
            <button type="button" class="app-confirm__btn app-confirm__btn--ok" @click="confirm">
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle, CircleAlert, Trash2 } from '@lucide/vue';
import { useAppConfirm } from '../composables/useAppConfirm';

const { state, confirm, cancel } = useAppConfirm();
</script>

<style scoped>
.app-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(8, 18, 34, 0.55);
  backdrop-filter: blur(4px);
}

.app-confirm {
  width: 100%;
  max-width: 360px;
  padding: 1.75rem 1.5rem 1.5rem;
  background: #fff;
  border-radius: 16px;
  text-align: center;
  box-shadow:
    0 4px 6px rgba(15, 23, 42, 0.06),
    0 24px 48px rgba(15, 23, 42, 0.18);
}

.app-confirm__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  margin-bottom: 1rem;
  border-radius: 50%;
}

.app-confirm--warning .app-confirm__icon { background: #fff7ed; color: #d97706; }
.app-confirm--danger  .app-confirm__icon { background: #fef2f2; color: #dc2626; }
.app-confirm--info    .app-confirm__icon { background: #eff6ff; color: #2563eb; }

.app-confirm__title {
  margin: 0 0 0.625rem;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.app-confirm__message {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #64748b;
}

.app-confirm__actions {
  display: flex;
  gap: 0.625rem;
}

.app-confirm__btn {
  flex: 1;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, transform 0.15s;
}

.app-confirm__btn:active { transform: scale(0.98); }

.app-confirm__btn--cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.app-confirm__btn--cancel:hover { background: #e2e8f0; }

.app-confirm--warning .app-confirm__btn--ok { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
.app-confirm--danger  .app-confirm__btn--ok { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
.app-confirm--info    .app-confirm__btn--ok { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
.app-confirm__btn--ok:hover { opacity: 0.9; }

.app-confirm-enter-active, .app-confirm-leave-active { transition: opacity 0.2s ease; }
.app-confirm-enter-active .app-confirm, .app-confirm-leave-active .app-confirm { transition: transform 0.2s ease, opacity 0.2s ease; }
.app-confirm-enter-from, .app-confirm-leave-to { opacity: 0; }
.app-confirm-enter-from .app-confirm, .app-confirm-leave-to .app-confirm { transform: scale(0.96) translateY(8px); opacity: 0; }
</style>
