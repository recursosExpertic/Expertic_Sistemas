// Editor de UNA lección: datos generales + pestañas (competencias, recursos, bibliografía, preguntas).
//
// Regla clave: cada campo escribe directamente en el objeto `lesson` en cuanto se teclea.
// El estado SIEMPRE está al día, así que volver a dibujar (cambiar de pestaña, de lección,
// agregar o quitar elementos) nunca pierde lo escrito — el error principal de la versión anterior.
import { autosize, confirmDialog, h, icon, iconButton, isHttpUrl, toast } from '../dom.js';

export const LESSON_FIELDS = [
  'modulo', 'leccion', 'resumen_link',
  'competencias', 'catalogo_videos', 'catalogo_simuladores',
  'catalogo_libros', 'bibliografia', 'preguntas_autoevaluacion',
];

export const TABS = [
  { id: 'competencias', field: 'competencias', label: 'Competencias' },
  { id: 'videos', field: 'catalogo_videos', label: 'Videos' },
  { id: 'simuladores', field: 'catalogo_simuladores', label: 'Simuladores' },
  { id: 'libros', field: 'catalogo_libros', label: 'Libros' },
  { id: 'bibliografia', field: 'bibliografia', label: 'Bibliografía' },
  { id: 'preguntas', field: 'preguntas_autoevaluacion', label: 'Preguntas' },
];

export function emptyLesson(modulo = '') {
  return {
    modulo, leccion: '', resumen_link: '',
    competencias: [], catalogo_videos: [], catalogo_simuladores: [], catalogo_libros: [],
    bibliografia: [], preguntas_autoevaluacion: [],
  };
}

// ---------------------------------------------------------------------------
// Piezas pequeñas
// ---------------------------------------------------------------------------
function field(label, control, { required, hint, error, extra } = {}) {
  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
    control.setAttribute('aria-label', label);
    if (error) control.classList.add('invalid');
  }
  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, label, required && h('span', { class: 'req' }, ' *')),
    control,
    hint && h('span', { class: 'field-hint' }, hint),
    error && h('span', { class: 'field-error' }, error),
    extra);
}

/** Input/textarea enlazado a obj[key]: cada tecla actualiza el estado. */
function bound(obj, key, props, onInput, tag = 'input') {
  const el = h(tag, { type: tag === 'input' ? 'text' : undefined, ...props, value: obj[key] ?? '' });
  el.addEventListener('input', () => {
    obj[key] = el.value;
    onInput?.(el);
  });
  return tag === 'textarea' ? autosize(el) : el;
}

function openLinkButton(getUrl) {
  return iconButton('external', 'Abrir enlace en otra pestaña', () => {
    const url = getUrl().trim();
    if (isHttpUrl(url)) window.open(url, '_blank', 'noopener');
    else toast('El enlace no es una URL válida (debe empezar por https://)', 'error');
  });
}

/** Aviso suave bajo un enlace que no parece URL (no impide guardar). */
function linkHint(getUrl) {
  const el = h('span', { class: 'field-warn' });
  const update = () => {
    const v = getUrl().trim();
    el.textContent = v && !isHttpUrl(v) ? 'No parece una URL completa (https://…)' : '';
    el.hidden = !el.textContent;
  };
  update();
  return { el, update };
}

function move(arr, from, to) {
  if (to < 0 || to >= arr.length) return;
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
}

function rowActions(arr, i, onStructure, { removeLabel = 'Quitar', confirmRemove } = {}) {
  const up = iconButton('up', 'Subir', () => { move(arr, i, i - 1); onStructure(); });
  const down = iconButton('down', 'Bajar', () => { move(arr, i, i + 1); onStructure(); });
  const del = iconButton('trash', removeLabel, async () => {
    if (confirmRemove && !(await confirmRemove())) return;
    arr.splice(i, 1);
    onStructure();
  }, 'danger');
  up.disabled = i === 0;
  down.disabled = i === arr.length - 1;
  return h('div', { class: 'row-actions' }, up, down, del);
}

function addButton(label, onClick, primary = false) {
  return h('button', { type: 'button', class: `btn btn-sm ${primary ? 'btn-soft' : ''}`, onClick }, icon('plus'), label);
}

function panelIntro(text, action) {
  return h('div', { class: 'panel-intro' }, h('p', {}, text), action);
}

