// Cliente de la API. El navegador NUNCA ve el token de la base de datos:
// solo habla con nuestro backend en /api.

const TOKEN_KEY = 'expertic_admin_token';

const storage = {
  get() { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(TOKEN_KEY, v); } catch { /* sin almacenamiento */ } },
  clear() { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ } },
};

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.status = status;
    this.details = details ?? [];
  }
}

// main.js registra aquí la función que muestra el diálogo de login.
let onUnauthorized = null;
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

async function request(method, path, body, retried = false) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = storage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('No hay conexión con el servidor. ¿Está corriendo "npm start"?', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login' && onUnauthorized && !retried) {
    storage.clear();
    await onUnauthorized();
    return request(method, path, body, true);
  }
  if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status, data.details);
  return data;
}

export const api = {
  session: () => request('GET', '/session'),
  async login(password) {
    const { token } = await request('POST', '/login', { password });
    storage.set(token);
  },
  listAsignaturas: (q = '') => request('GET', `/asignaturas${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getAsignatura: id => request('GET', `/asignaturas/${id}`),
  createAsignatura: data => request('POST', '/asignaturas', data),
  saveContenido: (id, payload) => request('PUT', `/asignaturas/${id}/contenido`, payload),
  deleteAsignatura: id => request('DELETE', `/asignaturas/${id}`),
};
