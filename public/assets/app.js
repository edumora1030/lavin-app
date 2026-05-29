// App del empleado — diseño HTML + API
let me = null;

(async function init() {
  if (!API.requireAuth()) return;

  try {
    me = await API.get('/api/auth/me');
    API.user = { ...API.user, ...me };
  } catch (e) { return; }

  if (me.rol === 'admin') {
    location.href = '/admin/';
    return;
  }

  document.getElementById('btnLogout').addEventListener('click', () => API.logout());
  document.getElementById('btnChangeProfile').addEventListener('click', () => {
    renderGate(document.getElementById('mainContent'), me, true);
  });

  const main = document.getElementById('mainContent');
  if (!me.programa || !me.alcance) {
    renderGate(main, me, false);
    return;
  }

  await renderApp(main, me);
})();

function setAppChrome(visible) {
  document.getElementById('appHeader').classList.toggle('hidden', !visible);
  document.getElementById('appFooter').classList.toggle('hidden', !visible);
}

function renderGate(main, user, changeOnly) {
  setAppChrome(false);
  let currentProgram = user.programa || null;

  main.innerHTML = `
    <div class="gate-inline">
      <div class="gate-panel">
        <div class="gate-logo">
          <div class="logo-icon" aria-hidden="true"></div>
          <div>
            <span class="logo-text">Recursos Humanos</span>
            <span class="logo-sub">Programa de inducción</span>
          </div>
        </div>
        <div class="user-summary"><strong>${escapeHtml(user.nombre)}</strong> · Nómina ${escapeHtml(user.nomina)}</div>

        <div id="gateStepProgram" class="gate-step-profile is-visible">
          <h2 class="profile-picker-title">Selecciona tu programa</h2>
          <p class="profile-picker-desc">Elige el programa que corresponde a tu perfil.</p>
          <div class="profile-grid">
            <button type="button" class="profile-option profile-option--admin" data-program="administrativo">
              <span class="profile-option-icon" aria-hidden="true">💼</span>
              <h3>Programa de Inducción Administrativo</h3>
            </button>
            <button type="button" class="profile-option profile-option--operativo" data-program="operativo">
              <span class="profile-option-icon" aria-hidden="true">🏭</span>
              <h3>Programa de Inducción Operativo</h3>
            </button>
          </div>
        </div>

        <div id="gateStepScope" class="gate-step-scope">
          <h2 class="profile-picker-title">¿Qué inducción deseas realizar?</h2>
          <p class="profile-picker-desc" id="scopeProgramLabel"></p>
          <div class="profile-grid">
            <button type="button" class="profile-option profile-option--scope" data-scope="empresa">
              <span class="profile-option-icon" aria-hidden="true">🏢</span>
              <h3>Inducción a la empresa</h3>
              <p>Cultura Lavín, políticas corporativas y procesos generales de la organización.</p>
            </button>
            <button type="button" class="profile-option profile-option--scope" data-scope="puesto">
              <span class="profile-option-icon" aria-hidden="true">📋</span>
              <h3>Inducción al puesto</h3>
              <p>Funciones de tu área, herramientas del rol y actividades específicas de tu puesto.</p>
            </button>
          </div>
          <button type="button" class="btn-text" id="btnBackProgram" style="margin-top:1.25rem;">← Elegir otro programa</button>
        </div>
      </div>
    </div>
  `;

  const stepProgram = main.querySelector('#gateStepProgram');
  const stepScope = main.querySelector('#gateStepScope');

  function showProgram() {
    stepProgram.classList.add('is-visible');
    stepScope.classList.remove('is-visible');
  }

  function showScope(program) {
    currentProgram = program;
    const meta = PROGRAM_META[program];
    main.querySelector('#scopeProgramLabel').textContent = meta.programName;
    stepProgram.classList.remove('is-visible');
    stepScope.classList.add('is-visible');
  }

  main.querySelectorAll('[data-program]').forEach((btn) => {
    btn.addEventListener('click', () => showScope(btn.dataset.program));
  });

  main.querySelector('#btnBackProgram').addEventListener('click', showProgram);

  main.querySelectorAll('[data-scope]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await API.put('/api/auth/me', { programa: currentProgram, alcance: btn.dataset.scope });
        me = await API.get('/api/auth/me');
        API.user = me;
        await renderApp(main, me);
      } catch (e) {
        alert(e.message);
      }
    });
  });

  if (currentProgram && changeOnly) showScope(currentProgram);
  else showProgram();
}