function emptyState(text, action) {
  return h('div', { class: 'empty' }, h('p', {}, text), action);
}

// ---------------------------------------------------------------------------
// Editores por tipo de contenido
// ---------------------------------------------------------------------------

/** Lista de textos (competencias, preguntas). */
function stringListEditor(arr, opts, { changed, structural }) {
  const add = () => { arr.push(''); structural('.rows > .row:last-child :is(input, textarea)'); };

  const rows = arr.map((value, i) => {
    const control = opts.multiline
      ? autosize(h('textarea', { rows: 2, placeholder: opts.placeholder, 'aria-label': `${opts.itemLabel} ${i + 1}`, value }))
      : h('input', { type: 'text', placeholder: opts.placeholder, 'aria-label': `${opts.itemLabel} ${i + 1}`, value });
    control.addEventListener('input', () => { arr[i] = control.value; changed(); });
    if (!opts.multiline) {
      // Enter crea la siguiente fila: así se pueden escribir varias seguidas.
      control.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        arr.splice(i + 1, 0, '');
        structural(`.rows > .row:nth-child(${i + 2}) input`);
      });
    }
    return h('div', { class: 'row' },
      h('span', { class: 'row-num' }, i + 1),
      h('div', { class: 'row-fields' }, control),
      rowActions(arr, i, () => structural()));
  });

  return h('div', {},
    panelIntro(opts.intro, addButton(opts.addLabel, add, true)),
    rows.length
      ? [h('div', { class: 'rows' }, rows), h('div', { class: 'mt-2' }, addButton(opts.addLabel, add))]
      : emptyState(opts.emptyText, addButton(opts.addLabel, add, true)));
}

/** Videos / simuladores / libros: título, enlace e imagen con vista previa. */
function mediaListEditor(arr, opts, { changed, structural }) {
  const add = () => { arr.push({ titulo: '', link: '', imagen: '' }); structural('.rows > .row:last-child input'); };

  const rows = arr.map((item, i) => {
    const thumb = h('div', { class: 'thumb' });
    const paintThumb = () => {
      const src = item.imagen.trim();
      if (isHttpUrl(src)) {
        const img = h('img', { src, alt: '', loading: 'lazy' });
        img.addEventListener('error', () => thumb.replaceChildren(icon('image')));
        thumb.replaceChildren(img);
      } else {
        thumb.replaceChildren(icon('image'));
      }
    };
    paintThumb();

    const linkWarn = linkHint(() => item.link);
    const titulo = bound(item, 'titulo', { placeholder: `Título del ${opts.singular}`, 'aria-label': 'Título' }, changed);
    const link = bound(item, 'link', { placeholder: 'https://…', 'aria-label': 'Enlace' }, () => { linkWarn.update(); changed(); });
    const imagen = bound(item, 'imagen', { placeholder: 'URL de la imagen (opcional)', 'aria-label': 'Imagen' }, changed);
    imagen.addEventListener('change', paintThumb);

    return h('div', { class: 'row media-row' },
      thumb,
      h('div', { class: 'row-fields' },
        titulo,
        h('div', { class: 'input-with-action' }, link, openLinkButton(() => item.link)),
        linkWarn.el,
        imagen),
      rowActions(arr, i, () => structural(), { removeLabel: `Quitar ${opts.singular}` }));
  });

  return h('div', {},
    panelIntro(opts.intro, addButton(opts.addLabel, add, true)),
    rows.length
      ? [h('div', { class: 'rows' }, rows), h('div', { class: 'mt-2' }, addButton(opts.addLabel, add))]
      : emptyState(opts.emptyText, addButton(opts.addLabel, add, true)));
}

