const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PAGE = { w: 595.28, h: 841.89 };
const M = 40;
const CW = PAGE.w - M * 2;
const HEADER_H = 80;
const FOOTER_H = 28;
const FOOTER_RESERVE = FOOTER_H + 16;

const LOGO_W = 148;
const LOGO_H = Math.round(LOGO_W * 80 / 500);   // preserva relación 500×80

const C = {
  navy:          '#0f2744',
  navyMid:       '#1e3a5f',
  blue:          '#2563eb',
  blueLight:     '#dbeafe',
  slate:         '#64748b',
  text:          '#1e293b',
  border:        '#cbd5e1',
  rowAlt:        '#f8fafc',
  success:       '#16a34a',
  successBg:     '#ecfdf5',
  successBorder: '#86efac',
  warning:       '#b45309',
  warningBg:     '#fff7ed',
  warningBorder: '#fdba74',
  purple:        '#7c3aed',
  purpleBg:      '#f5f3ff',
  purpleLight:   '#ede9fe',
  white:         '#ffffff',
  footerText:    '#93c5fd',
};

const LOGO_PATH = path.join(__dirname, '../../public/assets/logoempresa.png');

/* ─── helpers de formato ─────────────────────────────────────── */

function fmtFecha(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtPrograma(programa) {
  if (programa === 'administrativo') return 'Administrativo';
  if (programa === 'operativo') return 'Operativo';
  return '—';
}

function fmtCalificacion(modulo) {
  if (modulo.esEvaluacionFinal) {
    return modulo.completado ? 'Encuesta completada' : 'Pendiente';
  }
  if (!modulo.requiereExamen) return 'N/A';
  if (modulo.calificacion != null) {
    return modulo.aprobado
      ? `${modulo.calificacion}% - Aprobado`
      : `${modulo.calificacion}% - No aprobado`;
  }
  return modulo.completado ? 'Completado' : 'Pendiente';
}

function sanitize(str) {
  if (str == null) return '';
  return String(str)
    .replace(/\u2713|\u2714/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00B7/g, ' - ')
    .trim();
}

function truncate(str, max) {
  const s = sanitize(str);
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/* ─── primitivas de dibujo ───────────────────────────────────── */

function drawRect(doc, x, y, w, h, fill, stroke) {
  if (fill)   doc.save().rect(x, y, w, h).fill(fill).restore();
  if (stroke) doc.save().rect(x, y, w, h).strokeColor(stroke).lineWidth(0.5).stroke().restore();
}

function drawCheckIcon(doc, cx, cy, done, r = 7) {
  if (done) {
    doc.save().circle(cx, cy, r).fill(C.success).restore();
    doc.save()
      .strokeColor(C.white).lineWidth(1.4).lineCap('round').lineJoin('round')
      .moveTo(cx - 3.5, cy).lineTo(cx - 0.5, cy + 3).lineTo(cx + 4, cy - 3.5)
      .stroke().restore();
  } else {
    doc.save().circle(cx, cy, r).lineWidth(1).strokeColor(C.border).stroke().restore();
  }
}

function drawLogo(doc, x, y) {
  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, x, y, { width: LOGO_W, height: LOGO_H });
      return { w: LOGO_W, h: LOGO_H };
    } catch { /* fallback below */ }
  }
  drawRect(doc, x, y, 44, 28, C.navyMid, C.blue);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.white)
    .text('LAVIN', x, y + 9, { width: 44, align: 'center' });
  return { w: 44, h: 28 };
}

function ensureSpace(doc, y, needed) {
  if (y + needed <= PAGE.h - M - FOOTER_RESERVE) return y;
  doc.addPage();
  return drawPageHeader(doc);
}

/* ─── HEADER ─────────────────────────────────────────────────── */

function drawPageHeader(doc) {
  drawRect(doc, 0, 0, PAGE.w, HEADER_H, C.navy);

  const logoY = (HEADER_H - LOGO_H) / 2;
  const logo  = drawLogo(doc, M, logoY);
  const tx    = M + logo.w + 14;
  const textW = PAGE.w - tx - 110;   // deja espacio para la ref a la derecha

  doc.font('Helvetica-Bold').fontSize(15).fillColor(C.white)
    .text('Hoja de evidencia de inducción', tx, 22, { width: textW, lineBreak: false });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.footerText)
    .text('Industrias Lavín · Recursos Humanos', tx, 44, { width: textW, lineBreak: false });

  // referencia derecha
  const refX = PAGE.w - M - 100;
  doc.font('Helvetica').fontSize(7.5).fillColor('rgba(255,255,255,0.65)')
    .text('Ref. P-GP-12   F-GP-56', refX, 24, { width: 100, align: 'right', lineBreak: false });
  doc.font('Helvetica').fontSize(7.5).fillColor('rgba(255,255,255,0.65)')
    .text('Rev. 3', refX, 38, { width: 100, align: 'right', lineBreak: false });

  return HEADER_H + 16;
}

