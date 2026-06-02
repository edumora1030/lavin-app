// Cliente HTTP minimalista compartido por todas las páginas
const API = {
  get token() { return sessionStorage.getItem('token'); },
  set token(v) { v ? sessionStorage.setItem('token', v) : sessionStorage.removeItem('token'); },
  get user() { try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch { return null; } },
  set user(v) { v ? sessionStorage.setItem('user', JSON.stringify(v)) : sessionStorage.removeItem('user'); },

  async req(method, path, body, isForm = false) {
    const headers = {};
    if (!isForm) headers['Content-Type'] = 'application/json';
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const opts = { method, headers };
    if (body) opts.body = isForm ? body : JSON.stringify(body);

    const res = await fetch(path, opts);
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (res.status === 401) {
      if (data.codigo === 'TOKEN_EXPIRADO' || data.codigo === 'TOKEN_INVALIDO') {
        this.token = null; this.user = null;
        if (!location.pathname.endsWith('/login.html')) location.href = '/login.html';
        throw new Error(data.mensaje || 'No autenticado');
      }
    }
    if (!res.ok) {
      const err = new Error(data.mensaje || 'Error en la solicitud');
      err.codigo = data.codigo;
      if (data.nombre) err.nombre = data.nombre;
      if (data.rol) err.rol = data.rol;
      throw err;
    }
    return data;
  },

  get(p) { return this.req('GET', p); },
  post(p, b) { return this.req('POST', p, b); },
  put(p, b) { return this.req('PUT', p, b); },
  del(p) { return this.req('DELETE', p); },
  postForm(p, fd) { return this.req('POST', p, fd, true); },

  logout() {
    this.token = null; this.user = null;
    location.href = '/login.html';
  },

  requireAuth() {
    if (!this.token) { location.href = '/login.html'; return false; }
    return true;
  },
};
