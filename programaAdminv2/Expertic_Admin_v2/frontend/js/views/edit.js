// Vista de edición de una asignatura: datos generales + lista de lecciones + editor de lección.
// Los cambios se acumulan en memoria y se guardan TODOS juntos (en una transacción) con
// "Guardar cambios" o Ctrl+S.
import { api } from '../api.js';
import { confirmDialog, h, icon, isHttpUrl, toast } from '../dom.js';
import { setLeaveGuard } from '../router.js';
import { LESSON_FIELDS, TABS, emptyLesson, renderLessonEditor } from './lesson-editor.js';

const ASIG_FIELDS = ['nombre', 'codigo', 'escuela', 'facultad'];
const ASIG_LABELS = { nombre: 'Nombre', codigo: 'Código', escuela: 'Escuela', facultad: 'Facultad' };
const TAB_KEY = 'expertic_editor_tab';

const pick = (obj, keys) => Object.fromEntries(keys.map(k => [k, obj[k]]));
const snap = (obj, keys) => JSON.stringify(pick(obj, keys));
const norm = s => String(s ?? '').trim().toLowerCase();

let keySeq = 0;
const newKey = () => `new-${Date.now().toString(36)}-${++keySeq}`;

export async function renderEdit(root, { id }) {
  const asignaturaId = Number(id);
  root.append(h('div', { class: 'skeleton', style: 'height:70px;margin-bottom:24px' }),
    h('div', { class: 'editor-grid' },
      h('div', { class: 'skeleton', style: 'height:420px' }),
      h('div', { class: 'skeleton', style: 'height:520px' })));

  let data;
  try {
    data = await api.getAsignatura(asignaturaId);
  } catch (err) {
    root.replaceChildren(h('div', { class: 'empty' },
      h('h3', {}, err.status === 404 ? 'Asignatura no encontrada' : 'No se pudo cargar'),
      h('p', {}, err.message),
      h('a', { href: '#/', class: 'btn' }, 'Volver a asignaturas')));
    return;
  }

  root.replaceChildren();
  const editor = createEditor(root, asignaturaId, data);
  setLeaveGuard(editor.isDirty);
  return editor.destroy;
}

