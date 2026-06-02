<template>
  <div class="evidencia-checklist">
    <table class="evidencia-checklist__table">
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th>Módulo</th>
          <th class="col-estado">Estado</th>
          <th class="col-fecha">Fecha</th>
          <th class="col-cal">Calificación</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!modulos.length">
          <td colspan="5" class="evidencia-checklist__empty">Sin módulos registrados</td>
        </tr>
        <tr v-for="(modulo, idx) in modulos" :key="modulo.id" :class="{ 'is-alt': idx % 2 === 1 }">
          <td class="col-num">{{ idx + 1 }}</td>
          <td class="col-modulo">{{ modulo.nombre }}</td>
          <td class="col-estado">
            <span class="estado-cell" :class="{ 'is-done': modulo.completado }">
              <span class="estado-cell__icon" aria-hidden="true">
                <Check v-if="modulo.completado" :size="11" stroke-width="3" />
              </span>
              {{ modulo.completado ? 'Completado' : 'Pendiente' }}
            </span>
          </td>
          <td class="col-fecha">{{ fmtFecha(modulo.fechaCompletado) }}</td>
          <td class="col-cal" :class="calClass(modulo)">{{ fmtCalificacion(modulo) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { Check } from '@lucide/vue';

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
  if (!modulo.requiereExamen) return 'N/A';
  if (modulo.calificacion != null) {
    return modulo.aprobado
      ? `${modulo.calificacion}% · Aprobado`
      : `${modulo.calificacion}% · No aprobado`;
  }
  return modulo.completado ? 'Completado' : 'Pendiente';
}

function calClass(modulo) {
  if (modulo.esEvaluacionFinal) return modulo.completado ? 'is-ok' : 'is-pending';
  if (modulo.aprobado || (!modulo.requiereExamen && modulo.completado)) return 'is-ok';
  return '';
}
</script>

<style scoped>
.evidencia-checklist {
  overflow-x: auto;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
}

.evidencia-checklist__table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 0.8125rem;
  table-layout: fixed;
}

.evidencia-checklist__table thead tr {
  background: #1e3a5f;
}

.evidencia-checklist__table th {
  padding: 0.5rem 0.65rem;
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
}

.evidencia-checklist__table td {
  padding: 0.5rem 0.65rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  vertical-align: middle;
}

.evidencia-checklist__table tbody tr:last-child td {
  border-bottom: none;
}

.evidencia-checklist__table tr.is-alt td {
  background: #f8fafc;
}

.col-num {
  width: 36px;
  text-align: center !important;
}

.col-estado {
  width: 120px;
}

.col-fecha {
  width: 100px;
  white-space: nowrap;
}

.col-cal {
  width: 130px;
}

.col-modulo {
  word-break: break-word;
}

.col-cal.is-ok {
  color: #16a34a;
  font-weight: 600;
}

.col-cal.is-pending {
  color: #b45309;
}

.estado-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.estado-cell.is-done {
  color: #16a34a;
  font-weight: 600;
}

.estado-cell__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  color: transparent;
  flex-shrink: 0;
}

.estado-cell.is-done .estado-cell__icon {
  border-color: #16a34a;
  background: #16a34a;
  color: #fff;
}

.evidencia-checklist__empty {
  text-align: center;
  color: #64748b;
  padding: 1rem !important;
}
</style>
