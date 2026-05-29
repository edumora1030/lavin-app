// Panel admin
(async function () {
  if (!API.requireAuth()) return;
  let me;
  try { me = await API.get('/api/auth/me'); } catch { return; }
  if (me.rol !== 'admin') { location.href = '/'; return; }
  API.user = me;

  document.querySelectorAll('.admin-sidebar nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      document.querySelectorAll('.admin-sidebar nav a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    });
  });

  window.addEventListener('hashchange', router);
  router();
})();

function router() {
  const hash = location.hash.slice(1) || 'dashboard';
  const map = { dashboard: renderDashboard, usuarios: renderUsuarios, progreso: renderProgreso, modulos: renderModulos, videos: renderVideos, examenes: renderExamenes };
  (map[hash] || renderDashboard)();
}

async function renderDashboard() {
  const main = document.getElementById('adminMain');
  main.innerHTML = `<h1>Dashboard</h1><p>Cargando…</p>`;
  try {
    const d = await API.get('/api/admin/dashboard');
    main.innerHTML = `
      <h1>Dashboard</h1>
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Empleados activos</div><div class="value">${d.totalEmpleados}</div></div>
        <div class="stat-card"><div class="label">Módulos empresa completados</div><div class="value">${d.completadosEmpresa}</div></div>
        <div class="stat-card"><div class="label">Módulos puesto completados</div><div class="value">${d.completadosPuesto}</div></div>
        <div class="stat-card"><div class="label">Exámenes aprobados hoy</div><div class="value" style="color:var(--success)">${d.examenesHoy.aprobados}</div></div>
        <div class="stat-card"><div class="label">Exámenes reprobados hoy</div><div class="value" style="color:var(--danger)">${d.examenesHoy.reprobados}</div></div>
      </div>
      <div class="card">
        <h2>Últimos eventos de auditoría</h2>
        <table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>IP</th></tr></thead>
        <tbody>${d.auditoria.map(l => `<tr>
          <td>${new Date(l.fecha).toLocaleString()}</td>
          <td>${l.usuario ? escapeHtml(l.usuario.nombre)+' ('+escapeHtml(l.usuario.nomina)+')' : '—'}</td>
          <td><code>${escapeHtml(l.accion)}</code></td>
          <td>${escapeHtml(l.ip||'')}</td>
        </tr>`).join('')}</tbody></table>
      </div>`;
  } catch (e) { main.innerHTML = `<p class="error">${e.message}</p>`; }
}

async function renderUsuarios() {
  const main = document.getElementById('adminMain');
  main.innerHTML = `<h1>Usuarios</h1>
    <div class="card">
      <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
        <input id="q" placeholder="Buscar nombre o nómina" style="flex:1; min-width:200px; padding:10px; border:1px solid var(--border); border-radius:8px;">
        <select id="frol" style="padding:10px; border:1px solid var(--border); border-radius:8px;"><option value="">Todos los roles</option><option value="admin">Admin</option><option value="supervisor">Supervisor</option><option value="empleado">Empleado</option></select>
        <button class="btn" id="btnNuevo">+ Nuevo empleado</button>
        <a class="btn secondary" href="/api/admin/reportes/empleados">Exportar CSV</a>
      </div>
      <div id="tablaUsuarios"></div>
    </div>`;
  document.getElementById('btnNuevo').onclick = () => modalNuevoUsuario();
  document.getElementById('q').oninput = recargar;
  document.getElementById('frol').onchange = recargar;
  recargar();
  async function recargar() {
    const q = document.getElementById('q').value;
    const rol = document.getElementById('frol').value;
    const params = new URLSearchParams(); if (q) params.set('q', q); if (rol) params.set('rol', rol);
    const list = await API.get('/api/usuarios?' + params.toString());
    document.getElementById('tablaUsuarios').innerHTML = `
      <table><thead><tr><th>Nómina</th><th>Nombre</th><th>Rol</th><th>Programa</th><th>Alcance</th><th>Activo</th><th>Acciones</th></tr></thead>
      <tbody>${list.map(u => `<tr>
        <td><code>${escapeHtml(u.nomina)}</code></td>
        <td>${escapeHtml(u.nombre)}</td>
        <td>${u.rol}</td>
        <td>${u.programa||'—'}</td>
        <td>${u.alcance||'—'}</td>
        <td>${u.activo?'✓':'✗'}</td>
        <td>
          <button class="btn secondary" onclick="verReporte('${u.id}')">Reporte</button>
          <button class="btn secondary" onclick="resetPwd('${u.id}','${escapeHtml(u.nomina)}')">Reset pwd</button>
          ${u.activo?`<button class="btn danger" onclick="desactivar('${u.id}')">Desactivar</button>`:''}
        </td></tr>`).join('')}</tbody></table>`;
  }
}

