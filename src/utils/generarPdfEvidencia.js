const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PAGE = { w: 595.28, h: 841.89 };
const M = 40;
const CW = PAGE.w - M * 2;
const FOOTER_RESERVE = 72;

const C = {
  navy: '#0f2744',
  navyMid: '#1e3a5f',
  blue: '#2563eb',
  blueLight: '#dbeafe',
  slate: '#64748b',
  slateDark: '#334155',
  text: '#1e293b',
  border: '#cbd5e1',
  rowAlt: '#f8fafc',
  success: '#16a34a',
  successBg: '#ecfdf5',
  warning: '#b45309',
  white: '#ffffff',
};

const LOGO_PATH = path.join(__dirname, '../../public/assets/logoempresa.png');
const LOGO_RATIO = 80 / 500; // alto / ancho del PNG
const LOGO_W = 148;
const LOGO_H = LOGO_W * LOGO_RATIO;
const HEADER_H = 76;

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

/** Evita caracteres que Helvetica WinAnsi no renderiza bien en PDF. */
function sanitize(str) {
  if (str == null) return '';
  return String(str)
    .replace(/\u2713|\u2714/g, 'OK')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00B7/g, ' - ')
    .trim();
}

function truncate(str, max) {
  const s = sanitize(str);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function ensureSpace(doc, y, needed) {
  if (y + needed <= PAGE.h - M - FOOTER_RESERVE) return y;
  doc.addPage();
  return drawPageHeader(doc);
}

function drawRect(doc, x, y, w, h, fill, stroke) {
  if (fill) {
    doc.save().rect(x, y, w, h).fill(fill).restore();
  }
  if (stroke) {
    doc.save().rect(x, y, w, h).strokeColor(stroke).lineWidth(0.5).stroke().restore();
  }
}

function drawCheckIcon(doc, cx, cy, done) {
  const r = 7;
  if (done) {
    doc.save().circle(cx, cy, r).fill(C.success).restore();
    doc.save()
      .strokeColor(C.white)
      .lineWidth(1.4)
      .lineCap('round')
      .lineJoin('round')
      .moveTo(cx - 3.5, cy)
      .lineTo(cx - 0.5, cy + 3)
      .lineTo(cx + 4, cy - 3.5)
      .stroke()
      .restore();
  } else {
    doc.save().circle(cx, cy, r).lineWidth(1).strokeColor(C.border).stroke().restore();
  }
}

function drawLogo(doc, x, y) {
  if (!fs.existsSync(LOGO_PATH)) {
    drawLogoFallback(doc, x, y + 4);
    return { w: 44, h: 36 };
  }
  try {
    doc.image(LOGO_PATH, x, y, { width: LOGO_W, height: LOGO_H });
    return { w: LOGO_W, h: LOGO_H };
  } catch {
    drawLogoFallback(doc, x, y + 4);
    return { w: 44, h: 36 };
  }
}

function drawLogoFallback(doc, x, y) {
  drawRect(doc, x, y, 44, 28, C.navyMid, C.blue);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white)
    .text('LAVIN', x, y + 9, { width: 44, align: 'center' });
}

function drawPageHeader(doc) {
  drawRect(doc, 0, 0, PAGE.w, HEADER_H, C.navy);

  const logoY = (HEADER_H - LOGO_H) / 2;
  const logo = drawLogo(doc, M, logoY);
  const tx = M + logo.w + 14;
  const textW = PAGE.w - tx - M;

  doc.font('Helvetica-Bold').fontSize(15).fillColor(C.white)
    .text('Hoja de evidencia de inducción', tx, 22, { width: textW, lineBreak: false });
  doc.font('Helvetica').fontSize(9.5).fillColor('#93c5fd')
    .text('Industrias Lavín · Recursos Humanos', tx, 44, { width: textW, lineBreak: false });

  return HEADER_H + 16;
}