async function renderApp(main, user) {
  setAppChrome(true);
  main.innerHTML = '<div class="hero"><div class="hero-inner"><p>Cargando…</p></div></div>';

  const [modulos, progreso] = await Promise.all([
    API.get('/api/modulos'),
    API.get('/api/progreso'),
  ]);

  const hero = HERO_COPY[user.programa]?.[user.alcance] || {};
  const meta = PROGRAM_META[user.programa] || {};
  const firstName = user.nombre.split(' ')[0];
  const badge = document.getElementById('profileBadge');
  badge.textContent = `${meta.label} · ${hero.scopeLabel || ''}`;
  badge.className = 'profile-badge' + (hero.badgeClass ? ' ' + hero.badgeClass : '');

  const modulosCompletados = modulos.filter((m) =>
    progreso.some((p) => p.moduloId === m.id && p.tipo === 'modulo_completado' && p.completado)
  ).length;
  const pct = modulos.length ? Math.round((modulosCompletados / modulos.length) * 100) : 0;
  const recorridoHecho = progreso.some((p) => p.tipo === 'recorrido_planta' && p.completado);

  const modulosBySection = {};
  modulos.forEach((m) => {
    const sec = slugToSection(m.slug);
    modulosBySection[sec] = m;
  });

  const progressTags = ['cultura', 'politicas', 'herramientas'].map((id) => {
    const m = modulosBySection[id];
    const done = m && progreso.some((p) => p.moduloId === m.id && p.tipo === 'modulo_completado' && p.completado);
    const label = MODULE_SECTION[id]?.label || id;
    return `<span class="progress-module-tag${done ? ' is-done' : ''}">${label}${done ? ' ✓' : ''}</span>`;
  }).join('');

  main.innerHTML = `
    <section class="hero" id="inicio">
      <div class="hero-inner">
        <span class="hero-badge">${escapeHtml(firstName ? `${hero.heroBadge} · ${firstName}` : hero.heroBadge || 'Bienvenido/a')}</span>
        <h1>${escapeHtml(hero.heroTitle || 'Tu proceso de inducción')}</h1>
        <p>${escapeHtml(hero.heroDesc || '')}</p>
        <div class="hero-actions">
          <a href="#cultura" class="btn btn-primary">Comenzar inducción</a>
          <a href="#herramientas" class="btn btn-outline">Ver checklist</a>
        </div>
      </div>
    </section>
    <div class="empleado-main">
      <div class="progress-card" role="region" aria-label="Progreso de inducción">
        <div class="progress-header">
          <h2>Tu avance en la inducción</h2>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <p class="progress-note">${modulosCompletados === modulos.length && modulos.length
    ? '¡Felicidades! Completaste todos los módulos de inducción.'
    : `Módulos completados: ${modulosCompletados} de ${modulos.length}. Revisa cada sección y presiona Finalizar.`}</p>
        <div class="progress-modules">${progressTags}</div>
      </div>
      <div id="modulosWrap"></div>
      <section class="section" id="contacto">
        <div class="section-header">
          <p class="section-label">Contacto</p>
          <h2 class="section-title">¿Necesitas ayuda?</h2>
          <p class="section-desc">El equipo de Recursos Humanos está para apoyarte durante todo tu proceso de integración.</p>
        </div>
        <div class="contact-grid">
          <div class="contact-card">
            <h3>Nómina, vacaciones, contrataciones, etc.</h3>
            <a href="mailto:dbajonero@lavin.com.mx">dbajonero@lavin.com.mx</a>
            <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 221 y 112</a>
          </div>
          <div class="contact-card">
            <h3>Capacitación y Sistegrama</h3>
            <a href="mailto:ljuarez@lavin.com.mx">ljuarez@lavin.com.mx</a>
            <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 117</a>
          </div>
          <div class="contact-card">
            <h3>Administración de personal</h3>
            <a href="mailto:sperez@lavin.com.mx">sperez@lavin.com.mx</a>
            <a href="mailto:ycalderon@lavin.com.mx">ycalderon@lavin.com.mx</a>
            <a href="tel:+527773330300">+52 (777) 333-03-00 Ext. 281 y 136</a>
          </div>
        </div>
      </section>
    </div>
  `;

  const wrap = main.querySelector('#modulosWrap');
  const order = ['cultura', 'politicas', 'herramientas'];
  for (const sec of order) {
    const modulo = modulosBySection[sec];
    if (modulo) wrap.appendChild(buildModuloSection(modulo, progreso, sec === 'cultura', recorridoHecho));
  }

  if (modulosBySection.herramientas) {
    const checklistBlock = document.createElement('div');
    checklistBlock.style.paddingTop = '3rem';
    checklistBlock.innerHTML = `
      <div class="section-header">
        <p class="section-label">Checklist</p>
        <h2 class="section-title">Actividad presencial</h2>
        <p class="section-desc">Marca esta actividad cuando hayas realizado el recorrido por la planta.</p>
      </div>
      <div class="checklist">
        <ul>
          <li>
            <input type="checkbox" id="recorrido-planta" ${recorridoHecho ? 'checked disabled' : ''}>
            <label for="recorrido-planta">Recorrido por la planta</label>
          </li>
        </ul>
      </div>
    `;
    wrap.querySelector('#herramientas')?.appendChild(checklistBlock);
    const cb = checklistBlock.querySelector('#recorrido-planta');
    if (cb && !recorridoHecho) {
      cb.addEventListener('change', async () => {
        if (!cb.checked) return;
        try {
          await API.post('/api/progreso/recorrido', {});
          cb.disabled = true;
        } catch (e) {
          alert(e.message);
          cb.checked = false;
        }
      });
    }
  }
}

