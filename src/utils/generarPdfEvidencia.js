const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PAGE = { w: 595.28, h: 841.89 };
const M = 40;
const CW = PAGE.w - M * 2;

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

function truncate(str, max) {
  if (!str || str.length <= max) return str || '';
  return `${str.slice(0, max - 1)}…`;
}

function ensureSpace(doc, y, needed) {
  if (y + needed <= PAGE.h - M) return y;
  doc.addPage();
  return M;
}

function drawRect(doc, x, y, w, h, fill, stroke) {
  if (fill) {
    doc.save().rect(x, y, w, h).fill(fill).restore();
  }
  if (stroke) {
    doc.save().rect(x, y, w, h).strokeColor(stroke).lineWidth(0.5).stroke().restore();
  }
}

function drawHeader(doc) {
  drawRect(doc, 0, 0, PAGE.w, 88, C.navy);

  const logoExists = fs.existsSync(LOGO_PATH);
  if (logoExists) {
    try {
      doc.image(LOGO_PATH, M, 18, { width: 52, height: 52 });
    } catch {
      drawLogoFallback(doc, M, 22);
    }
  } else {
    drawLogoFallback(doc, M, 22);
  }

  const tx = logoExists ? M + 62 : M + 48;
  doc.font('Helvetica-Bold').fontSize(17).fillColor(C.white)
    .text('Hoja de evidencia de inducción', tx, 24, { width: CW - 62 });
  doc.font('Helvetica').fontSize(10).fillColor('#93c5fd')
    .text('Industrias Lavín · Recursos Humanos', tx, 48, { width: CW - 62 });

  return 104;
}

function drawLogoFallback(doc, x, y) {
  drawRect(doc, x, y, 40, 40, C.navyMid, C.blue);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white)
    .text('LAVIN', x, y + 14, { width: 40, align: 'center' });
}

function drawEmployeeCard(doc, y, empleado, generadoEn) {
  const cardH = 72;
  y = ensureSpace(doc, y, cardH + 16);
  drawRect(doc, M, y, CW, cardH, C.blueLight, C.border);

  const cols = [
    { label: 'Colaborador', value: empleado.nombre },
    { label: 'Nómina', value: empleado.nomina },
    { label: 'Programa', value: fmtPrograma(empleado.programa) },
    { label: 'Área', value: empleado.area || 'Sin área asignada' },
    { label: 'Fecha de emisión', value: fmtFecha(generadoEn) },
  ];

  const colW = CW / 2;
  cols.forEach((item, i) => {
    const cx = M + (i % 2) * colW + 14;
    const cy = y + 12 + Math.floor(i / 2) * 28;
    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate).text(item.label.toUpperCase(), cx, cy);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text)
      .text(truncate(String(item.value), 42), cx, cy + 11, { width: colW - 28 });
  });

  return y + cardH + 18;
}

function drawSummaryRow(doc, y, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen) {
  const boxH = 52;
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
    doc.font('Helvetica').fontSize(7.5).fillColor(C.slate)
      .text(box.label.toUpperCase(), bx + 12, y + 10, { width: boxW - 18 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.text)
      .text(box.value, bx + 12, y + 26, { width: boxW - 18 });
  });

  return y + boxH + 18;
}

function drawSectionHeader(doc, y, title, completados, total, completa) {
  y = ensureSpace(doc, y, 36);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.navyMid).text(title, M, y);
  const badge = `${completados}/${total} módulos`;
  const badgeW = doc.widthOfString(badge) + 16;
  const badgeX = M + CW - badgeW;
  drawRect(doc, badgeX, y - 2, badgeW, 18, completa ? C.successBg : '#fff7ed', completa ? C.success : C.warning);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(completa ? C.success : C.warning)
    .text(badge, badgeX + 8, y + 3);

  return y + 22;
}

function drawChecklistTable(doc, y, modulos) {
  const cols = [
    { key: 'num', label: '#', w: 24, align: 'center' },
    { key: 'nombre', label: 'Módulo', w: 198 },
    { key: 'check', label: '', w: 28, align: 'center' },
    { key: 'fecha', label: 'Fecha', w: 72 },
    { key: 'cal', label: 'Calificación', w: CW - 24 - 198 - 28 - 72 },
  ];

  const headerH = 22;
  y = ensureSpace(doc, y, headerH + 20);

  let x = M;
  drawRect(doc, M, y, CW, headerH, C.navyMid);
  cols.forEach((col) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white)
      .text(col.label, x + 6, y + 7, { width: col.w - 10, align: col.align || 'left' });
    x += col.w;
  });
  y += headerH;

  if (!modulos.length) {
    drawRect(doc, M, y, CW, 24, C.white, C.border);
    doc.font('Helvetica').fontSize(9).fillColor(C.slate)
      .text('Sin módulos registrados', M + 10, y + 8);
    return y + 24;
  }

  modulos.forEach((modulo, idx) => {
    const nombreLines = doc.font('Helvetica').fontSize(8.5).heightOfString(modulo.nombre, { width: cols[1].w - 12 });
    const calText = fmtCalificacion(modulo);
    const calLines = doc.heightOfString(calText, { width: cols[4].w - 12 });
    const rowH = Math.max(22, nombreLines + 10, calLines + 10);

    y = ensureSpace(doc, y, rowH);
    if (y === M) {
      x = M;
      drawRect(doc, M, y, CW, headerH, C.navyMid);
      cols.forEach((col) => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white)
          .text(col.label, x + 6, y + 7, { width: col.w - 10, align: col.align || 'left' });
        x += col.w;
      });
      y += headerH;
    }

    const bg = idx % 2 === 0 ? C.white : C.rowAlt;
    drawRect(doc, M, y, CW, rowH, bg, C.border);

    x = M;
    doc.font('Helvetica').fontSize(8.5).fillColor(C.slate)
      .text(String(idx + 1), x, y + (rowH - 10) / 2, { width: cols[0].w, align: 'center' });
    x += cols[0].w;

    doc.font('Helvetica').fontSize(8.5).fillColor(C.text)
      .text(modulo.nombre, x + 6, y + 6, { width: cols[1].w - 12 });
    x += cols[1].w;

    const cx = x + cols[2].w / 2;
    const cy = y + rowH / 2;
    if (modulo.completado) {
      doc.save().circle(cx, cy, 7).fill(C.success).restore();
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white)
        .text('✓', cx - 4.5, cy - 5, { lineBreak: false });
    } else {
      doc.save().circle(cx, cy, 7).lineWidth(1).strokeColor(C.border).stroke().restore();
    }
    x += cols[2].w;

    doc.font('Helvetica').fontSize(8).fillColor(C.slate)
      .text(fmtFecha(modulo.fechaCompletado), x + 6, y + (rowH - 10) / 2, { width: cols[3].w - 12 });
    x += cols[3].w;

    const calColor = modulo.esEvaluacionFinal
      ? (modulo.completado ? C.success : C.warning)
      : (modulo.aprobado || (!modulo.requiereExamen && modulo.completado) ? C.success : C.text);
    doc.font('Helvetica').fontSize(8).fillColor(calColor)
      .text(calText, x + 6, y + 6, { width: cols[4].w - 12 });

    y += rowH;
  });

  return y + 10;
}

