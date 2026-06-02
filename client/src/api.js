const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function videoStreamUrl(videoId) {
  const token = getToken();
  const base = `/api/videos/${videoId}/stream`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export function setSession(token, user) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearSession() {
  setSession(null, null);
}

async function req(method, path, body, isForm = false) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  const res = await fetch(path, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (res.status === 401) {
    if (data.codigo === 'TOKEN_EXPIRADO' || data.codigo === 'TOKEN_INVALIDO') {
      clearSession();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error(data.mensaje || 'No autenticado');
    }
  }

  if (!res.ok) {
    const err = new Error(data.mensaje || 'Error en la solicitud');
    err.codigo = data.codigo;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  put: (p, b) => req('PUT', p, b),
  del: (p) => req('DELETE', p),
  postForm: (p, fd) => req('POST', p, fd, true),
};

/** Descarga CSV u otro archivo con el token de sesión (un enlace directo no envía Authorization). */
export async function downloadFile(path, filename = 'export.csv') {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { headers });
  if (res.status === 401) {
    clearSession();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  }
  if (!res.ok) {
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      /* respuesta no JSON */
    }
    throw new Error(data.mensaje || `No se pudo exportar el archivo (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function uploadVideo(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos/subir');
    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.round((ev.loaded / ev.total) * 100), ev.loaded, ev.total);
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.mensaje || 'Error al subir'));
      } catch {
        reject(new Error('Error al subir el video'));
      }
    };
    xhr.onerror = () => reject(new Error('Error de red'));
    xhr.send(formData);
  });
}