/* ─── FOOTER ─────────────────────────────────────────────────── */

function drawPageFooter(doc) {
  const fy = PAGE.h - FOOTER_H;
  drawRect(doc, 0, fy, PAGE.w, FOOTER_H, C.navy);
  doc.font('Helvetica').fontSize(7.5).fillColor(C.footerText)
    .text('Documento generado electrónicamente · Uso interno', M, fy + 9, {
      width: CW, align: 'center', lineBreak: false,
    });
}

/* ─── TARJETA EMPLEADO ───────────────────────────────────────── */

function drawEmployeeCard(doc, y, empleado, generadoEn) {
  const cardH = 90;
  y = ensureSpace(doc, y, cardH + 14);
  drawRect(doc, M, y, CW, cardH, C.white, C.border);

  const colW = (CW - 28) / 2;
  const rows = [
    [{ label: 'Colaborador',    value: empleado.nombre },                        { label: 'Nómina', value: empleado.nomina }],
    [{ label: 'Programa',       value: fmtPrograma(empleado.programa) },         { label: 'Área',   value: empleado.area || 'Sin área asignada' }],
    [{ label: 'Fecha de emisión', value: fmtFecha(generadoEn) },                 null],
  ];

  rows.forEach((pair, rowIdx) => {
    const cy = y + 11 + rowIdx * 27;
    pair.forEach((item, colIdx) => {
      if (!item) return;
      const cx = M + 10 + colIdx * colW;
      // ícono circular
      doc.save().circle(cx + 8, cy + 8, 8).fill(C.blueLight).restore();
      // label
      doc.font('Helvetica').fontSize(7).fillColor(C.slate)
        .text(item.label.toUpperCase(), cx + 20, cy, { width: colW - 24, lineBreak: false });
      // valor
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.text)
        .text(truncate(item.value, 40), cx + 20, cy + 10, { width: colW - 24, lineBreak: false });
    });
  });

  return y + cardH + 14;
}

/* ─── STATS ROW ──────────────────────────────────────────────── */

function drawStatBox(doc, bx, y, boxW, boxH, label, value, accent, iconBg) {
  drawRect(doc, bx, y, boxW, boxH, C.white, C.border);
  // acento izquierdo 4 pt
  doc.rect(bx, y, 4, boxH).fill(accent);
  // ícono
  doc.save().circle(bx + 20, y + boxH / 2, 11).fill(iconBg).restore();
  // label
  doc.font('Helvetica').fontSize(6.5).fillColor(C.slate)
    .text(label.toUpperCase(), bx + 36, y + 10, { width: boxW - 42, lineBreak: false });
  // valor
  doc.font('Helvetica-Bold').fontSize(13).fillColor(C.text)
    .text(sanitize(value), bx + 36, y + 24, { width: boxW - 42, lineBreak: false });
}

function drawSummaryRow(doc, y, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen) {
  const boxH = 56;
  y = ensureSpace(doc, y, boxH + 14);

  const boxes = [
    {
      label:  'Inducción empresa',
      value:  `${induccionEmpresa.completados}/${induccionEmpresa.total}`,
      accent: C.success, iconBg: C.successBg,
    },
    {
      label:  'Inducción puesto',
      value:  induccionPuesto.habilitada
        ? `${induccionPuesto.completados}/${induccionPuesto.total}`
        : 'No habilitada',
      accent: C.blue, iconBg: '#eff6ff',
    },
    {
      label:  'Evaluación final',
      value:  evaluacionFinal?.completada ? 'Completada' : (evaluacionFinal ? 'Pendiente' : '—'),
      accent: C.success, iconBg: C.successBg,
    },
    {
      label:  'Promedio exámenes',
      value:  resumen.totalExamenes > 0 ? `${resumen.promedioExamenes ?? 0}%` : '—',
      accent: C.purple, iconBg: C.purpleBg,
    },
  ];

  const gap  = 6;
  const boxW = (CW - gap * 3) / 4;
  boxes.forEach((box, i) => {
    drawStatBox(doc, M + i * (boxW + gap), y, boxW, boxH, box.label, box.value, box.accent, box.iconBg);
  });

  return y + boxH + 14;
}

/* ─── SECCIÓN HEADER ─────────────────────────────────────────── */