function drawStatusBanner(doc, y, completa, labelCompleto, labelIncompleto) {
  const h = 24;
  y = ensureSpace(doc, y, h + 8);
  const bg = completa ? C.successBg : '#fff7ed';
  const color = completa ? C.success : C.warning;
  drawRect(doc, M, y, CW, h, bg, color);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(color)
    .text(completa ? labelCompleto : labelIncompleto, M + 12, y + 7, { width: CW - 24 });
  return y + h + 14;
}

function drawEvalFinal(doc, y, evaluacionFinal) {
  y = ensureSpace(doc, y, 60);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.navyMid).text('Evaluación final del programa', M, y);
  y += 20;

  if (!evaluacionFinal) {
    doc.font('Helvetica').fontSize(9).fillColor(C.slate).text('No aplica.', M, y);
    return y + 20;
  }

  drawRect(doc, M, y, CW, 44, C.rowAlt, C.border);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
    .text(evaluacionFinal.nombre, M + 12, y + 10);
  doc.font('Helvetica').fontSize(8.5).fillColor(C.slate)
    .text(
      `Estado: ${evaluacionFinal.completada ? 'Completada' : 'Pendiente'}  ·  Fecha: ${fmtFecha(evaluacionFinal.fechaCompletado)}`,
      M + 12,
      y + 26,
    );
  return y + 58;
}

function drawExamSummary(doc, y, resumen) {
  if (!resumen.totalExamenes) return y;
  y = ensureSpace(doc, y, 40);
  drawRect(doc, M, y, CW, 36, C.blueLight, C.border);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.navyMid)
    .text('Resumen de exámenes', M + 12, y + 8);
  doc.font('Helvetica').fontSize(8.5).fillColor(C.text)
    .text(
      `Aprobados: ${resumen.examenesAprobados} de ${resumen.totalExamenes}   ·   Promedio: ${resumen.promedioExamenes ?? 0}%`,
      M + 12,
      y + 22,
    );
  return y + 48;
}

function drawSignature(doc, y) {
  y = ensureSpace(doc, y, 60);
  const lineW = 220;
  const lineX = M + (CW - lineW) / 2;
  doc.moveTo(lineX, y + 30).lineTo(lineX + lineW, y + 30).strokeColor(C.slate).lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(9).fillColor(C.slate)
    .text('Firma de Recursos Humanos', lineX, y + 36, { width: lineW, align: 'center' });
  doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
    .text('Documento generado electrónicamente · Uso interno', M, y + 52, { width: CW, align: 'center' });
  return y + 70;
}

function generarPdfEvidencia(evidencia) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { empleado, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen } = evidencia;

    let y = drawHeader(doc);
    y = drawEmployeeCard(doc, y, empleado, evidencia.generadoEn);
    y = drawSummaryRow(doc, y, induccionEmpresa, induccionPuesto, evaluacionFinal, resumen);

    if (induccionEmpresa.habilitada) {
      y = drawSectionHeader(
        doc,
        y,
        'Inducción a la empresa',
        induccionEmpresa.completados,
        induccionEmpresa.total,
        induccionEmpresa.completa,
      );
      y = drawChecklistTable(doc, y, induccionEmpresa.modulos);
      y = drawStatusBanner(
        doc,
        y,
        induccionEmpresa.completa,
        'Todos los módulos de inducción a la empresa fueron completados.',
        'Inducción a la empresa incompleta.',
      );
    }

    if (induccionPuesto.habilitada) {
      y = drawSectionHeader(
        doc,
        y,
        'Inducción al puesto',
        induccionPuesto.completados,
        induccionPuesto.total,
        induccionPuesto.completa,
      );
      y = drawChecklistTable(doc, y, induccionPuesto.modulos);
      y = drawStatusBanner(
        doc,
        y,
        induccionPuesto.completa,
        'Todos los módulos de inducción al puesto fueron completados.',
        'Inducción al puesto incompleta.',
      );
    }

    y = drawEvalFinal(doc, y, evaluacionFinal);
    y = drawExamSummary(doc, y, resumen);
    drawSignature(doc, y);

    doc.end();
  });
}

module.exports = { generarPdfEvidencia };