function drawEmployeeCard(doc, y, empleado, generadoEn) {
  const cardH = 78;
  y = ensureSpace(doc, y, cardH + 12);
  drawRect(doc, M, y, CW, cardH, C.white, C.border);

  const colW = (CW - 28) / 2;
  const rows = [
    [
      { label: 'Colaborador', value: empleado.nombre },
      { label: 'Nómina', value: empleado.nomina },
    ],
    [
      { label: 'Programa', value: fmtPrograma(empleado.programa) },
      { label: 'Área', value: empleado.area || 'Sin área asignada' },
    ],
    [
      { label: 'Fecha de emisión', value: fmtFecha(generadoEn) },
      null,
    ],
  ];

  rows.forEach((pair, rowIdx) => {
    const cy = y + 12 + rowIdx * 24;
    pair.forEach((item, colIdx) => {
      if (!item) return;
      const cx = M + 14 + colIdx * colW;
      doc.circle(cx + 6, cy + 6, 6).fill(C.blueLight);
      doc.font('Helvetica').fontSize(7).fillColor(C.slate)
        .text(item.label.toUpperCase(), cx + 18, cy, { width: colW - 24, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.text)
        .text(truncate(item.value, 48), cx + 18, cy + 10, { width: colW - 24, lineBreak: false });
    });
  });

  return y + cardH + 16;
}

function drawSummaryRow(doc, y, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen) {
  const boxH = 50;
  y = ensureSpace(doc, y, boxH + 14);

  const boxes = [];
  if (induccionEmpresa.habilitada) {
    boxes.push({
      label: 'Inducción empresa',
      value: `${induccionEmpresa.completados}/${induccionEmpresa.total}`,
      ok: induccionEmpresa.completa,
    });
  }
  if (induccionPuesto.habilitada) {
    boxes.push({
      label: 'Inducción puesto',
      value: `${induccionPuesto.completados}/${induccionPuesto.total}`,
      ok: induccionPuesto.completa,
    });
  } else {
    boxes.push({ label: 'Inducción puesto', value: 'No habilitada', ok: null });
  }
  if (evaluacionFinal) {
    boxes.push({
      label: 'Evaluación final',
      value: evaluacionFinal.completada ? 'Completada' : 'Pendiente',
      ok: evaluacionFinal.completada,
    });
  }
  if (resumen.totalExamenes > 0) {
    boxes.push({
      label: 'Promedio exámenes',
      value: `${resumen.promedioExamenes ?? 0}%`,
      ok: resumen.examenesAprobados === resumen.totalExamenes,
    });
  }

  const count = Math.min(boxes.length, 4);
  const gap = 8;
  const boxW = (CW - gap * (count - 1)) / count;

  boxes.slice(0, 4).forEach((box, i) => {
    const bx = M + i * (boxW + gap);
    const bg = box.ok === true ? C.successBg : box.ok === false ? '#fff7ed' : '#f1f5f9';
    const accent = box.ok === true ? C.success : box.ok === false ? C.warning : C.slate;
    drawRect(doc, bx, y, boxW, boxH, bg, C.border);
    doc.rect(bx, y, 4, boxH).fill(accent);
    doc.font('Helvetica').fontSize(7).fillColor(C.slate)
      .text(box.label.toUpperCase(), bx + 10, y + 9, { width: boxW - 16, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.text)
      .text(sanitize(box.value), bx + 10, y + 24, { width: boxW - 16, lineBreak: false });
  });

  return y + boxH + 16;
}

function drawSectionHeader(doc, y, title, completados, total, completa) {
  y = ensureSpace(doc, y, 32);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.navyMid)
    .text(sanitize(title).toUpperCase(), M, y, { width: CW - 130, lineBreak: false });

  const badge = `${completados}/${total} modulos completados`;
  doc.font('Helvetica-Bold').fontSize(7.5);
  const badgeW = Math.min(doc.widthOfString(badge) + 16, 130);
  const badgeX = M + CW - badgeW;
  drawRect(doc, badgeX, y - 1, badgeW, 17, completa ? C.successBg : '#fff7ed', completa ? C.success : C.warning);
  doc.fillColor(completa ? C.success : C.warning)
    .text(badge, badgeX + 8, y + 4, { width: badgeW - 16, lineBreak: false });

  return y + 20;
}

function tableColumns() {
  const wNum = 22;
  const wEstado = 72;
  const wFecha = 68;
  const wModulo = Math.floor(CW * 0.42);
  const wCal = CW - wNum - wModulo - wEstado - wFecha;
  return [
    { key: 'num', label: '#', w: wNum, align: 'center' },
    { key: 'nombre', label: 'Modulo', w: wModulo },
    { key: 'estado', label: 'Estado', w: wEstado },
    { key: 'fecha', label: 'Fecha', w: wFecha },
    { key: 'cal', label: 'Calificacion', w: wCal },
  ];
}

function drawTableHeader(doc, y, cols) {
  const headerH = 20;
  let x = M;
  drawRect(doc, M, y, CW, headerH, C.navyMid);
  cols.forEach((col) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.white)
      .text(col.label, x + 4, y + 6, { width: col.w - 8, align: col.align || 'left', lineBreak: false });
    x += col.w;
  });
  return y + headerH;
}

