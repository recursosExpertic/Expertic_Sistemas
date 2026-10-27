import { api } from '../api.js';
import { confirmDialog, debounce, h, icon, iconButton, toast } from '../dom.js';

const LAST_QUERY_KEY = 'expertic_last_query';

export function renderList(root) {
  let requestSeq = 0;
  const savedQuery = (() => { try { return sessionStorage.getItem(LAST_QUERY_KEY) ?? ''; } catch { return ''; } })();

  const searchInput = h('input', {
    type: 'search',
    placeholder: 'Buscar por nombre, código, escuela, facultad o ID…',
    'aria-label': 'Buscar asignaturas',
    value: savedQuery,
  });
  const results = h('div', { class: 'asig-grid', 'aria-live': 'polite' });
  const count = h('span', { class: 'muted small' });

  root.append(
    h('div', { class: 'page-header' },
      h('div', {},
        h('h1', {}, 'Asignaturas'),
        h('p', {}, 'Busca una asignatura para editar sus lecciones, o crea una nueva.')),
      h('a', { href: '#/nueva', class: 'btn btn-primary' }, icon('plus'), 'Nueva asignatura')),
    h('div', { class: 'toolbar' },
      h('label', { class: 'search' }, icon('search'), searchInput)),
    h('div', { class: 'flex', style: 'margin:-8px 0 14px' }, count),
    results,
  );

  async function load() {
    const q = searchInput.value.trim();
    try { sessionStorage.setItem(LAST_QUERY_KEY, q); } catch { /* sin almacenamiento */ }
    const seq = ++requestSeq;
    results.replaceChildren(...Array.from({ length: 6 }, () => h('div', { class: 'skeleton', style: 'height:150px' })));
    try {
      const rows = await api.listAsignaturas(q);
      if (seq !== requestSeq) return; // llegó una búsqueda más reciente
      count.textContent = `${rows.length} ${rows.length === 1 ? 'asignatura' : 'asignaturas'}`;
      if (!rows.length) {
        results.replaceChildren(h('div', { class: 'empty', style: 'grid-column:1/-1' },
          h('h3', {}, q ? 'Sin resultados' : 'Aún no hay asignaturas'),
          h('p', {}, q ? `No encontramos asignaturas que coincidan con “${q}”.` : 'Crea la primera para empezar.'),
          !q && h('a', { href: '#/nueva', class: 'btn btn-primary' }, icon('plus'), 'Nueva asignatura')));
        return;
      }
      results.replaceChildren(...rows.map(card));
    } catch (err) {
      if (seq !== requestSeq) return;
      results.replaceChildren(h('div', { class: 'empty', style: 'grid-column:1/-1' },
        h('h3', {}, 'No se pudo cargar'), h('p', {}, err.message),
        h('button', { class: 'btn', onClick: load }, 'Reintentar')));
    }
  }

  function card(a) {
    const href = `#/asignatura/${a.id}`;
    return h('article', { class: 'card asig-card' },
      h('div', { class: 'asig-card-title' },
        h('a', { href }, a.nombre),
        a.codigo && h('span', { class: 'badge badge-primary' }, a.codigo)),
      h('div', { class: 'asig-card-meta' }, `${a.escuela} · ${a.facultad}`),
      h('div', { class: 'asig-card-footer' },
        h('span', { class: 'badge' }, icon('book'), `${a.total_lecciones} ${a.total_lecciones === 1 ? 'lección' : 'lecciones'}`),
        h('div', { class: 'flex' },
          iconButton('trash', `Eliminar ${a.nombre}`, () => remove(a), 'danger'),
          h('a', { href, class: 'btn btn-soft btn-sm' }, 'Editar'))));
  }

  async function remove(a) {
    const ok = await confirmDialog(
      `Se eliminará “${a.nombre}” y sus ${a.total_lecciones} lecciones. Esta acción no se puede deshacer.`,
      { title: 'Eliminar asignatura', okText: 'Eliminar', danger: true });
    if (!ok) return;
    try {
      await api.deleteAsignatura(a.id);
      toast('Asignatura eliminada');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  searchInput.addEventListener('input', debounce(load, 300));
  load();
  searchInput.focus();
}
