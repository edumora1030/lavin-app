<template>
  <div class="evidencia-sheet">
    <header class="evidencia-sheet__header">
      <img :src="logoUrl" alt="Lavin Industrias" class="evidencia-sheet__logo">
      <div class="evidencia-sheet__header-text">
        <h1>Hoja de evidencia de inducción</h1>
        <p>Industrias Lavín · Recursos Humanos</p>
      </div>
      <button
        v-if="showDownload && evidencia.induccionCompleta"
        type="button"
        class="evidencia-sheet__download"
        :disabled="downloading"
        title="Descargar PDF"
        aria-label="Descargar PDF de evidencia"
        @click="$emit('download')"
      >
        <FileDown :size="18" stroke-width="2" />
      </button>
    </header>

    <div class="evidencia-sheet__body">
      <section class="evidencia-sheet__empleado">
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon" aria-hidden="true"><User :size="14" /></span>
          <div>
            <span class="evidencia-sheet__label">Colaborador</span>
            <strong>{{ evidencia.empleado.nombre }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon" aria-hidden="true"><IdCard :size="14" /></span>
          <div>
            <span class="evidencia-sheet__label">Nómina</span>
            <strong>{{ evidencia.empleado.nomina }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon" aria-hidden="true"><Briefcase :size="14" /></span>
          <div>
            <span class="evidencia-sheet__label">Programa</span>
            <strong>{{ fmtPrograma(evidencia.empleado.programa) }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon" aria-hidden="true"><Building2 :size="14" /></span>
          <div>
            <span class="evidencia-sheet__label">Área</span>
            <strong>{{ evidencia.empleado.area || 'Sin área asignada' }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field evidencia-sheet__field--wide">
          <span class="evidencia-sheet__field-icon" aria-hidden="true"><Calendar :size="14" /></span>
          <div>
            <span class="evidencia-sheet__label">Fecha de emisión</span>
            <strong>{{ fmtFecha(evidencia.generadoEn) }}</strong>
          </div>
        </div>
      </section>

      <div class="evidencia-sheet__stats">
        <div class="evidencia-sheet__stat evidencia-sheet__stat--green">
          <span class="evidencia-sheet__stat-icon" aria-hidden="true"><BookOpen :size="16" /></span>
          <div>
            <span class="evidencia-sheet__label">Inducción empresa</span>
            <strong>{{ evidencia.induccionEmpresa.completados }}/{{ evidencia.induccionEmpresa.total }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__stat evidencia-sheet__stat--blue">
          <span class="evidencia-sheet__stat-icon" aria-hidden="true"><User :size="16" /></span>
          <div>
            <span class="evidencia-sheet__label">Inducción puesto</span>
            <strong>
              <template v-if="evidencia.induccionPuesto.habilitada">
                {{ evidencia.induccionPuesto.completados }}/{{ evidencia.induccionPuesto.total }}
              </template>
              <template v-else>No habilitada</template>
            </strong>
          </div>
        </div>
        <div
          v-if="evidencia.evaluacionFinal"
          class="evidencia-sheet__stat evidencia-sheet__stat--green"
        >
          <span class="evidencia-sheet__stat-icon" aria-hidden="true"><CircleCheck :size="16" /></span>
          <div>
            <span class="evidencia-sheet__label">Evaluación final</span>
            <strong>{{ evidencia.evaluacionFinal.completada ? 'Completada' : 'Pendiente' }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__stat evidencia-sheet__stat--purple">
          <span class="evidencia-sheet__stat-icon" aria-hidden="true"><Award :size="16" /></span>
          <div>
            <span class="evidencia-sheet__label">Promedio exámenes</span>
            <strong>{{ evidencia.resumen.promedioExamenes != null ? evidencia.resumen.promedioExamenes + '%' : '—' }}</strong>
          </div>
        </div>
      </div>

      <section v-if="evidencia.induccionEmpresa.habilitada" class="evidencia-sheet__section">
        <div class="evidencia-sheet__section-head">
          <h2>Módulos de inducción</h2>
          <span
            class="evidencia-sheet__badge"
            :class="evidencia.induccionEmpresa.completa ? 'is-ok' : 'is-pending'"
          >
            {{ evidencia.induccionEmpresa.completados }}/{{ evidencia.induccionEmpresa.total }} módulos completados
          </span>
        </div>
        <EvidenciaChecklist :modulos="evidencia.induccionEmpresa.modulos" />
        <div
          class="evidencia-sheet__banner"
          :class="evidencia.induccionEmpresa.completa ? 'is-ok' : 'is-pending'"
        >
          <CircleCheck :size="16" stroke-width="2" />
          {{
            evidencia.induccionEmpresa.completa
              ? 'Todos los módulos de inducción a la empresa fueron completados.'
              : 'Inducción a la empresa incompleta.'
          }}
        </div>
      </section>

      <section v-if="evidencia.induccionPuesto.habilitada" class="evidencia-sheet__section">
        <div class="evidencia-sheet__section-head">
          <h2>Inducción al puesto</h2>
          <span
            class="evidencia-sheet__badge"
            :class="evidencia.induccionPuesto.completa ? 'is-ok' : 'is-pending'"
          >
            {{ evidencia.induccionPuesto.completados }}/{{ evidencia.induccionPuesto.total }} módulos completados
          </span>
        </div>
        <EvidenciaChecklist :modulos="evidencia.induccionPuesto.modulos" />
        <div
          class="evidencia-sheet__banner"
          :class="evidencia.induccionPuesto.completa ? 'is-ok' : 'is-pending'"
        >
          <CircleCheck :size="16" stroke-width="2" />
          {{
            evidencia.induccionPuesto.completa
              ? 'Todos los módulos de inducción al puesto fueron completados.'
              : 'Inducción al puesto incompleta.'
          }}
        </div>
      </section>

      <div class="evidencia-sheet__bottom">
        <section v-if="evidencia.evaluacionFinal" class="evidencia-sheet__card">
          <div
            class="evidencia-sheet__card-icon"
            :class="{ 'is-done': evidencia.evaluacionFinal.completada }"
          >
            <CircleCheck :size="22" stroke-width="2" />
          </div>
          <div>
            <h3>Evaluación final</h3>
            <strong>{{ evidencia.evaluacionFinal.nombre }}</strong>
            <p>
              Estado: {{ evidencia.evaluacionFinal.completada ? 'Completada' : 'Pendiente' }}
              <template v-if="evidencia.evaluacionFinal.fechaCompletado">
                · Fecha: {{ fmtFecha(evidencia.evaluacionFinal.fechaCompletado) }}
              </template>
            </p>
          </div>
        </section>

        <section v-if="evidencia.resumen.totalExamenes" class="evidencia-sheet__card evidencia-sheet__card--purple">
          <div class="evidencia-sheet__card-icon is-purple">
            <BarChart3 :size="22" stroke-width="2" />
          </div>
          <div>
            <h3>Resumen de exámenes</h3>
            <p>Aprobados: {{ evidencia.resumen.examenesAprobados }} de {{ evidencia.resumen.totalExamenes }}</p>
            <p>Promedio general: {{ evidencia.resumen.promedioExamenes ?? 0 }}%</p>
          </div>
        </section>
      </div>

      <section class="evidencia-sheet__firma">
        <h3>Firma de Recursos Humanos</h3>
        <div class="evidencia-sheet__firma-line"></div>
        <span>Nombre y firma</span>
        <span class="evidencia-sheet__firma-fecha">Fecha: ___ / ___ / ___</span>
      </section>
    </div>

    <footer class="evidencia-sheet__footer">
      Documento generado electrónicamente · Uso interno
    </footer>
  </div>
</template>

<script setup>
import {
  Award, BarChart3, BookOpen, Briefcase, Building2, Calendar,
  CircleCheck, FileDown, IdCard, User,
} from '@lucide/vue';
import EvidenciaChecklist from './EvidenciaChecklist.vue';

defineProps({
  evidencia: { type: Object, required: true },
  showDownload: { type: Boolean, default: true },
  downloading: { type: Boolean, default: false },
});

defineEmits(['download']);

const logoUrl = '/assets/logoempresa.png';

function fmtFecha(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtPrograma(programa) {
  if (programa === 'administrativo') return 'Administrativo';
  if (programa === 'operativo') return 'Operativo';
  return '—';
}
</script>

<style scoped>
.evidencia-sheet {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: #f1f5f9;
}

.evidencia-sheet__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  padding: 1rem 1.25rem;
  background: #0f2744;
  color: #fff;
}

.evidencia-sheet__logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.evidencia-sheet__header-text {
  flex: 1;
  min-width: 0;
}

.evidencia-sheet__header-text h1 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
}

.evidencia-sheet__header-text p {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: #93c5fd;
}

.evidencia-sheet__download {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.evidencia-sheet__download:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
}

.evidencia-sheet__download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.evidencia-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem;
}

.evidencia-sheet__empleado {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1.25rem;
  padding: 1rem 1.125rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.evidencia-sheet__field {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.evidencia-sheet__field--wide {
  grid-column: 1 / -1;
}

.evidencia-sheet__field-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  color: #2563eb;
  flex-shrink: 0;
}

.evidencia-sheet__label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.15rem;
}

.evidencia-sheet__field strong,
.evidencia-sheet__stat strong {
  font-size: 0.9375rem;
  color: #1e293b;
}

.evidencia-sheet__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.625rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 720px) {
  .evidencia-sheet__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.evidencia-sheet__stat {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0.625rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  border-left-width: 4px;
}

.evidencia-sheet__stat--green { border-left-color: #16a34a; }
.evidencia-sheet__stat--blue { border-left-color: #2563eb; }
.evidencia-sheet__stat--purple { border-left-color: #7c3aed; }

.evidencia-sheet__stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
}

.evidencia-sheet__stat--green .evidencia-sheet__stat-icon {
  background: #ecfdf5;
  color: #16a34a;
}

.evidencia-sheet__stat--blue .evidencia-sheet__stat-icon {
  background: #eff6ff;
  color: #2563eb;
}

.evidencia-sheet__stat--purple .evidencia-sheet__stat-icon {
  background: #f5f3ff;
  color: #7c3aed;
}

.evidencia-sheet__section {
  margin-bottom: 1.25rem;
}

.evidencia-sheet__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.625rem;
}

.evidencia-sheet__section-head h2 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #1e3a5f;
}

.evidencia-sheet__badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  border: 1px solid;
}

.evidencia-sheet__badge.is-ok {
  color: #16a34a;
  background: #ecfdf5;
  border-color: #86efac;
}

.evidencia-sheet__badge.is-pending {
  color: #b45309;
  background: #fff7ed;
  border-color: #fdba74;
}

.evidencia-sheet__banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.625rem;
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid;
}

.evidencia-sheet__banner.is-ok {
  color: #16a34a;
  background: #ecfdf5;
  border-color: #86efac;
}

.evidencia-sheet__banner.is-pending {
  color: #b45309;
  background: #fff7ed;
  border-color: #fdba74;
}

.evidencia-sheet__bottom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) {
  .evidencia-sheet__bottom {
    grid-template-columns: 1fr;
  }
}

.evidencia-sheet__card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
}