function buildModuloSection(modulo, progreso, isCultura, recorridoHecho) {
  const sec = slugToSection(modulo.slug);
  const sectionInfo = MODULE_SECTION[sec] || { label: modulo.nombre, anchor: sec };
  const mProgreso = progreso.filter((p) => p.moduloId === modulo.id);
  const idsVistos = new Set(mProgreso.filter((p) => p.tipo === 'item_visto' && p.completado).map((p) => p.itemId));
  const moduloCompletado = !!mProgreso.find((p) => p.tipo === 'modulo_completado' && p.completado);
  const pasos = modulo.items.filter((i) => i.tipo === 'paso');
  const recursos = modulo.items.filter((i) => i.tipo === 'recurso');
  const totalTrack = modulo.items.length;
  const viewed = modulo.items.filter((i) => idsVistos.has(i.id)).length;
  const todosVistos = totalTrack > 0 && viewed >= totalTrack;

  const section = document.createElement('section');
  section.className = 'section' + (moduloCompletado ? ' module-complete' : '');
  section.id = sectionInfo.anchor;
  section.setAttribute('data-section', sec);

  const stepsHtml = pasos.map((item, i) => {
    const visto = idsVistos.has(item.id);
    const num = String(i + 1).padStart(2, '0');
    return `
      <article class="step-card module-trackable${visto ? ' is-viewed' : ''}" data-item-id="${item.id}" data-modulo-id="${modulo.id}" tabindex="0" role="button">
        <div class="step-num">${num}</div>
        <h3>${escapeHtml(item.titulo)}</h3>
        <p>${escapeHtml(item.descripcion || '')}</p>
        ${item.archivoUrl ? `<a href="${escapeHtml(item.archivoUrl)}" class="step-link" target="_blank" rel="noopener" onclick="event.stopPropagation()">Ver recurso →</a>` : '<span class="step-link">Marcar como revisado →</span>'}
        ${item.videoUrl ? `<div class="item-video"><video controls preload="metadata" src="${escapeHtml(item.videoUrl)}"></video></div>` : ''}
      </article>
    `;
  }).join('');

  const resourcesHtml = recursos.map((item) => {
    const visto = idsVistos.has(item.id);
    let icon = '📄';
    let span = item.descripcion || (item.archivoUrl ? 'Ver documento' : 'Material de apoyo');
    if (item.descripcion && item.descripcion.startsWith('icon:')) {
      const parts = item.descripcion.slice(5).split('|');
      icon = parts[0] || '📄';
      span = parts[1] || span;
    }
    return `
      <div class="resource-item module-trackable${visto ? ' is-viewed' : ''}" data-item-id="${item.id}" data-modulo-id="${modulo.id}" tabindex="0" role="button">
        <div class="resource-icon">${icon}</div>
        <div>
          <h3>${escapeHtml(item.titulo)}</h3>
          <span>${escapeHtml(span)}</span>
          ${item.archivoUrl ? `<a href="${escapeHtml(item.archivoUrl)}" target="_blank" rel="noopener" class="step-link" style="display:block;margin-top:0.35rem" onclick="event.stopPropagation()">Abrir →</a>` : ''}
        </div>
      </div>
    `;
  }).join('');

  section.innerHTML = `
    <div class="section-header">
      <p class="section-label">${escapeHtml(sectionInfo.label)}</p>
      <h2 class="section-title">${escapeHtml(modulo.nombre.replace(/^[^:]+:\s*/, '') || sectionInfo.label)}</h2>
      <p class="section-desc">${escapeHtml(modulo.descripcion || '')}</p>
    </div>
    ${isCultura ? `<div class="module-tabs"><a href="#cultura" class="module-tab">Etapas</a><a href="#cultura-recursos" class="module-tab">Materiales</a></div>` : ''}
    <p class="module-progress-hint">Revisado: ${viewed} de ${totalTrack} elementos</p>
    <div class="steps-grid">${stepsHtml || '<p style="color:var(--slate-500)">Sin etapas configuradas.</p>'}</div>
    ${recursos.length ? `<div id="${isCultura ? 'cultura-recursos' : ''}" style="padding-top:2rem;"><h3 class="section-title" style="font-size:1.25rem;margin-bottom:1rem;">Materiales</h3><div class="resources-grid">${resourcesHtml}</div></div>` : ''}
    <div class="module-footer${moduloCompletado ? ' is-complete' : ''}">
      <p class="module-view-hint">Haz clic en cada etapa y material para marcarlos como revisados. Al terminar, podrás finalizar el módulo.</p>
      ${modulo.examenes?.length ? `<button type="button" class="btn secondary verExamen" style="margin-bottom:0.5rem">Realizar examen</button>` : ''}
      <button type="button" class="btn module-finish-btn" ${todosVistos && !moduloCompletado ? '' : 'disabled'}>${moduloCompletado ? 'Módulo finalizado' : 'Finalizar módulo'}</button>
      <p class="module-done-msg${moduloCompletado ? '' : ' hidden'}">Módulo de ${escapeHtml(sectionInfo.label)} completado</p>
    </div>
  `;
  section.querySelectorAll('.module-trackable').forEach((el) => {
    const activate = async (e) => {
      if (e.target.closest('a')) return;
      const itemId = el.dataset.itemId;
      const moduloId = el.dataset.moduloId;
      if (el.classList.contains('is-viewed')) return;
      try {
        await API.post('/api/progreso/item', { itemId, moduloId });
        el.classList.add('is-viewed');
        const hint = section.querySelector('.module-progress-hint');
        const v = section.querySelectorAll('.is-viewed').length;
        const t = section.querySelectorAll('.module-trackable').length;
        if (hint) hint.textContent = `Revisado: ${v} de ${t} elementos`;
        const btn = section.querySelector('.module-finish-btn');
        if (btn && v >= t) btn.disabled = false;
      } catch (err) {
        alert(err.message);
      }
    };
    el.addEventListener('click', activate);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); }
    });
  });

  const finishBtn = section.querySelector('.module-finish-btn');
  if (finishBtn && !moduloCompletado) {
    finishBtn.addEventListener('click', async () => {
      try {
        await API.post('/api/progreso/modulo', { moduloId: modulo.id });
        location.reload();
      } catch (e) { alert(e.message); }
    });
  }

  const btnEx = section.querySelector('.verExamen');
  if (btnEx) btnEx.addEventListener('click', () => abrirExamen(modulo.id));

  return section;
}