function drawChecklistTable(doc, y, modulos) {
  const cols = tableColumns();
  const headerH = 20;
  y = ensureSpace(doc, y, headerH + 24);
  y = drawTableHeader(doc, y, cols);

  if (!modulos.length) {
    const rowH = 22;
    drawRect(doc, M, y, CW, rowH, C.white, C.border);
    doc.font('Helvetica').fontSize(8.5).fillColor(C.slate)
      .text('Sin módulos registrados', M + 8, y + 7, { lineBreak: false });
    return y + rowH + 8;
  }

  modulos.forEach((modulo, idx) => {
    const nombre = sanitize(modulo.nombre);
    const calText = sanitize(fmtCalificacion(modulo));

    doc.font('Helvetica').fontSize(8);
    const nombreH = doc.heightOfString(nombre, { width: cols[1].w - 10 });
    const calH = doc.heightOfString(calText, { width: cols[4].w - 10 });
    const rowH = Math.max(20, Math.ceil(nombreH) + 8, Math.ceil(calH) + 8);

    const yBefore = y;
    y = ensureSpace(doc, y, rowH);
    if (y !== yBefore) {
      y = drawTableHeader(doc, y, cols);
    }

    const bg = idx % 2 === 0 ? C.white : C.rowAlt;
    drawRect(doc, M, y, CW, rowH, bg, C.border);

    let x = M;
    const midY = y + rowH / 2;

    doc.font('Helvetica').fontSize(8).fillColor(C.slate)
      .text(String(idx + 1), x, midY - 4, { width: cols[0].w, align: 'center', lineBreak: false });
    x += cols[0].w;

    doc.font('Helvetica').fontSize(8).fillColor(C.text)
      .text(nombre, x + 5, y + 5, { width: cols[1].w - 10, lineBreak: true });
    x += cols[1].w;

    const estadoText = modulo.completado ? 'Completado' : 'Pendiente';
    drawCheckIcon(doc, x + 10, midY, modulo.completado);
    doc.font('Helvetica').fontSize(7.5).fillColor(modulo.completado ? C.success : C.slate)
      .text(estadoText, x + 20, midY - 4, { width: cols[2].w - 24, lineBreak: false });
    x += cols[2].w;

    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate)
      .text(fmtFecha(modulo.fechaCompletado), x + 5, midY - 4, { width: cols[3].w - 10, lineBreak: false });
    x += cols[3].w;

    const calColor = modulo.esEvaluacionFinal
      ? (modulo.completado ? C.success : C.warning)
      : (modulo.aprobado || (!modulo.requiereExamen && modulo.completado) ? C.success : C.text);
    doc.font('Helvetica').fontSize(7.5).fillColor(calColor)
      .text(calText, x + 5, y + 5, { width: cols[4].w - 10, lineBreak: true });

    y += rowH;
  });

  return y + 8;
}

function drawStatusBanner(doc, y, completa, labelCompleto, labelIncompleto) {
  const text = sanitize(completa ? labelCompleto : labelIncompleto);
  doc.font('Helvetica-Bold').fontSize(8);
  const textH = doc.heightOfString(text, { width: CW - 24 });
  const h = Math.max(22, textH + 14);
  y = ensureSpace(doc, y, h + 8);

  const bg = completa ? C.successBg : '#fff7ed';
  const color = completa ? C.success : C.warning;
  drawRect(doc, M, y, CW, h, bg, color);
  doc.fillColor(color).text(text, M + 10, y + 7, { width: CW - 20, lineBreak: true });
  return y + h + 12;
}