.evidencia-sheet__card h3 {
  margin: 0 0 0.35rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1e3a5f;
}

.evidencia-sheet__card strong {
  display: block;
  font-size: 0.875rem;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.evidencia-sheet__card p {
  margin: 0.15rem 0 0;
  font-size: 0.8125rem;
  color: #64748b;
}

.evidencia-sheet__card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  color: #94a3b8;
  flex-shrink: 0;
}

.evidencia-sheet__card-icon.is-done {
  border-color: #16a34a;
  background: #16a34a;
  color: #fff;
}

.evidencia-sheet__card-icon.is-purple {
  border-color: #c4b5fd;
  background: #f5f3ff;
  color: #7c3aed;
}

.evidencia-sheet__firma {
  text-align: center;
  padding: 0.5rem 0 0.25rem;
}

.evidencia-sheet__firma h3 {
  margin: 0 0 1.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.evidencia-sheet__firma-line {
  width: min(220px, 70%);
  height: 1px;
  background: #94a3b8;
  margin: 0 auto 0.5rem;
}

.evidencia-sheet__firma span {
  display: block;
  font-size: 0.8125rem;
  color: #64748b;
}

.evidencia-sheet__firma-fecha {
  margin-top: 0.35rem !important;
  font-size: 0.75rem !important;
  color: #94a3b8 !important;
}

.evidencia-sheet__footer {
  flex-shrink: 0;
  padding: 0.625rem 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: #93c5fd;
  background: #0f2744;
}
</style>
