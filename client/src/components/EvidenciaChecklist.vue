<template>
  <div class="evidencia-checklist">
    <table class="evidencia-checklist__table">
      <thead>
        <tr>
          <th class="col-check"></th>
          <th>Módulo</th>
          <th>Fecha</th>
          <th>Calificación</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!modulos.length">
          <td colspan="4" class="evidencia-checklist__empty">Sin módulos registrados</td>
        </tr>
        <tr v-for="modulo in modulos" :key="modulo.id" :class="{ 'is-done': modulo.completado }">
          <td class="col-check">
            <span class="check-icon" :class="{ 'is-done': modulo.completado }">
              {{ modulo.completado ? '✓' : '○' }}
            </span>
          </td>
          <td>{{ modulo.nombre }}</td>
          <td>{{ fmtFecha(modulo.fechaCompletado) }}</td>
          <td>{{ fmtCalificacion(modulo) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  modulos: { type: Array, default: () => [] },
});

function fmtFecha(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtCalificacion(modulo) {
  if (modulo.esEvaluacionFinal) {
    return modulo.completado ? 'Encuesta completada' : 'Pendiente';
  }
  if (!modulo.requiereExamen) return '—';
  if (modulo.calificacion == null) return 'Sin intento';
  const estado = modulo.aprobado ? 'Aprobado' : 'No aprobado';
  return `${modulo.calificacion}% (${estado})`;
}
</script>

<style scoped>
.evidencia-checklist {
  overflow-x: auto;
}

.evidencia-checklist__table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: fixed;
}

.evidencia-checklist__table th,
.evidencia-checklist__table td {
  padding: 0.5rem 0.65rem;
  text-align: left;
  border-bottom: 1px solid var(--slate-200, #e2e8f0);
}

.evidencia-checklist__table th {
  color: var(--slate-500);
  font-weight: 600;
  font-size: 0.8125rem;
}

.evidencia-checklist__table tr.is-done td:nth-child(2) {
  color: var(--slate-800);
}

.evidencia-checklist__table td:nth-child(2) {
  word-break: break-word;
}

.evidencia-checklist__table th:nth-child(2),
.evidencia-checklist__table td:nth-child(2) {
  width: 42%;
}

.evidencia-checklist__table th:nth-child(3),
.evidencia-checklist__table td:nth-child(3) {
  width: 18%;
  white-space: nowrap;
}

.evidencia-checklist__table th:nth-child(4),
.evidencia-checklist__table td:nth-child(4) {
  width: 28%;
}

.col-check {
  width: 36px;
  text-align: center;
}

.check-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--slate-300, #cbd5e1);
  color: var(--slate-400);
  font-size: 0.75rem;
}

.check-icon.is-done {
  border-color: var(--success);
  background: var(--success);
  color: #fff;
}

.evidencia-checklist__empty {
  text-align: center;
  color: var(--slate-500);
  padding: 1rem !important;
}
</style>
