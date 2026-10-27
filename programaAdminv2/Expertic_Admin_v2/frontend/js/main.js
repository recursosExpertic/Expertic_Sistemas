import { api, setUnauthorizedHandler } from './api.js';
import { route, startRouter } from './router.js';
import { renderList } from './views/list.js';
import { renderCreate } from './views/create.js';
import { renderEdit } from './views/edit.js';
import { renderGuide } from './views/guide.js';

// --- Login -------------------------------------------------------------------
function askForLogin() {
  const dialog = document.getElementById('loginDialog');
  const form = document.getElementById('loginForm');
  const input = document.getElementById('loginPassword');
  const error = document.getElementById('loginError');

  return new Promise(resolve => {
    error.hidden = true;
    input.value = '';
    dialog.oncancel = e => e.preventDefault(); // no se puede cerrar sin entrar
    form.onsubmit = async e => {
      e.preventDefault();
      try {
        await api.login(input.value);
        dialog.close();
        resolve();
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
        input.select();
      }
    };
    dialog.showModal();
    input.focus();
  });
}
setUnauthorizedHandler(askForLogin);

// --- Menú activo ---------------------------------------------------------------
function highlightNav() {
  const hash = location.hash || '#/';
  const current = hash.startsWith('#/nueva') ? 'create' : hash.startsWith('#/guia') ? 'guide' : 'list';
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === current));
}
window.addEventListener('hashchange', highlightNav);

// --- Rutas -------------------------------------------------------------------
route('/', renderList);
route('/nueva', renderCreate);
route('/asignatura/:id', renderEdit);
route('/guia', renderGuide);

// --- Arranque ----------------------------------------------------------------
try {
  const session = await api.session();
  const badge = document.getElementById('dbBadge');
  badge.textContent = `BD: ${session.database}`;
  badge.hidden = false;
  if (session.authRequired && !session.authenticated) await askForLogin();
} catch {
  // Si el servidor no responde, cada vista mostrará su propio error.
}
highlightNav();
startRouter();
