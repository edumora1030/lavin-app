import { reactive } from 'vue';

const state = reactive({
  visible: false,
  title: '',
  message: '',
  variant: 'warning', // 'warning' | 'danger' | 'info'
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  _resolve: null,
});

export function useAppConfirm() {
  function showConfirm({ title = '¿Confirmar acción?', message = '', variant = 'warning', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = {}) {
    state.title = title;
    state.message = message;
    state.variant = variant;
    state.confirmLabel = confirmLabel;
    state.cancelLabel = cancelLabel;
    state.visible = true;
    return new Promise((resolve) => {
      state._resolve = resolve;
    });
  }

  function confirm() {
    state.visible = false;
    state._resolve?.(true);
    state._resolve = null;
  }

  function cancel() {
    state.visible = false;
    state._resolve?.(false);
    state._resolve = null;
  }

  return { state, showConfirm, confirm, cancel };
}