/** Bibliografía: Tema → Subtemas → Referencias (libro + enlace). */
function bibliografiaEditor(temas, { changed, structural }) {
  const addTema = () => {
    temas.push({ tema: '', subtemas: [] });
    structural('.tema:last-child .tema-head input');
  };

  const hasContent = t => t.tema.trim() || t.subtemas.length;
  const temaEls = temas.map((tema, ti) => {
    const subEls = tema.subtemas.map((sub, si) => {
      const refEls = sub.referencias.map((ref, ri) => {
        const libro = bound(ref, 'libro', { placeholder: 'Libro o autor', 'aria-label': `Referencia ${ri + 1}: libro` }, changed);
        const link = bound(ref, 'link', { placeholder: 'Enlace (opcional)', 'aria-label': `Referencia ${ri + 1}: enlace` }, changed);
        return h('div', { class: 'ref' },
          libro,
          h('div', { class: 'input-with-action' }, link, openLinkButton(() => ref.link)),
          iconButton('trash', 'Quitar referencia', () => { sub.referencias.splice(ri, 1); structural(); }, 'danger'));
      });

      return h('div', { class: 'subtema', dataset: { sub: `${ti}-${si}` } },
        h('div', { class: 'subtema-head' },
          field(`Subtema ${si + 1}`, bound(sub, 'nombre', { placeholder: 'Nombre del subtema' }, changed)),
          rowActions(tema.subtemas, si, () => structural(), {
            removeLabel: 'Quitar subtema',
            confirmRemove: () => sub.referencias.length
              ? confirmDialog(`El subtema tiene ${sub.referencias.length} referencias. ¿Quitarlo?`, { okText: 'Quitar', danger: true })
              : true,
          })),
        h('div', { class: 'sublabel' }, 'Referencias'),
        refEls,
        addButton('Referencia', () => {
          sub.referencias.push({ libro: '', link: '' });
          structural(`[data-sub="${ti}-${si}"] .ref:last-of-type input`);
        }));
    });

    return h('div', { class: 'tema', dataset: { tema: ti } },
      h('div', { class: 'tema-head' },
        field(`Tema ${ti + 1}`, bound(tema, 'tema', { placeholder: 'Nombre del tema' }, changed)),
        rowActions(temas, ti, () => structural(), {
          removeLabel: 'Quitar tema',
          confirmRemove: () => hasContent(tema) && tema.subtemas.length
            ? confirmDialog(`El tema tiene ${tema.subtemas.length} subtemas. ¿Quitarlo con todo su contenido?`, { okText: 'Quitar', danger: true })
            : true,
        })),
      h('div', { class: 'sublabel' }, 'Subtemas'),
      subEls,
      addButton('Subtema', () => {
        tema.subtemas.push({ nombre: '', referencias: [] });
        structural(`[data-tema="${ti}"] .subtema:last-of-type .subtema-head input`);
      }));
  });

  return h('div', {},
    panelIntro('Organiza las lecturas por tema y subtema. Cada subtema puede tener varias referencias.',
      addButton('Agregar tema', addTema, true)),
    temaEls.length
      ? [h('div', {}, temaEls), h('div', { class: 'mt-2' }, addButton('Agregar tema', addTema))]
      : emptyState('Esta lección aún no tiene bibliografía.', addButton('Agregar tema', addTema, true)));
}

// ---------------------------------------------------------------------------
// Editor completo
// ---------------------------------------------------------------------------

/**
 * @param lesson objeto de la lección (se modifica directamente)
 * @param ctx {
 *   getTab(), setTab(id),
 *   changed()            → se editó un valor
 *   headerChanged()      → cambió módulo o nombre (refresca la barra lateral)
 *   nameWarnings()       → avisos sobre el nombre (renombrado, duplicado)
 *   errors               → { campo: mensaje } del último intento de guardado
 *   onDuplicate(), onDelete()
 * }
 */
