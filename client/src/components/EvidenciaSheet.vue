<template>
  <div class="evidencia-sheet">

    <header class="evidencia-sheet__header">
      <img :src="logoUrl" alt="Lavin Industrias" class="evidencia-sheet__logo">
      <div class="evidencia-sheet__header-text">
        <h1>{{ titulo }}</h1>
        <p>Industrias Lavín · Recursos Humanos</p>
      </div>
      <div class="evidencia-sheet__header-right">
        <div class="evidencia-sheet__header-ref">
          <span>Ref. P-GP-12&nbsp;&nbsp;F-GP-56</span>
          <span>Rev. 3</span>
        </div>
        <button
          v-if="showDownload && puedeDescargar"
          type="button"
          class="evidencia-sheet__download"
          :disabled="downloading"
          title="Descargar PDF"
          aria-label="Descargar PDF de evidencia"
          @click="$emit('download', tipo)"
        >
          <FileDown :size="16" stroke-width="2" />
        </button>
      </div>
    </header>

    <div class="evidencia-sheet__body">

      <section class="evidencia-sheet__empleado">
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon"><User :size="13" /></span>
          <div>
            <span class="evidencia-sheet__label">Colaborador</span>
            <strong>{{ evidencia.empleado.nombre }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon"><IdCard :size="13" /></span>
          <div>
            <span class="evidencia-sheet__label">Nómina</span>
            <strong>{{ evidencia.empleado.nomina }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon"><Briefcase :size="13" /></span>
          <div>
            <span class="evidencia-sheet__label">Programa</span>
            <strong>{{ fmtPrograma(evidencia.empleado.programa) }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon"><Building2 :size="13" /></span>
          <div>
            <span class="evidencia-sheet__label">Área</span>
            <strong>{{ evidencia.empleado.area || 'Sin área asignada' }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__field">
          <span class="evidencia-sheet__field-icon"><Calendar :size="13" /></span>
          <div>
            <span class="evidencia-sheet__label">Fecha de emisión</span>
            <strong>{{ fmtFecha(evidencia.generadoEn) }}</strong>
          </div>
        </div>
        <div></div>
      </section>

      <div class="evidencia-sheet__stats" :class="{ 'is-puesto': tipo === 'puesto' }">
        <div
          v-if="tipo === 'empresa'"
          class="evidencia-sheet__stat evidencia-sheet__stat--green"
        >
          <span class="evidencia-sheet__stat-icon"><BookOpen :size="15" /></span>
          <div>
            <span class="evidencia-sheet__label">Inducción empresa</span>
            <strong>{{ evidencia.induccionEmpresa.completados }}/{{ evidencia.induccionEmpresa.total }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__stat evidencia-sheet__stat--blue">
          <span class="evidencia-sheet__stat-icon"><User :size="15" /></span>
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
          <span class="evidencia-sheet__stat-icon"><CircleCheck :size="15" /></span>
          <div>
            <span class="evidencia-sheet__label">Evaluación final</span>
            <strong>{{ evidencia.evaluacionFinal.completada ? 'Completada' : 'Pendiente' }}</strong>
          </div>
        </div>
        <div class="evidencia-sheet__stat evidencia-sheet__stat--purple">
          <span class="evidencia-sheet__stat-icon"><Award :size="15" /></span>
          <div>
            <span class="evidencia-sheet__label">Promedio exámenes</span>
            <strong>{{ resumenStats.promedioExamenes != null ? resumenStats.promedioExamenes + '%' : '—' }}</strong>
          </div>
        </div>
      </div>

      <section
        v-if="tipo === 'empresa' && evidencia.induccionEmpresa.habilitada"
        class="evidencia-sheet__section"
      >
        <div class="evidencia-sheet__section-head">
          <h2>Inducción a la empresa</h2>
          <span
            class="evidencia-sheet__badge"
            :class="evidencia.induccionEmpresa.modulosCompleta ? 'is-ok' : 'is-pending'"
          >
            {{ evidencia.induccionEmpresa.completados }}/{{ evidencia.induccionEmpresa.total }} módulos completados
          </span>
        </div>
        <EvidenciaChecklist :modulos="evidencia.induccionEmpresa.modulos" />
        <div
          class="evidencia-sheet__banner"
          :class="evidencia.induccionEmpresa.modulosCompleta ? 'is-ok' : 'is-pending'"
        >
          <CircleCheck :size="14" stroke-width="2.5" />
          {{
            evidencia.induccionEmpresa.modulosCompleta
              ? 'Todos los módulos de inducción a la empresa fueron completados.'
              : 'Inducción a la empresa incompleta.'
          }}
        </div>
      </section>

      <section
        v-if="tipo === 'puesto' && evidencia.induccionPuesto.habilitada"
        class="evidencia-sheet__section"
      >
        <div class="evidencia-sheet__section-head">
          <h2>Inducción al puesto</h2>
          <span
            class="evidencia-sheet__badge"
            :class="evidencia.induccionPuesto.modulosCompleta ? 'is-ok' : 'is-pending'"
          >
            {{ evidencia.induccionPuesto.completados }}/{{ evidencia.induccionPuesto.total }} ítems completados
          </span>
        </div>
        <EvidenciaChecklist :modulos="puestoModulosP1" />
        <EvidenciaChecklist
          v-if="puestoModulosP2.length"
          :modulos="puestoModulosP2"
          :start-index="PUESTO_SPLIT"
          class="evidencia-sheet__checklist-cont"
        />
        <div
          class="evidencia-sheet__banner"
          :class="evidencia.induccionPuesto.modulosCompleta ? 'is-ok' : 'is-pending'"
        >
          <CircleCheck :size="14" stroke-width="2.5" />
          {{
            evidencia.induccionPuesto.modulosCompleta
              ? 'Todos los ítems de inducción al puesto fueron completados.'
              : 'Inducción al puesto incompleta.'
          }}
        </div>
      </section>

      <section
        v-if="evidencia.recordatorios?.habilitada && evidencia.recordatorios.modulos?.length"
        class="evidencia-sheet__section"
      >
        <div class="evidencia-sheet__section-head">
          <h2>Recordatorios importantes</h2>
          <span
            class="evidencia-sheet__badge"
            :class="evidencia.recordatorios.completa ? 'is-ok' : 'is-pending'"
          >
            {{ evidencia.recordatorios.completados }}/{{ evidencia.recordatorios.total }} ítems completados
          </span>
        </div>
        <EvidenciaChecklist :modulos="evidencia.recordatorios.modulos" />
        <div
          class="evidencia-sheet__banner"
          :class="evidencia.recordatorios.completa ? 'is-ok' : 'is-pending'"
        >
          <CircleCheck :size="14" stroke-width="2.5" />
          {{
            evidencia.recordatorios.completa
              ? 'Todos los recordatorios importantes fueron completados.'
              : 'Faltan recordatorios importantes por completar.'
          }}
        </div>
      </section>

      <div v-if="tipo === 'empresa'" class="evidencia-sheet__bottom">
        <section v-if="evidencia.evaluacionFinal" class="evidencia-sheet__card">
          <div
            class="evidencia-sheet__card-icon"
            :class="{ 'is-done': evidencia.evaluacionFinal.completada }"
          >
            <CircleCheck :size="20" stroke-width="2" />
          </div>
          <div>
            <h3>Evaluación final</h3>
            <strong>{{ evidencia.evaluacionFinal.nombre }}</strong>
            <p>Estado: {{ evidencia.evaluacionFinal.completada ? 'Completada' : 'Pendiente' }}
              <template v-if="evidencia.evaluacionFinal.fechaCompletado">
                · Fecha: {{ fmtFecha(evidencia.evaluacionFinal.fechaCompletado) }}
              </template>
            </p>
          </div>
        </section>
        <section v-if="resumenStats.totalExamenes" class="evidencia-sheet__card evidencia-sheet__card--purple">
          <div class="evidencia-sheet__card-icon is-purple">
            <BarChart3 :size="20" stroke-width="2" />
          </div>
          <div>
            <h3>Resumen de exámenes</h3>
            <p>Aprobados: {{ resumenStats.examenesAprobados }} de {{ resumenStats.totalExamenes }}</p>
            <p class="evidencia-sheet__card-big">Promedio general<br><strong>{{ resumenStats.promedioExamenes ?? 0 }}%</strong></p>
          </div>
        </section>
      </div>

      <section class="evidencia-sheet__firmas">
        <p class="evidencia-sheet__firmas-title">Firmas de conformidad</p>
        <table class="evidencia-sheet__firmas-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fecha</th>
              <th>Firma</th>
              <th>Área</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in (tipo === 'empresa' ? 5 : 3)" :key="n">
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </section>

    </div>

    <footer class="evidencia-sheet__footer">
      Documento generado electrónicamente · Uso interno
    </footer>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  Award, BarChart3, BookOpen, Briefcase, Building2, Calendar,
  CircleCheck, FileDown, IdCard, User,
} from '@lucide/vue';
import EvidenciaChecklist from './EvidenciaChecklist.vue';

const PUESTO_SPLIT = 7;

const props = defineProps({
  evidencia: { type: Object, required: true },
  tipo: { type: String, default: 'empresa', validator: (v) => ['empresa', 'puesto'].includes(v) },
  showDownload: { type: Boolean, default: true },
  downloading: { type: Boolean, default: false },
});

defineEmits(['download']);

const logoUrl = '/assets/logoempresa.png';

const titulo = computed(() => (
  props.tipo === 'puesto'
    ? 'Hoja de evidencia de inducción al puesto'
    : 'Hoja de evidencia de inducción a la empresa'
));

const resumenStats = computed(() => (
  props.tipo === 'empresa'
    ? (props.evidencia.resumenEmpresa || props.evidencia.resumen)
    : props.evidencia.resumen
));

const puedeDescargar = computed(() => (
  props.tipo === 'empresa'
    ? props.evidencia.induccionEmpresa?.completa
    : props.evidencia.induccionPuesto?.completa
));

const puestoModulosP1 = computed(() =>
  props.evidencia.induccionPuesto.modulos.slice(0, PUESTO_SPLIT),
);

const puestoModulosP2 = computed(() =>
  props.evidencia.induccionPuesto.modulos.slice(PUESTO_SPLIT),
);

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
  if (programa === 'ayudante_general') return 'Ayudante general';
  return '—';
}
</script>

<style scoped>
.evidencia-sheet {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: #fff;
}

.evidencia-sheet__header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-shrink: 0;
  padding: 0.875rem 1.25rem;
  background: #0f2744;
  color: #fff;
}

.evidencia-sheet__logo {
  height: 38px;
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
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.3;
  color: #fff;
}

.evidencia-sheet__header-text p {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: #93c5fd;
}

.evidencia-sheet__header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  flex-shrink: 0;
}

.evidencia-sheet__header-ref {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.4;
  text-align: right;
}

.evidencia-sheet__download {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 6px;
  background: rgba(255,255,255,0.08);
  color: #fff;
  cursor: pointer;
}

.evidencia-sheet__download:hover:not(:disabled) { background: rgba(255,255,255,0.16); }
.evidencia-sheet__download:disabled { opacity: 0.5; cursor: not-allowed; }

.evidencia-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.25rem 0;
  background: #fff;
}

