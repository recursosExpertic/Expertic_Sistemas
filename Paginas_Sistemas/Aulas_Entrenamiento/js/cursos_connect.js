/* ==================== CARGA DE DATOS: escuelas, cursos y libros de Biología ==================== */
(function () {
  'use strict';

  // ---------- CONFIGURACIÓN ----------
  const BASE_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vROVAjcR21cudmX98yuu4YqqIqdMPTfG9xXK1mJkSNUfGkSjcccqAn8UzjW2OcIVC0tlgvozS3nMKRj/pub?output=tsv';
  const LIBROS_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzSQCZ_Jd3FOErN7ercHV3-tbXxnghKa94xErG8roHN3761dUfw9nhGVeETq5g3g/pub?gid=951247696&single=true&output=tsv';

  const SCHOOLS = [
    { gid: 2547548,   escuela: 'e3t_C',       title: 'Escuela E3T',             tableClass: 'table-e3t' },
    { gid: 704898453, escuela: 'mat_C',       title: 'Escuela de Matemáticas',  tableClass: 'table-matematicas' },
    { gid: 915914968, escuela: 'fis_C',       title: 'Escuela de Física',       tableClass: 'table-fisica' },
    { gid: 373143542, escuela: 'qui_C',       title: 'Escuela de Química',      tableClass: 'table-quimica' },
    { gid: 405299746, escuela: 'bio_C',       title: 'Escuela de Biología',     tableClass: 'table-biologia' }
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

  // ---------- LIBROS DE BIOLOGÍA ----------
  async function agregarLibrosBiologia(containers) {
    const bodies = containers.map(c => c.querySelector('details .details-body')).filter(Boolean);
    if (!bodies.length) {
      console.warn('No se encontró el .details-body para Biología');
      return;
    }
    const insertar = (html) => bodies.forEach(b => b.insertAdjacentHTML('beforeend', html));

    try {
      const res = await fetch(LIBROS_TSV);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const texto = await res.text();
      const filas = texto.trim().split('\n').map(f => f.split('\t').map(c => c.trim()));

      if (filas.length < 9) {
        insertar('<p>Sin información de libros disponible.</p>');
        return;
      }

      const fNombre    = filas[2] || [];
      const fAutores   = filas[3] || [];
      const fEditorial = filas[4] || [];
      const fEdicion   = filas[5] || [];
      const fImagenes  = filas[6] || [];
      const fEnlaces   = filas[7] || [];

      const numLibros = Math.max(0, fNombre.length - 1);
      if (numLibros === 0) {
        insertar('<p>Sin libros registrados.</p>');
        return;
      }

      const filasLecciones = filas.slice(8);
      const headersLecciones = filasLecciones[0] || [];
      const dataLecciones = filasLecciones.slice(1);

      // Tarjetas
      const tarjetasHTML = Array.from({ length: numLibros }, (_, i) => {
        const col = i + 1;
        const nombre    = fNombre[col]    || '—';
        const autores   = fAutores[col]   || '—';
        const editorial = fEditorial[col] || '—';
        const edicion   = fEdicion[col]   || '—';
        const imagen    = fImagenes[col]  || '';
        const enlace    = fEnlaces[col]   || '';

        const imgHTML = esUrl(imagen)
          ? `<img src="${escHtml(imagen)}" alt="Portada de ${escHtml(nombre)}" class="libro-card-img" width="150" height="200" loading="lazy">`
          : `<div class="libro-card-img-placeholder">📖</div>`;

        const btnHTML = esUrl(enlace)
          ? `<a href="${escHtml(enlace)}" target="_blank" rel="noopener noreferrer" class="btn-course">Ir al curso →</a>`
          : `<span class="no-link">Enlace por confirmar</span>`;

        return `
          <div class="libro-card">
            ${imgHTML}
            <div class="libro-card-body">
              <p class="libro-titulo">${escHtml(nombre)}</p>
              <p class="libro-meta"><span class="libro-meta-label">Autores</span>${escHtml(autores)}</p>
              <p class="libro-meta"><span class="libro-meta-label">Editorial</span>${escHtml(editorial)}</p>
              <p class="libro-meta"><span class="libro-meta-label">Edición</span>${escHtml(edicion)}</p>
            </div>
            <div class="libro-card-footer">${btnHTML}</div>
          </div>`;
      }).join('');

      // Tabla de lecciones
      const thLibros = Array.from({ length: numLibros }, (_, i) =>
        `<th>${escHtml(headersLecciones[i + 1] || `Libro ${i + 1}`)}</th>`
      ).join('');

      const filasTablaHTML = dataLecciones.map(row => {
        const leccion = row[0] || '';
        if (!leccion) return '';
        const celdas = Array.from({ length: numLibros }, (_, i) => {
          const enlace = (row[i + 1] || '').trim();
          return esUrl(enlace)
            ? `<td><a href="${escHtml(enlace)}" target="_blank" rel="noopener noreferrer" class="leccion-link">✔️</a></td>`
            : `<td><span class="no-link">—</span></td>`;
        }).join('');
        return `<tr><td>${escHtml(leccion)}</td>${celdas}</tr>`;
      }).join('');

      const librosHTML = `
        <div style="margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem;">
          <h3>📚 Libros de Biología</h3>
          <div class="libro-grid">${tarjetasHTML}</div>
          <div class="lecciones-section">
            <details>
              <summary>Lecciones por libro</summary>
              <div class="lecciones-wrap">
                <table class="lecciones-table table-biologia">
                  <thead>
                    <tr>
                      <th>${escHtml(headersLecciones[0] || 'Lección')}</th>
                      ${thLibros}
                    </tr>
                  </thead>
                  <tbody>${filasTablaHTML}</tbody>
                </table>
              </div>
            </details>
          </div>
        </div>`;

      insertar(librosHTML);
    } catch (error) {
      console.error('Error cargando libros de Biología:', error);
      insertar('<p style="color:red;">Error al cargar los libros.</p>');
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