async function abrirExamen(moduloId) {
  try {
    const examen = await API.get(`/api/examenes/${moduloId}`);
    if (examen.yaAprobado) { alert('Ya aprobaste este examen.'); return; }
    if (examen.intentosRestantes <= 0) { alert('Se agotaron los intentos. Contacta a RR.HH.'); return; }
    const intento = await API.post(`/api/examenes/${examen.id}/iniciar`, {});
    renderModalExamen(examen, intento.intentoId);
  } catch (e) { alert(e.message); }
}

function renderModalExamen(examen, intentoId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>${escapeHtml(examen.titulo)}</h2>
      <p style="color:var(--text-muted)">${escapeHtml(examen.descripcion)} · Mínimo aprobatorio: ${examen.calificacionMinima}%</p>
      <form id="examForm">
        ${examen.preguntas.map((p, i) => `
          <div class="form-group" style="margin-top:16px">
            <div style="font-weight:600; margin-bottom:8px">${i + 1}. ${escapeHtml(p.texto)}</div>
            ${p.opciones.map((o) => `
              <label style="display:flex; gap:8px; padding:8px; border-radius:6px; cursor:pointer;">
                <input type="radio" name="q_${p.id}" value="${o.id}" required>
                <span>${escapeHtml(o.texto)}</span>
              </label>
            `).join('')}
          </div>
        `).join('')}
        <div class="modal-actions">
          <button type="button" class="btn secondary" id="cancelEx">Cancelar</button>
          <button type="submit" class="btn">Enviar examen</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelEx').onclick = () => overlay.remove();
  overlay.querySelector('#examForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const respuestas = {};
    examen.preguntas.forEach((p) => {
      const sel = overlay.querySelector(`input[name="q_${p.id}"]:checked`);
      if (sel) respuestas[p.id] = sel.value;
    });
    try {
      const r = await API.post(`/api/examenes/${examen.id}/enviar`, { intentoId, respuestas });
      overlay.remove();
      alert(`Resultado: ${r.correctas}/${r.total} (${r.calificacion}%) — ${r.aprobado ? '✓ APROBADO' : '✗ No aprobado'}`);
      location.reload();
    } catch (e2) { alert(e2.message); }
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