function drawSectionHeader(doc, y, title, completados, total, completa) {
  y = ensureSpace(doc, y, 28);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.navyMid)
    .text(sanitize(title).toUpperCase(), M, y + 2, { width: CW - 130, lineBreak: false });

  const badge  = `${completados}/${total} módulos completados`;
  doc.font('Helvetica-Bold').fontSize(7);
  const badgeW = Math.min(doc.widthOfString(badge) + 16, 130);
  const badgeX = M + CW - badgeW;
  drawRect(doc, badgeX, y, badgeW, 16,
    completa ? C.successBg   : C.warningBg,
    completa ? C.successBorder : C.warningBorder);
  doc.fillColor(completa ? C.success : C.warning)
    .text(badge, badgeX + 8, y + 4, { width: badgeW - 16, lineBreak: false });

  return y + 20;
}

/* ─── TABLA MÓDULOS ──────────────────────────────────────────── */

function tableColumns() {
  const wNum    = 22;
  const wEstado = 80;
  const wFecha  = 64;
  const wCal    = 92;
  const wModulo = CW - wNum - wEstado - wFecha - wCal;
  return [
    { label: '#',           w: wNum,    align: 'center' },
    { label: 'Módulo',      w: wModulo },
    { label: 'Estado',      w: wEstado },
    { label: 'Fecha',       w: wFecha },
    { label: 'Calificación',w: wCal },
  ];
}

function drawTableHeader(doc, y, cols) {
  const h = 20;
  drawRect(doc, M, y, CW, h, C.navyMid);
  let x = M;
  cols.forEach((col) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(C.white)
      .text(col.label, x + 4, y + 6, { width: col.w - 8, align: col.align || 'left', lineBreak: false });
    x += col.w;
  });
  return y + h;
}

function drawChecklistTable(doc, y, modulos) {
  const cols = tableColumns();
  y = ensureSpace(doc, y, 20 + 22);
  y = drawTableHeader(doc, y, cols);

  if (!modulos.length) {
    drawRect(doc, M, y, CW, 20, C.white, C.border);
    doc.font('Helvetica').fontSize(8).fillColor(C.slate)
      .text('Sin módulos registrados', M + 8, y + 6, { lineBreak: false });
    return y + 24;
  }

  modulos.forEach((modulo, idx) => {
    const nombre  = sanitize(modulo.nombre);
    const calText = sanitize(fmtCalificacion(modulo));

    doc.font('Helvetica').fontSize(8);
    const nombreH = doc.heightOfString(nombre, { width: cols[1].w - 10 });
    const rowH    = Math.max(20, Math.ceil(nombreH) + 8);

    const yBefore = y;
    y = ensureSpace(doc, y, rowH);
    if (y !== yBefore) y = drawTableHeader(doc, y, cols);

    drawRect(doc, M, y, CW, rowH, idx % 2 === 0 ? C.white : C.rowAlt, C.border);

    let x    = M;
    const midY = y + rowH / 2;

    // #
    doc.font('Helvetica').fontSize(8).fillColor(C.slate)
      .text(String(idx + 1), x, midY - 4, { width: cols[0].w, align: 'center', lineBreak: false });
    x += cols[0].w;

    // nombre
    doc.font('Helvetica').fontSize(8).fillColor(C.text)
      .text(nombre, x + 5, y + 5, { width: cols[1].w - 10, lineBreak: true });
    x += cols[1].w;

    // estado con ícono
    drawCheckIcon(doc, x + 9, midY, modulo.completado, 6);
    doc.font('Helvetica').fontSize(7.5).fillColor(modulo.completado ? C.success : C.slate)
      .text(modulo.completado ? 'Completado' : 'Pendiente', x + 18, midY - 4,
        { width: cols[2].w - 22, lineBreak: false });
    x += cols[2].w;

    // fecha
    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate)
      .text(fmtFecha(modulo.fechaCompletado), x + 5, midY - 4,
        { width: cols[3].w - 10, lineBreak: false });
    x += cols[3].w;

    // calificación
    const calColor = modulo.esEvaluacionFinal
      ? (modulo.completado ? C.success : C.warning)
      : (modulo.aprobado || (!modulo.requiereExamen && modulo.completado) ? C.success : C.text);
    doc.font('Helvetica').fontSize(7.5).fillColor(calColor)
      .text(calText, x + 5, y + 5, { width: cols[4].w - 10, lineBreak: true });

    y += rowH;
  });

  return y + 8;
}

/* ─── BANNER DE ESTADO ───────────────────────────────────────── */

function drawStatusBanner(doc, y, completa, textoOk, textoPending) {
  const text = sanitize(completa ? textoOk : textoPending);
  doc.font('Helvetica-Bold').fontSize(8);
  const textH = doc.heightOfString(text, { width: CW - 32 });
  const h     = Math.max(20, textH + 12);
  y = ensureSpace(doc, y, h + 8);

  drawRect(doc, M, y, CW, h,
    completa ? C.successBg   : C.warningBg,
    completa ? C.successBorder : C.warningBorder);
  drawCheckIcon(doc, M + 13, y + h / 2, completa, 6);
  doc.fillColor(completa ? C.success : C.warning)
    .text(text, M + 24, y + (h - textH) / 2 + 1, { width: CW - 32, lineBreak: true });

  return y + h + 10;
}