window.verReporte = async (id) => {
  const r = await API.get(`/api/usuarios/${id}/reporte`);
  modal(`
    <h2>${escapeHtml(r.nombre)} (${escapeHtml(r.nomina)})</h2>
    <p>Rol: ${r.rol} · Programa: ${r.programa||'—'} · Alcance: ${r.alcance||'—'}</p>
    <h3>Módulos completados</h3>
    <ul>${r.progresos.filter(p=>p.tipo==='modulo_completado'&&p.completado).map(p=>`<li>${escapeHtml(p.modulo.nombre)} — ${new Date(p.fechaCompletado).toLocaleDateString()}</li>`).join('') || '<li>Ninguno</li>'}</ul>
    <h3>Intentos de examen</h3>
    <table><thead><tr><th>Módulo</th><th>Calificación</th><th>Resultado</th><th>Fecha</th></tr></thead>
    <tbody>${r.intentos.map(i => `<tr><td>${escapeHtml(i.examen.modulo.nombre)}</td><td>${i.calificacion}%</td><td>${i.aprobado?'✓':'✗'}</td><td>${i.finalizadoEn?new Date(i.finalizadoEn).toLocaleString():'En curso'}</td></tr>`).join('') || '<tr><td colspan="4">Sin intentos</td></tr>'}</tbody></table>
  `);
};

window.resetPwd = async (id, nomina) => {
  if (!confirm(`Resetear contraseña de ${nomina}?`)) return;
  await API.post(`/api/usuarios/${id}/reset-password`, {});
  alert('Contraseña restablecida. El usuario debe usar la contraseña inicial.');
};

window.desactivar = async (id) => {
  if (!confirm('Desactivar este usuario?')) return;
  await API.del(`/api/usuarios/${id}`);
  renderUsuarios();
};

function modalNuevoUsuario() {
  modal(`
    <h2>Nuevo empleado</h2>
    <form id="formNuevo">
      <div class="form-group"><label>Nombre completo</label><input name="nombre" required></div>
      <div class="form-group"><label>Número de nómina</label><input name="nomina" required></div>
      <div class="form-group"><label>Email (opcional)</label><input name="email" type="email"></div>
      <div class="form-group"><label>Rol</label><select name="rol"><option value="empleado">Empleado</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option></select></div>
      <div class="form-group"><label>Área (opcional)</label><input name="area"></div>
      <div class="modal-actions"><button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button type="submit" class="btn">Crear</button></div>
    </form>
  `);
  document.getElementById('formNuevo').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const u = await API.post('/api/usuarios', body);
      const ult4 = String(u.nomina).slice(-4).padStart(4, '0');
      alert(`Empleado creado. Contraseña inicial: ${ult4}Lavin2024`);
      document.querySelector('.modal-overlay').remove();
      renderUsuarios();
    } catch (e2) { alert(e2.message); }
  };
}

async function renderProgreso() {
  const main = document.getElementById('adminMain');
  main.innerHTML = `<h1>Progreso de empleados</h1><div class="card" id="tabla"></div>`;
  const list = await API.get('/api/progreso/resumen');
  document.getElementById('tabla').innerHTML = `
    <div style="margin-bottom:12px"><a class="btn secondary" href="/api/admin/reportes/empleados">Exportar empleados CSV</a> <a class="btn secondary" href="/api/admin/reportes/examenes">Exportar exámenes CSV</a></div>
    <table><thead><tr><th>Nómina</th><th>Nombre</th><th>Programa</th><th>Módulos completados</th><th></th></tr></thead>
    <tbody>${list.map(u => `<tr><td><code>${escapeHtml(u.nomina)}</code></td><td>${escapeHtml(u.nombre)}</td><td>${u.programa||'—'}</td><td>${u.modulosCompletados}</td><td><button class="btn secondary" onclick="verReporte('${u.id}')">Ver detalle</button></td></tr>`).join('')}</tbody></table>`;
}

async function renderModulos() {
  const main = document.getElementById('adminMain');
  main.innerHTML = `<h1>Módulos y contenido</h1><div id="lista"></div>`;
  const modulos = await API.get('/api/modulos');
  document.getElementById('lista').innerHTML = modulos.map(m => `
    <div class="card">
      <h2>${escapeHtml(m.nombre)} <span class="badge">${m.programa}/${m.alcance}</span></h2>
      <p>${escapeHtml(m.descripcion||'')}</p>
      <details><summary>Ítems (${m.items.length})</summary>
        <ul>${m.items.map(i => `<li><strong>${i.tipo}:</strong> ${escapeHtml(i.titulo)} ${i.archivoUrl?'<a href="'+escapeHtml(i.archivoUrl)+'" target="_blank">[link]</a>':''}</li>`).join('')}</ul>
      </details>
      <button class="btn secondary" onclick="agregarItem('${m.id}')">+ Agregar ítem</button>
    </div>
  `).join('');
}

