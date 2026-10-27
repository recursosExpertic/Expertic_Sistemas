// Enrutador por hash (#/, #/nueva, #/asignatura/12, #/guia).
// Permite usar los botones atrás/adelante del navegador y compartir enlaces.
import { confirmDialog } from './dom.js';

const routes = [];
let cleanup = null;
let leaveGuard = null;   // () => boolean: true si hay cambios sin guardar
let currentHash = '';
let ignoreNext = false;

export function route(pattern, handler) {
  // '/asignatura/:id' → /^\/asignatura\/([^/]+)$/
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ regex, keys, handler });
}

export const navigate = path => { location.hash = '#' + path; };

/** La vista de edición registra aquí si tiene cambios sin guardar. */
export const setLeaveGuard = fn => { leaveGuard = fn; };

async function resolve() {
  if (ignoreNext) {
    ignoreNext = false;
    return;
  }
  if (leaveGuard?.()) {
    const leave = await confirmDialog('Tienes cambios sin guardar. Si sales ahora se perderán.', {
      title: '¿Salir sin guardar?', okText: 'Salir sin guardar', danger: true,
    });
    if (!leave) {
      ignoreNext = true;
      location.hash = currentHash;
      return;
    }
  }

  currentHash = location.hash || '#/';
  const path = currentHash.slice(1) || '/';
  const container = document.getElementById('view');

  cleanup?.();
  cleanup = null;
  leaveGuard = null;

  for (const { regex, keys, handler } of routes) {
    const match = path.match(regex);
    if (!match) continue;
    const params = Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
    container.replaceChildren();
    window.scrollTo(0, 0);
    cleanup = (await handler(container, params)) ?? null;
    return;
  }
  navigate('/');
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  window.addEventListener('beforeunload', e => {
    if (leaveGuard?.()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  resolve();
}
