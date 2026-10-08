/* ==================== CARGA DE DATOS: escuelas, cursos y libros de Biología ==================== */
(function () {
  'use strict';

  // ---------- CONFIGURACIÓN ----------
  const BASE_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTH_aN2fgxf7zeCX5TjpRYEQkDBABfJOrL0tqM4Z271wQ1KiHztPZ20zixOurKiGrVTEuM-0BSbe6T/pub?output=tsv';

  const SCHOOLS = [
    { gid: 0, escuela: 'fis_M',       title: 'Escuela de Física',       tableClass: 'table-fisica' }
  ];

  // ---------- HELPERS ----------
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const esUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s.trim());
  const escHtml = (s) => (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // ---------- CARGA DE UNA ESCUELA ----------
  // La misma escuela aparece en varias subpáginas (<div data-escuela="...">):
  // se descarga una sola vez y se pinta en todos sus contenedores.
  async function cargarHoja(school) {
    const containers = Array.from(document.querySelectorAll(`[data-escuela="${school.escuela}"]`));
    if (!containers.length) return;
    const pintar = (html) => containers.forEach(c => { c.innerHTML = html; });

    try {
      const url = `${BASE_TSV}&gid=${school.gid}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const texto = await res.text();
      const filas = texto.trim().split('\n').map(f => f.split('\t'));

      if (filas.length < 2) {
        pintar('<p>Sin datos disponibles.</p>');
        return;
      }

      const headers = filas[0].map(h => h.trim());
      const dataRows = filas.slice(1).filter(r => r.some(c => (c || '').trim()));
      const filasHTML = dataRows.map(row => buildRow(row, headers)).join('');

      const detallesHTML = `
        <details>
          <summary>${escHtml(school.title)}</summary>
          <div class="details-body">
            <div class="course-table-wrap">
              <table class="course-table ${school.tableClass}">
                <thead>
                  <tr>
                    <th>Asignatura</th>
                    <th>Código</th>
                    <th>Plataforma</th>
                    <th>Libro</th>
                    <th>PIN de acceso</th>
                    <th>Temario ExperTIC</th>
                    <th>Acceso</th>
                  </tr>
                </thead>
                <tbody>${filasHTML}</tbody>
              </table>
            </div>
          </div>
        </details>`;

      pintar(detallesHTML);

      if (school.title === 'Escuela de Biología') {
        await agregarLibrosBiologia(containers);
      }
    } catch (error) {
      console.error(`Error al cargar ${school.title}:`, error);
      pintar('<p>Error al cargar datos. Intente más tarde.</p>');
    }
  }

  // ---------- CONSTRUIR FILA ----------
  function buildRow(row, headers) {
    // Normalizamos headers para tolerar diferencias de mayúsculas/espacios/tildes
    const headersNorm = headers.map(h => norm(h));
    const get = (colName) => {
      const idx = headersNorm.indexOf(norm(colName));
      return idx !== -1 ? (row[idx] || '').trim() : '';
    };

    const asignatura     = get('Asignatura');
    const codigo         = get('Código') || get('Codigo') || '—';
    const plataforma     = get('Plataforma');
    const libro          = get('Libros Connect') || get('Libro');
    const pin            = get('Pin de acceso') || get('PIN');
    const temario        = get('Temario ExperTIC');
    const enlaceCurso    = get('Enlace al curso');

    // Plataforma badge
    const platLower = norm(plataforma);
    let plataformaHTML;
    if (platLower === 'connect') {
      plataformaHTML = '<span class="platform-badge platform-connect">Connect</span>';
    } else if (platLower === 'aleks') {
      plataformaHTML = '<span class="platform-badge platform-aleks">Aleks</span>';
    } else {
      plataformaHTML = plataforma
        ? `<span class="platform-badge">${escHtml(plataforma)}</span>`
        : '—';
    }

    // PIN
    const pinHTML = (!pin || pin === '—')
      ? '<span class="no-pin">—</span>'
      : `<span class="pin-badge" role="button" tabindex="0" data-pin="${escHtml(pin)}" title="Clic para copiar">${escHtml(pin)}</span>`;

    // Temario
    const recursosHTML = esUrl(temario)
      ? `<a href="${escHtml(temario)}" target="_blank" rel="noopener noreferrer" class="icon-link">📄 Temario ExperTIC</a>`
      : '—';

    // Acceso
    const accesoHTML = esUrl(enlaceCurso)
      ? `<a href="${escHtml(enlaceCurso)}" target="_blank" rel="noopener noreferrer" class="btn-course">Ir al curso →</a>`
      : '<span class="no-pin">Enlace por confirmar</span>';

    return `
      <tr>
        <td>${escHtml(asignatura)}</td>
        <td>${escHtml(codigo)}</td>
        <td>${plataformaHTML}</td>
        <td>${escHtml(libro)}</td>
        <td>${pinHTML}</td>
        <td>${recursosHTML}</td>
        <td>${accesoHTML}</td>
      </tr>`;
  }

  // ---------- COPIAR PIN (una sola implementación, con WeakMap) ----------
  const timers = new WeakMap();

  function mostrarConfirmacion(badge, textoOriginal) {
    if (timers.has(badge)) clearTimeout(timers.get(badge));
    badge.textContent = '¡Copiado!';
    const timer = setTimeout(function () {
      badge.textContent = textoOriginal;
      timers.delete(badge);
    }, 1500);
    timers.set(badge, timer);
  }

  function copiarFallback(badge, texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      mostrarConfirmacion(badge, texto);
    } catch (err) {
      console.error('No se pudo copiar el PIN', err);
    }
    document.body.removeChild(textarea);
  }

  function copiarPin(badge) {
    const pinOriginal = badge.getAttribute('data-pin');
    if (!pinOriginal) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pinOriginal)
        .then(() => mostrarConfirmacion(badge, pinOriginal))
        .catch(() => copiarFallback(badge, pinOriginal));
    } else {
      copiarFallback(badge, pinOriginal);
    }
  }

  // Delegación: clic y teclado (Enter/Espacio)
  document.addEventListener('click', function (e) {
    const badge = e.target.closest('.pin-badge');
    if (badge) {
      e.preventDefault();
      copiarPin(badge);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const badge = e.target.closest('.pin-badge');
    if (badge) {
      e.preventDefault();
      copiarPin(badge);
    }
  });

  // ---------- INICIALIZACIÓN ROBUSTA ----------
  function init() {
    SCHOOLS.forEach(function (school) { cargarHoja(school); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