function drawEvalAndExamRow(doc, y, evaluacionFinal, resumen) {
  const gap = 10;
  const boxW = (CW - gap) / 2;
  const boxH = 58;
  y = ensureSpace(doc, y, boxH + 14);

  if (evaluacionFinal) {
    drawRect(doc, M, y, boxW, boxH, C.white, C.border);
    drawCheckIcon(doc, M + 22, y + 28, evaluacionFinal.completada);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.navyMid)
      .text('Evaluacion final', M + 38, y + 10, { width: boxW - 46, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.text)
      .text(truncate(evaluacionFinal.nombre, 36), M + 38, y + 24, { width: boxW - 46, lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate)
      .text(
        `Estado: ${evaluacionFinal.completada ? 'Completada' : 'Pendiente'}  -  Fecha: ${fmtFecha(evaluacionFinal.fechaCompletado)}`,
        M + 38,
        y + 38,
        { width: boxW - 46, lineBreak: false },
      );
  }

  if (resumen.totalExamenes) {
    const bx = evaluacionFinal ? M + boxW + gap : M;
    const w = evaluacionFinal ? boxW : CW;
    drawRect(doc, bx, y, w, boxH, '#f5f3ff', C.border);
    doc.circle(bx + 22, y + 28, 12).fill('#ede9fe');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#7c3aed')
      .text('Resumen de examenes', bx + 38, y + 10, { width: w - 46, lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.text)
      .text(
        `Aprobados: ${resumen.examenesAprobados} de ${resumen.totalExamenes}`,
        bx + 38,
        y + 26,
        { width: w - 46, lineBreak: false },
      );
    doc.font('Helvetica').fontSize(7.5).fillColor(C.text)
      .text(
        `Promedio general: ${resumen.promedioExamenes ?? 0}%`,
        bx + 38,
        y + 40,
        { width: w - 46, lineBreak: false },
      );
  }

  return y + boxH + 14;
}

function drawSignature(doc, y) {
  y = ensureSpace(doc, y, 72);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.slate)
    .text('FIRMA DE RECURSOS HUMANOS', M, y, { width: CW, align: 'center', lineBreak: false });

  const lineW = 200;
  const lineX = M + (CW - lineW) / 2;
  doc.moveTo(lineX, y + 28).lineTo(lineX + lineW, y + 28).strokeColor(C.slate).lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(8).fillColor(C.slate)
    .text('Nombre y firma', lineX, y + 34, { width: lineW, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
    .text('Fecha: ___ / ___ / ___', lineX, y + 48, { width: lineW, align: 'center', lineBreak: false });
  return y + 62;
}

function drawPageFooter(doc) {
  const footerH = 24;
  const fy = PAGE.h - footerH;
  drawRect(doc, 0, fy, PAGE.w, footerH, C.navy);
  doc.font('Helvetica').fontSize(7).fillColor('#93c5fd')
    .text('Documento generado electronicamente - Uso interno', M, fy + 8, { width: CW, align: 'center', lineBreak: false });
}

function generarPdfEvidencia(evidencia) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { empleado, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen } = evidencia;

    let y = drawPageHeader(doc);
    y = drawEmployeeCard(doc, y, empleado, evidencia.generadoEn);
    y = drawSummaryRow(doc, y, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen);

    if (induccionEmpresa.habilitada) {
      y = drawSectionHeader(
        doc,
        y,
        'Modulos de induccion',
        induccionEmpresa.completados,
        induccionEmpresa.total,
        induccionEmpresa.completa,
      );
      y = drawChecklistTable(doc, y, induccionEmpresa.modulos);
      y = drawStatusBanner(
        doc,
        y,
        induccionEmpresa.completa,
        'Todos los modulos de induccion a la empresa fueron completados.',
        'Induccion a la empresa incompleta.',
      );
    }

    if (induccionPuesto.habilitada) {
      y = drawSectionHeader(
        doc,
        y,
        'Induccion al puesto',
        induccionPuesto.completados,
        induccionPuesto.total,
        induccionPuesto.completa,
      );
      y = drawChecklistTable(doc, y, induccionPuesto.modulos);
      y = drawStatusBanner(
        doc,
        y,
        induccionPuesto.completa,
        'Todos los modulos de induccion al puesto fueron completados.',
        'Induccion al puesto incompleta.',
      );
    }

    y = drawEvalAndExamRow(doc, y, evaluacionFinal, resumen);
    drawSignature(doc, y);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawPageFooter(doc);
    }

    doc.end();
  });
}

module.exports = { generarPdfEvidencia };