function createEditor(root, asignaturaId, initialData) {
  const state = {
    asignatura: null,
    lecciones: [],
    eliminadas: [],
    selectedKey: null,
    tab: (() => { try { return sessionStorage.getItem(TAB_KEY) || TABS[0].id; } catch { return TABS[0].id; } })(),
    saving: false,
    asigErrors: {},
    lessonErrors: new Map(), // key → { campo: mensaje }
  };
  let original;

  function load(data, keepKey) {
    state.asignatura = pick(data.asignatura, ['id', ...ASIG_FIELDS]);
    state.lecciones = data.lecciones.map(l => ({ ...l, _key: `id-${l.id}` }));
    state.eliminadas = [];
    original = {
      asignatura: snap(state.asignatura, ASIG_FIELDS),
      nombre: state.asignatura.nombre,
      lecciones: new Map(state.lecciones.map(l => [l.id, snap(l, LESSON_FIELDS)])),
      nombres: new Map(state.lecciones.map(l => [l.id, l.leccion])),
    };
    state.selectedKey = state.lecciones.some(l => l._key === keepKey) ? keepKey : state.lecciones[0]?._key ?? null;
  }

  // --- Cambios pendientes --------------------------------------------------------
  const lessonDirty = l => !l.id || snap(l, LESSON_FIELDS) !== original.lecciones.get(l.id);
  const asigDirty = () => snap(state.asignatura, ASIG_FIELDS) !== original.asignatura;
  const isDirty = () => asigDirty() || state.eliminadas.length > 0 || state.lecciones.some(lessonDirty);
  const selected = () => state.lecciones.find(l => l._key === state.selectedKey) ?? null;

  // --- Estructura de la página ---------------------------------------------------
  const title = h('h1');
  const status = h('span', { class: 'status', role: 'status' });
  const discardBtn = h('button', { type: 'button', class: 'btn btn-ghost', onClick: discard }, icon('undo'), 'Descartar');
  const saveBtn = h('button', { type: 'button', class: 'btn btn-primary', onClick: save, title: 'Guardar (Ctrl+S)' }, icon('save'), 'Guardar cambios');

  const asigCard = h('div', { class: 'card' });
  const navCount = h('span', { class: 'badge' });
  const nav = h('nav', { class: 'lesson-nav', 'aria-label': 'Lecciones' });
  const main = h('section', { 'aria-label': 'Editor de lección' });

  root.append(
    h('div', { class: 'savebar' },
      h('div', { class: 'savebar-title' },
        h('div', { class: 'crumbs' }, h('a', { href: '#/' }, 'Asignaturas'), ' / Editar'),
        title),
      status, discardBtn, saveBtn),
    h('div', { class: 'editor-grid' },
      h('aside', { class: 'editor-side' },
        asigCard,
        h('div', { class: 'card' },
          h('div', { class: 'card-header' },
            h('div', { class: 'flex' }, h('h2', {}, 'Lecciones'), navCount),
            h('button', { type: 'button', class: 'btn btn-soft btn-sm', onClick: addLesson }, icon('plus'), 'Nueva')),
          nav)),
      main));

  // --- Render --------------------------------------------------------------------
  function refreshStatus() {
    const dirty = isDirty();
    title.textContent = state.asignatura.nombre.trim() || 'Sin nombre';
    status.textContent = state.saving ? 'Guardando…' : dirty ? 'Cambios sin guardar' : 'Todo guardado';
    status.classList.toggle('dirty', dirty || state.saving);
    saveBtn.disabled = !dirty || state.saving;
    discardBtn.hidden = !dirty || state.saving;
    renderNav();
  }

  function renderAsignatura() {
    const inputs = ASIG_FIELDS.map(k => {
      const input = h('input', {
        type: 'text', value: state.asignatura[k] ?? '',
        maxlength: k === 'codigo' ? 50 : 300,
        class: state.asigErrors[k] ? 'invalid' : null,
      });
      const warn = h('span', { class: 'field-warn', hidden: true });
      const updateWarn = () => {
        // Las plantillas buscan "nombre de asignatura + nombre de lección".
        const renamed = k === 'nombre' && state.asignatura.id && state.asignatura.nombre.trim() !== original.nombre;
        warn.textContent = renamed ? `Antes: “${original.nombre}”. Las plantillas que usan el nombre anterior dejarán de encontrarla.` : '';
        warn.hidden = !renamed;
      };
      input.addEventListener('input', () => {
        state.asignatura[k] = input.value;
        updateWarn();
        refreshStatus();
      });
      updateWarn();
      return h('label', { class: 'field' },
        h('span', { class: 'field-label' }, ASIG_LABELS[k], k !== 'codigo' && h('span', { class: 'req' }, ' *')),
        input,
        state.asigErrors[k] && h('span', { class: 'field-error' }, state.asigErrors[k]),
        warn);
    });
    asigCard.replaceChildren(
      h('div', { class: 'card-header' }, h('h2', {}, 'Asignatura'), h('span', { class: 'badge' }, `ID ${state.asignatura.id}`)),
      h('div', { class: 'card-body' }, inputs));
  }

  function renderNav() {
    navCount.textContent = state.lecciones.length;
    if (!state.lecciones.length) {
      nav.replaceChildren(h('p', { class: 'muted small', style: 'padding:12px' }, 'Sin lecciones todavía.'));
      return;
    }
    // Agrupar por módulo respetando el orden de aparición.
    const groups = new Map();
    for (const l of state.lecciones) {
      const name = l.modulo.trim() || 'Sin módulo';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(l);
    }
    nav.replaceChildren(...[...groups].map(([modulo, items]) =>
      h('div', { class: 'lesson-group' },
        h('div', { class: 'lesson-group-title' }, modulo),
        items.map(l => h('button', {
          type: 'button',
          class: ['lesson-item', l._key === state.selectedKey && 'active', state.lessonErrors.has(l._key) && 'has-error'].filter(Boolean).join(' '),
          'aria-current': l._key === state.selectedKey ? 'true' : null,
          onClick: () => select(l._key),
        },
        h('span', { class: 'name' }, l.leccion.trim() || '(sin nombre)'),
        !l.id ? h('span', { class: 'badge badge-warn' }, 'nueva') : lessonDirty(l) && h('span', { class: 'dot', title: 'Cambios sin guardar' }))))));
  }

  function nameWarnings(lesson) {
    const warnings = [];
    const before = lesson.id ? original.nombres.get(lesson.id) : null;
    if (before != null && lesson.leccion.trim() !== before) {
      warnings.push(`Antes: “${before}”. Si una plantilla busca esta lección por su nombre, actualízala también.`);
    }
    if (lesson.leccion.trim() && state.lecciones.some(o => o !== lesson && norm(o.leccion) === norm(lesson.leccion))) {
      warnings.push('Ya existe otra lección con este nombre en la asignatura; las plantillas solo encontrarán una.');
    }
    return warnings;
  }

  let lessonEditor = null;
  function renderMain() {
    const lesson = selected();
    if (!lesson) {
      lessonEditor = null;
      main.replaceChildren(h('div', { class: 'empty' },
        h('h3', {}, 'Esta asignatura no tiene lecciones'),
        h('p', {}, 'Crea la primera lección para empezar a cargar su contenido.'),
        h('button', { type: 'button', class: 'btn btn-primary', onClick: addLesson }, icon('plus'), 'Nueva lección')));
      return;
    }
    lessonEditor = renderLessonEditor(lesson, {
      getTab: () => state.tab,
      setTab: tab => {
        state.tab = tab;
        try { sessionStorage.setItem(TAB_KEY, tab); } catch { /* sin almacenamiento */ }
      },
      changed: refreshStatus,
      headerChanged: refreshStatus,
      nameWarnings: () => nameWarnings(lesson),
      errors: state.lessonErrors.get(lesson._key),
      onDuplicate: () => duplicateLesson(lesson),
      onDelete: () => deleteLesson(lesson),
    });
    main.replaceChildren(lessonEditor.el);
  }

  function renderAll() {
    renderAsignatura();
    renderMain();
    refreshStatus();
  }

  // --- Acciones sobre lecciones --------------------------------------------------
  function select(key) {
    if (key === state.selectedKey) return;
    state.selectedKey = key;
    renderMain();
    renderNav();
    if (window.innerWidth <= 960) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function addLesson() {
    const base = selected() ?? state.lecciones.at(-1);
    const lesson = { ...emptyLesson(base?.modulo ?? ''), _key: newKey() };
    state.lecciones.push(lesson);
    state.selectedKey = lesson._key;
    renderMain();
    refreshStatus();
    lessonEditor?.focusName();
  }

  function duplicateLesson(lesson) {
    const copy = { ...structuredClone(pick(lesson, LESSON_FIELDS)), _key: newKey() };
    copy.leccion = `${lesson.leccion} (copia)`;
    state.lecciones.splice(state.lecciones.indexOf(lesson) + 1, 0, copy);
    state.selectedKey = copy._key;
    renderMain();
    refreshStatus();
    lessonEditor?.focusName();
    toast('Lección duplicada (sin guardar)', 'info');
  }

  async function deleteLesson(lesson) {
    const ok = await confirmDialog(
      lesson.id
        ? `La lección “${lesson.leccion || 'sin nombre'}” se eliminará al pulsar “Guardar cambios”. Hasta entonces puedes deshacerlo con “Descartar”.`
        : 'Esta lección aún no se ha guardado; se quitará de la lista.',
      { title: 'Eliminar lección', okText: 'Eliminar', danger: true });
    if (!ok) return;
    const i = state.lecciones.indexOf(lesson);
    state.lecciones.splice(i, 1);
    if (lesson.id) state.eliminadas.push(lesson.id);
    state.lessonErrors.delete(lesson._key);
    state.selectedKey = (state.lecciones[i] ?? state.lecciones[i - 1])?._key ?? null;
    renderMain();
    refreshStatus();
  }

  // --- Validación y guardado -----------------------------------------------------
  function validate() {
    state.asigErrors = {};
    for (const k of ['nombre', 'escuela', 'facultad']) {
      if (!state.asignatura[k].trim()) state.asigErrors[k] = 'Obligatorio';
    }
    state.lessonErrors.clear();
    for (const l of state.lecciones.filter(lessonDirty)) {
      const e = {};
      if (!l.leccion.trim()) e.leccion = 'Escribe el nombre de la lección';
      if (!l.modulo.trim()) e.modulo = 'Escribe el módulo';
      if (l.resumen_link.trim() && !isHttpUrl(l.resumen_link.trim())) e.resumen_link = 'Debe ser una URL completa (https://…)';
      if (Object.keys(e).length) state.lessonErrors.set(l._key, e);
    }
    return !Object.keys(state.asigErrors).length && !state.lessonErrors.size;
  }

  function showValidationProblems(message) {
    if (state.lessonErrors.size && !state.lessonErrors.has(state.selectedKey)) {
      state.selectedKey = state.lessonErrors.keys().next().value;
    }
    renderAll();
    toast(message, 'error', 6000);
  }

  async function save() {
    if (state.saving || !isDirty()) return;
    if (!validate()) {
      showValidationProblems('Revisa los campos marcados en rojo antes de guardar.');
      return;
    }

    const dirtyLessons = state.lecciones.filter(lessonDirty);
    const payload = {
      asignatura: pick(state.asignatura, ASIG_FIELDS),
      lecciones: dirtyLessons.map(l => ({ ...pick(l, LESSON_FIELDS), ...(l.id ? { id: l.id } : { clientKey: l._key }) })),
      eliminadas: state.eliminadas,
    };
    const creadas = payload.lecciones.filter(l => !l.id).length;
    const resumen = [
      creadas && `${creadas} nueva${creadas > 1 ? 's' : ''}`,
      dirtyLessons.length - creadas && `${dirtyLessons.length - creadas} actualizada${dirtyLessons.length - creadas > 1 ? 's' : ''}`,
      state.eliminadas.length && `${state.eliminadas.length} eliminada${state.eliminadas.length > 1 ? 's' : ''}`,
    ].filter(Boolean).join(' · ');

    state.saving = true;
    refreshStatus();
    try {
      const res = await api.saveContenido(asignaturaId, payload);
      let keep = state.selectedKey;
      const created = res.creadas.find(c => c.clientKey === keep);
      if (created) keep = `id-${created.id}`;
      state.asigErrors = {};
      state.lessonErrors.clear();
      load(res, keep);
      state.saving = false;
      renderAll();
      toast(`Cambios guardados${resumen ? ` — ${resumen}` : ''}`);
    } catch (err) {
      state.saving = false;
      // Ubicar cada error del servidor en su campo: ['lecciones', 2, 'resumen_link'] / ['asignatura', 'codigo']
      for (const d of err.details ?? []) {
        if (d.path[0] === 'asignatura') state.asigErrors[d.path[1]] = d.message;
        if (d.path[0] === 'lecciones') {
          const lesson = dirtyLessons[d.path[1]];
          if (!lesson) continue;
          const errs = state.lessonErrors.get(lesson._key) ?? {};
          errs[d.path[2]] ??= d.message;
          state.lessonErrors.set(lesson._key, errs);
        }
      }
      showValidationProblems(`No se guardó nada: ${err.message}`);
    }
  }

  async function discard() {
    const ok = await confirmDialog('Se perderán todos los cambios que no has guardado.', {
      title: '¿Descartar cambios?', okText: 'Descartar', danger: true,
    });
    if (!ok) return;
    try {
      const fresh = await api.getAsignatura(asignaturaId);
      state.asigErrors = {};
      state.lessonErrors.clear();
      load(fresh, state.selectedKey);
      renderAll();
      toast('Cambios descartados', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  // Ctrl+S / Cmd+S guarda.
  function onKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save();
    }
  }
  document.addEventListener('keydown', onKeydown);

  load(initialData);
  renderAll();

  return {
    isDirty,
    destroy: () => document.removeEventListener('keydown', onKeydown),
  };
}