export function renderLessonEditor(lesson, ctx) {
  const errors = ctx.errors ?? {};

  // --- Encabezado --------------------------------------------------------------
  const nameWarn = h('div');
  const updateNameWarn = () =>
    nameWarn.replaceChildren(...ctx.nameWarnings().map(w => h('div', { class: 'field-warn' }, w)));
  updateNameWarn();

  const leccion = bound(lesson, 'leccion', { class: 'input-lg', placeholder: 'Nombre de la lección', maxlength: 300 },
    () => { updateNameWarn(); ctx.headerChanged(); });
  const modulo = bound(lesson, 'modulo', { placeholder: 'Ej. Módulo 1: Funciones', maxlength: 300 }, () => ctx.headerChanged());
  const resumenWarn = linkHint(() => lesson.resumen_link);
  const resumen = bound(lesson, 'resumen_link', { placeholder: 'https://…' }, () => { resumenWarn.update(); ctx.changed(); });

  const listErrors = Object.entries(errors).filter(([f]) => !['leccion', 'modulo', 'resumen_link'].includes(f));

  const head = h('div', { class: 'lesson-head' },
    h('div', { class: 'lesson-head-top' },
      lesson.id
        ? h('span', { class: 'badge' }, `ID ${lesson.id}`)
        : h('span', { class: 'badge badge-warn' }, 'Nueva · sin guardar'),
      h('div', { class: 'flex' },
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onClick: ctx.onDuplicate }, icon('copy'), 'Duplicar'),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm btn-icon danger', title: 'Eliminar lección', 'aria-label': 'Eliminar lección', onClick: ctx.onDelete }, icon('trash')))),
    listErrors.length > 0 && h('div', { class: 'callout callout-warn' }, icon('warn'),
      h('div', {}, listErrors.map(([f, msg]) => h('div', {}, `${TABS.find(t => t.field === f)?.label ?? f}: ${msg}`)))),
    field('Nombre de la lección', leccion, { required: true, error: errors.leccion, extra: nameWarn }),
    h('div', { class: 'grid-2' },
      field('Módulo', modulo, { required: true, error: errors.modulo, hint: 'Las lecciones se agrupan por módulo.' }),
      field('Link del resumen', h('div', { class: 'input-with-action' }, resumen, openLinkButton(() => lesson.resumen_link)), {
        error: errors.resumen_link,
        hint: 'Opcional. URL completa.',
        extra: resumenWarn.el,
      })));
  if (errors.resumen_link) resumen.classList.add('invalid');

  // --- Pestañas ----------------------------------------------------------------
  const tabsEl = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Contenido de la lección' });
  const panel = h('div', { class: 'lesson-panel', role: 'tabpanel' });

  function renderTabs() {
    const current = ctx.getTab();
    tabsEl.replaceChildren(...TABS.map(t => h('button', {
      type: 'button',
      role: 'tab',
      class: 'tab',
      'aria-selected': String(t.id === current),
      onClick: () => { ctx.setTab(t.id); renderTabs(); renderPanel(); },
    }, t.label, h('span', { class: 'count' }, lesson[t.field].length))));
  }

  // Cambio estructural (agregar/quitar/mover): se redibuja el panel desde el estado
  // y opcionalmente se enfoca el campo nuevo.
  function structural(focusSelector) {
    renderTabs();
    renderPanel();
    ctx.changed();
    if (focusSelector) {
      const targets = panel.querySelectorAll(focusSelector);
      targets[targets.length - 1]?.focus();
    }
  }

  function renderPanel() {
    const helpers = { changed: ctx.changed, structural };
    const content = {
      competencias: () => stringListEditor(lesson.competencias, {
        intro: 'Lo que el estudiante será capaz de hacer al terminar la lección. Pulsa Enter para agregar la siguiente.',
        placeholder: 'Ej. Interpreta la pendiente como razón de cambio',
        itemLabel: 'Competencia', addLabel: 'Agregar competencia',
        emptyText: 'Esta lección aún no tiene competencias.',
      }, helpers),
      videos: () => mediaListEditor(lesson.catalogo_videos, {
        singular: 'video', intro: 'Videos de apoyo. La imagen es la miniatura que se muestra en la plantilla.',
        addLabel: 'Agregar video', emptyText: 'Aún no hay videos.',
      }, helpers),
      simuladores: () => mediaListEditor(lesson.catalogo_simuladores, {
        singular: 'simulador', intro: 'Simuladores o herramientas interactivas.',
        addLabel: 'Agregar simulador', emptyText: 'Aún no hay simuladores.',
      }, helpers),
      libros: () => mediaListEditor(lesson.catalogo_libros, {
        singular: 'libro', intro: 'Libros o documentos de consulta con su portada.',
        addLabel: 'Agregar libro', emptyText: 'Aún no hay libros.',
      }, helpers),
      bibliografia: () => bibliografiaEditor(lesson.bibliografia, helpers),
      preguntas: () => stringListEditor(lesson.preguntas_autoevaluacion, {
        intro: 'Preguntas para que el estudiante compruebe lo aprendido.',
        placeholder: 'Escribe la pregunta…', multiline: true,
        itemLabel: 'Pregunta', addLabel: 'Agregar pregunta',
        emptyText: 'Aún no hay preguntas de autoevaluación.',
      }, helpers),
    };
    panel.replaceChildren((content[ctx.getTab()] ?? content.competencias)());
  }

  renderTabs();
  renderPanel();

  return {
    el: h('div', { class: 'card' }, head, tabsEl, panel),
    focusName: () => leccion.focus(),
  };
}