/* ─── EVAL FINAL + RESUMEN EXÁMENES ─────────────────────────── */

function drawEvalAndExamRow(doc, y, evaluacionFinal, resumen) {
  const gap  = 10;
  const boxW = (CW - gap) / 2;
  const boxH = 60;
  y = ensureSpace(doc, y, boxH + 14);

  if (evaluacionFinal) {
    drawRect(doc, M, y, boxW, boxH, C.white, C.border);
    drawCheckIcon(doc, M + 20, y + boxH / 2, evaluacionFinal.completada, 11);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(C.navyMid)
      .text('EVALUACIÓN FINAL', M + 38, y + 9, { width: boxW - 44, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
      .text(truncate(evaluacionFinal.nombre, 34), M + 38, y + 22, { width: boxW - 44, lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate)
      .text(
        `Estado: ${evaluacionFinal.completada ? 'Completada' : 'Pendiente'} - Fecha: ${fmtFecha(evaluacionFinal.fechaCompletado)}`,
        M + 38, y + 38, { width: boxW - 44, lineBreak: false },
      );
  }

  if (resumen.totalExamenes) {
    const bx = evaluacionFinal ? M + boxW + gap : M;
    const w  = evaluacionFinal ? boxW : CW;
    drawRect(doc, bx, y, w, boxH, C.purpleBg, C.border);
    doc.save().circle(bx + 20, y + boxH / 2, 12).fill(C.purpleLight).restore();
    doc.font('Helvetica-Bold').fontSize(7).fillColor(C.purple)
      .text('RESUMEN DE EXÁMENES', bx + 38, y + 9, { width: w - 44, lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.text)
      .text(`Aprobados: ${resumen.examenesAprobados} de ${resumen.totalExamenes}`,
        bx + 38, y + 22, { width: w - 44, lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate)
      .text('Promedio general', bx + 38, y + 36, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(14).fillColor(C.text)
      .text(`${resumen.promedioExamenes ?? 0}%`, bx + 38, y + 42, { width: w - 44, lineBreak: false });
  }

  return y + boxH + 14;
}

/* ─── FIRMA ──────────────────────────────────────────────────── */

function drawSignature(doc, y) {
  y = ensureSpace(doc, y, 68);
  // separador superior
  doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(C.border).lineWidth(0.5).stroke();
  y += 14;

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.slate)
    .text('FIRMA DE RECURSOS HUMANOS', M, y, { width: CW, align: 'center', lineBreak: false });

  const lineW = 200;
  const lineX = M + (CW - lineW) / 2;
  doc.moveTo(lineX, y + 26).lineTo(lineX + lineW, y + 26)
    .strokeColor(C.slate).lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(7.5).fillColor(C.slate)
    .text('Nombre y firma', lineX, y + 32, { width: lineW, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
    .text('Fecha: ___ / ___ / ___', lineX, y + 44, { width: lineW, align: 'center', lineBreak: false });

  return y + 58;
}

/* ─── FUNCIÓN PRINCIPAL ──────────────────────────────────────── */

function generarPdfEvidencia(evidencia) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { empleado, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen } = evidencia;

    let y = drawPageHeader(doc);
    y = drawEmployeeCard(doc, y, empleado, evidencia.generadoEn);
    y = drawSummaryRow(doc, y, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen);

    if (induccionEmpresa.habilitada) {
      y = drawSectionHeader(doc, y, 'Módulos de inducción',
        induccionEmpresa.completados, induccionEmpresa.total, induccionEmpresa.completa);
      y = drawChecklistTable(doc, y, induccionEmpresa.modulos);
      y = drawStatusBanner(doc, y, induccionEmpresa.completa,
        'Todos los módulos de inducción a la empresa fueron completados.',
        'Inducción a la empresa incompleta.');
    }

    if (induccionPuesto.habilitada) {
      y = drawSectionHeader(doc, y, 'Inducción al puesto',
        induccionPuesto.completados, induccionPuesto.total, induccionPuesto.completa);
      y = drawChecklistTable(doc, y, induccionPuesto.modulos);
      y = drawStatusBanner(doc, y, induccionPuesto.completa,
        'Todos los módulos de inducción al puesto fueron completados.',
        'Inducción al puesto incompleta.');
    }

    y = drawEvalAndExamRow(doc, y, evaluacionFinal, resumen);
    drawSignature(doc, y);

    // footer en todas las páginas
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawPageFooter(doc);
    }

    doc.end();
  });
}

module.exports = { generarPdfEvidencia };