.evidencia-sheet__empleado {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.625rem 1.5rem;
  padding: 0.875rem 1rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 0;
  margin-bottom: 0.875rem;
}

.evidencia-sheet__field {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.evidencia-sheet__field-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dbeafe;
  color: #2563eb;
  flex-shrink: 0;
  margin-top: 1px;
}

.evidencia-sheet__label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.1rem;
}

.evidencia-sheet__field strong {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.evidencia-sheet__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.875rem;
}

.evidencia-sheet__stats.is-puesto {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 700px) {
  .evidencia-sheet__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.evidencia-sheet__stat {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem 0.625rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 0;
  border-left: 4px solid transparent;
}

.evidencia-sheet__stat--green { border-left-color: #16a34a; }
.evidencia-sheet__stat--blue  { border-left-color: #2563eb; }
.evidencia-sheet__stat--purple{ border-left-color: #7c3aed; }

.evidencia-sheet__stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 0;
}

.evidencia-sheet__stat--green .evidencia-sheet__stat-icon { background: #ecfdf5; color: #16a34a; }
.evidencia-sheet__stat--blue  .evidencia-sheet__stat-icon { background: #eff6ff; color: #2563eb; }
.evidencia-sheet__stat--purple .evidencia-sheet__stat-icon { background: #f5f3ff; color: #7c3aed; }

.evidencia-sheet__stat strong {
  display: block;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.evidencia-sheet__section {
  margin-bottom: 0.875rem;
}

.evidencia-sheet__checklist-cont {
  margin-top: 0.5rem;
}

.evidencia-sheet__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.evidencia-sheet__section-head h2 {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1e3a5f;
}

.evidencia-sheet__badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid;
}

.evidencia-sheet__badge.is-ok    { color: #16a34a; background: #ecfdf5; border-color: #86efac; }
.evidencia-sheet__badge.is-pending { color: #b45309; background: #fff7ed; border-color: #fdba74; }

.evidencia-sheet__banner {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid;
}

.evidencia-sheet__banner.is-ok    { color: #16a34a; background: #ecfdf5; border-color: #86efac; }
.evidencia-sheet__banner.is-pending{ color: #b45309; background: #fff7ed; border-color: #fdba74; }

.evidencia-sheet__bottom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.625rem;
  margin-bottom: 0.875rem;
}

@media (max-width: 600px) {
  .evidencia-sheet__bottom { grid-template-columns: 1fr; }
}

.evidencia-sheet__card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 0;
}

.evidencia-sheet__card h3 {
  margin: 0 0 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #1e3a5f;
}

.evidencia-sheet__card strong {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.2rem;
}

.evidencia-sheet__card p {
  margin: 0.1rem 0 0;
  font-size: 0.8125rem;
  color: #64748b;
}

.evidencia-sheet__card-big {
  margin-top: 0.35rem !important;
  color: #1e293b !important;
  font-size: 0.8125rem;
}

.evidencia-sheet__card-big strong {
  font-size: 1.125rem;
  color: #1e293b;
  margin: 0;
}

.evidencia-sheet__card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
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

.evidencia-sheet__firmas {
  border-top: 1px solid #cbd5e1;
  margin-top: 0.25rem;
  padding: 1rem 0 1rem;
}

.evidencia-sheet__firmas-title {
  margin: 0 0 0.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
  text-align: center;
}

.evidencia-sheet__firmas-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #cbd5e1;
  font-size: 0.8125rem;
}

.evidencia-sheet__firmas-table thead tr {
  background: #1e3a5f;
}

.evidencia-sheet__firmas-table th {
  padding: 0.4rem 0.5rem;
  text-align: left;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #fff;
}

.evidencia-sheet__firmas-table td {
  height: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.25rem 0.5rem;
}

.evidencia-sheet__firmas-table tbody tr:nth-child(even) td {
  background: #f8fafc;
}

.evidencia-sheet__firmas-table tbody tr:last-child td {
  border-bottom: none;
}

.evidencia-sheet__footer {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  text-align: center;
  font-size: 0.6875rem;
  color: #93c5fd;
  background: #0f2744;
}
</style>