window.agregarItem = (moduloId) => {
  modal(`
    <h2>Nuevo ítem</h2>
    <form id="formItem">
      <div class="form-group"><label>Tipo</label><select name="tipo"><option value="paso">Paso</option><option value="recurso">Recurso</option></select></div>
      <div class="form-group"><label>Título</label><input name="titulo" required></div>
      <div class="form-group"><label>Descripción</label><textarea name="descripcion" rows="3"></textarea></div>
      <div class="form-group"><label>URL de archivo (PDF, imagen)</label><input name="archivoUrl"></div>
      <div class="form-group"><label>URL de video (puede ser /api/videos/:id/stream)</label><input name="videoUrl"></div>
      <div class="form-group"><label>Orden</label><input name="orden" type="number" value="0"></div>
      <div class="modal-actions"><button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button class="btn" type="submit">Guardar</button></div>
    </form>
  `);
  document.getElementById('formItem').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    body.orden = parseInt(body.orden, 10) || 0;
    await API.post(`/api/modulos/${moduloId}/items`, body);
    document.querySelector('.modal-overlay').remove();
    renderModulos();
  };
};

async function renderVideos() {
  const main = document.getElementById('adminMain');
  main.innerHTML = `
    <h1>Videos</h1>
    <div class="card">
      <h2>Subir video</h2>
      <form id="upForm">
        <div class="form-group"><label>Archivo (mp4, webm, mov — máx 2 GB)</label><input type="file" name="archivo" accept="video/mp4,video/webm,video/quicktime" required></div>
        <div class="form-group"><label>Título</label><input name="titulo" required></div>
        <div class="form-group"><label>Descripción</label><textarea name="descripcion" rows="2"></textarea></div>
        <div class="form-group"><label>Módulo (opcional, slug)</label><input name="moduloSlug" placeholder="cultura-administrativo-empresa"></div>
        <div class="form-group" id="upProgress" style="display:none"><div class="progress-bar"><div id="upBar" style="width:0%"></div></div><div id="upText" style="font-size:13px; margin-top:6px;"></div></div>
        <button class="btn" type="submit">Subir</button>
      </form>
    </div>
    <div id="listaVideos"></div>
  `;
  document.getElementById('upForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos/subir');
    xhr.setRequestHeader('Authorization', `Bearer ${API.token}`);
    document.getElementById('upProgress').style.display = 'block';
    xhr.upload.onprogress = (ev) => {
      const pct = Math.round((ev.loaded / ev.total) * 100);
      document.getElementById('upBar').style.width = pct + '%';
      document.getElementById('upText').textContent = `${pct}% — ${(ev.loaded/1024/1024).toFixed(1)} MB de ${(ev.total/1024/1024).toFixed(1)} MB`;
    };
    xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) renderVideos(); else alert('Error: ' + xhr.responseText); };
    xhr.send(fd);
  };
  const videos = await API.get('/api/videos');
  document.getElementById('listaVideos').innerHTML = `<div class="card"><h2>Videos cargados</h2>
    <table><thead><tr><th>Título</th><th>Tamaño</th><th>Subido</th><th></th></tr></thead>
    <tbody>${videos.map(v => `<tr><td>${escapeHtml(v.titulo)}</td><td>${(Number(v.tamanioBytes)/1024/1024).toFixed(1)} MB</td><td>${new Date(v.subidoEn).toLocaleString()}</td>
    <td><button class="btn secondary" onclick="prevVideo('${v.id}','${escapeHtml(v.titulo)}')">Ver</button> <button class="btn danger" onclick="delVideo('${v.id}')">Eliminar</button></td></tr>`).join('')}</tbody></table></div>`;
}

window.prevVideo = (id, titulo) => modal(`<h2>${escapeHtml(titulo)}</h2><video controls style="width:100%" src="/api/videos/${id}/stream"></video><p style="font-size:13px; color:var(--text-muted)">URL para incrustar: <code>/api/videos/${id}/stream</code></p>`);
window.delVideo = async (id) => { if (!confirm('Eliminar video?')) return; await API.del(`/api/videos/${id}`); renderVideos(); };

