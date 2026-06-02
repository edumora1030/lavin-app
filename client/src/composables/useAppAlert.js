import { reactive } from 'vue';

const state = reactive({
  visible: false,
  title: '',
  message: '',
  variant: 'info',
  score: null,
});

export function useAppAlert() {
  function showAlert({ title = 'Aviso', message = '', variant = 'info', score = null }) {
    state.title = title;
    state.message = message;
    state.variant = variant;
    state.score = score;
    state.visible = true;
  }

  function closeAlert() {
    state.visible = false;
    state.score = null;
  }

  return { state, showAlert, closeAlert };
}