async function renderExamenes() {
  const main = document.getElementById('adminMain');
  main.innerHTML = `<h1>Exámenes</h1><div id="ex"></div>`;
  const modulos = await API.get('/api/modulos');
  document.getElementById('ex').innerHTML = modulos.map(m => `
    <div class="card">
      <h2>${escapeHtml(m.nombre)}</h2>
      ${m.examenes && m.examenes.length ? `<p>Examen configurado. <button class="btn secondary" onclick="editarExamen('${m.examenes[0].id}','${m.id}')">Editar preguntas</button></p>` : `<button class="btn" onclick="crearExamen('${m.id}','${escapeHtml(m.nombre)}')">+ Crear examen</button>`}
    </div>`).join('');
}

window.crearExamen = (moduloId, nombreMod) => {
  modal(`
    <h2>Nuevo examen para "${nombreMod}"</h2>
    <form id="formEx">
      <div class="form-group"><label>Título</label><input name="titulo" value="Examen — ${nombreMod}" required></div>
      <div class="form-group"><label>Descripción</label><textarea name="descripcion" rows="2"></textarea></div>
      <div class="form-group"><label>Intentos permitidos</label><input name="intentosPermitidos" type="number" value="3"></div>
      <div class="form-group"><label>Calificación mínima (%)</label><input name="calificacionMinima" type="number" value="70"></div>
      <div class="modal-actions"><button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button type="submit" class="btn">Crear</button></div>
    </form>
  `);
  document.getElementById('formEx').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    body.moduloId = moduloId;
    body.intentosPermitidos = parseInt(body.intentosPermitidos, 10);
    body.calificacionMinima = parseInt(body.calificacionMinima, 10);
    const ex = await API.post('/api/examenes', body);
    // marcar módulo como requiereExamen
    await API.put('/api/modulos/' + moduloId, { requiereExamen: true });
    document.querySelector('.modal-overlay').remove();
    editarExamen(ex.id, moduloId);
  };
};

window.editarExamen = async (examenId, moduloId) => {
  const ex = await API.get('/api/examenes/' + moduloId);
  modal(`
    <h2>Editor de examen</h2>
    <p style="color:var(--text-muted)">${ex.preguntas.length} pregunta(s)</p>
    <ol>${ex.preguntas.map(p => `<li style="margin-bottom:10px">
      <strong>${escapeHtml(p.texto)}</strong>
      <ul>${p.opciones.map(o => `<li>${escapeHtml(o.texto)}</li>`).join('')}</ul>
      <button class="btn danger" onclick="delPreg('${examenId}','${p.id}','${moduloId}')">Eliminar pregunta</button>
    </li>`).join('')}</ol>
    <h3>Agregar pregunta</h3>
    <form id="formPreg">
      <div class="form-group"><label>Texto de la pregunta</label><textarea name="texto" rows="2" required></textarea></div>
      <div id="opciones">
        <div class="form-group"><label>Opción 1 <input type="checkbox" name="c0"> correcta</label><input name="o0" required></div>
        <div class="form-group"><label>Opción 2 <input type="checkbox" name="c1"> correcta</label><input name="o1" required></div>
        <div class="form-group"><label>Opción 3 <input type="checkbox" name="c2"> correcta</label><input name="o2"></div>
        <div class="form-group"><label>Opción 4 <input type="checkbox" name="c3"> correcta</label><input name="o3"></div>
      </div>
      <button class="btn" type="submit">Agregar</button>
    </form>
  `);
  document.getElementById('formPreg').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const opciones = [];
    for (let i = 0; i < 4; i++) {
      const t = fd.get('o'+i);
      if (t) opciones.push({ texto: t, esCorrecta: fd.get('c'+i) === 'on' });
    }
    if (!opciones.some(o => o.esCorrecta)) { alert('Marca al menos una opción correcta.'); return; }
    await API.post(`/api/examenes/${examenId}/preguntas`, { texto: fd.get('texto'), opciones });
    document.querySelector('.modal-overlay').remove();
    editarExamen(examenId, moduloId);
  };
};

window.delPreg = async (examenId, preguntaId, moduloId) => {
  if (!confirm('Eliminar pregunta?')) return;
  await API.del(`/api/examenes/${examenId}/preguntas/${preguntaId}`);
  document.querySelector('.modal-overlay').remove();
  editarExamen(examenId, moduloId);
};

function modal(html) {
  const o = document.createElement('div');
  o.className = 'modal-overlay';
  o.innerHTML = `<div class="modal">${html}</div>`;
  o.addEventListener('click', (e) => { if (e.target === o) o.remove(); });
  document.body.appendChild(o);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
