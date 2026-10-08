/* ==================== DIAPOSITIVAS, NAVEGACIÓN Y MENÚ HAMBURGUESA ==================== */
(function () {
  'use strict';

  // ---------- CONFIGURACIÓN ----------
  var DURACION_MS = 650;                 // duración base de la transición entre diapositivas
  var UMBRAL_RUEDA = 40;                 // sensibilidad de la rueda del mouse / trackpad
  var UMBRAL_SWIPE = 60;                 // px mínimos de deslizamiento táctil para cambiar de diapositiva
  var BREAKPOINT_MOVIL = 900;            // debe coincidir con el @media (max-width) de navbar.css
  // Si la página se muestra dentro de un iframe, el iframe mide lo mismo que su contenido y la
  // página contenedora es la que hace scroll. Por eso, en ese caso la rueda VERTICAL se deja
  // pasar a la página contenedora (para no "atraparle" el scroll). Cambiar a true para que
  // también la rueda vertical cambie de diapositiva dentro del iframe.
  var RUEDA_VERTICAL_EN_IFRAME = false;

  var page      = document.querySelector('.ae-page');
  var stage     = document.getElementById('slides');
  var track     = document.getElementById('slidesTrack');
  var navbar    = document.getElementById('navbar');
  var toggle    = document.getElementById('navToggle');
  var menu      = document.getElementById('navLinks');
  if (!page || !stage || !track || !navbar) return;

  var slides    = Array.prototype.slice.call(track.querySelectorAll('.slide'));
  var links     = Array.prototype.slice.call(navbar.querySelectorAll('.nav-links a'));
  var indicador = navbar.querySelector('.nav-indicator');
  var EMBEBIDO  = window.parent !== window;
  var mqReduce  = window.matchMedia('(prefers-reduced-motion: reduce)');

  var actual = 0;          // índice de la diapositiva visible
  var ocupado = false;     // true mientras dura la animación
  var timerFin = null;
  var alTerminarCb = null;
  var ultimaPrincipal = slides[0];   // última sección del menú visitada (para las subpáginas)

  page.classList.add('is-slider');
  slides.forEach(function (s) { s.setAttribute('tabindex', '-1'); });

  // ---------- UTILIDADES ----------
  function diapositivaDe(el) { return el.closest ? el.closest('.slide') : null; }
  // Subpáginas (data-sub): no están en el menú ni se alcanzan deslizando.
  function esSub(s) { return s.hasAttribute('data-sub'); }
  // Sección del menú que se marca: la propia, la indicada en data-padre o, si no tiene, la última visitada.
  function seccionDe(s) {
    if (!esSub(s)) return s;
    var padre = s.getAttribute('data-padre');
    return (padre && document.getElementById(padre)) || ultimaPrincipal;
  }
  function alturaActiva() { return slides[actual].offsetHeight; }

  function notificarAltura() {
    if (typeof window.aeEnviarAltura === 'function') window.aeEnviarAltura();
  }

  // Ajusta la altura del contenedor a la de la diapositiva visible (sin animar).
  function ajustarAltura() {
    stage.style.transitionDuration = '0ms';
    stage.style.height = alturaActiva() + 'px';
  }

  function marcarActiva() {
    if (!esSub(slides[actual])) ultimaPrincipal = slides[actual];
    var idActivo = '#' + seccionDe(slides[actual]).id;
    slides.forEach(function (s, k) {
      var activa = k === actual;
      s.classList.toggle('is-active', activa);
      if (activa) { s.removeAttribute('inert'); s.removeAttribute('aria-hidden'); }
      else { s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true'); }
    });
    links.forEach(function (a) {
      if (a.getAttribute('href') === idActivo) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    moverIndicador();
  }

  function moverIndicador() {
    if (!indicador || window.innerWidth <= BREAKPOINT_MOVIL) return;
    var activo = navbar.querySelector('.nav-links a[aria-current="page"]');
    if (!activo) return;
    var n = navbar.getBoundingClientRect();
    var r = activo.getBoundingClientRect();
    indicador.style.width = (r.width + 16) + 'px';
    indicador.style.transform = 'translateX(' + (r.left - n.left - 8) + 'px)';
  }

  // ---------- SCROLL VERTICAL (dentro de una diapositiva alta) ----------
  function volverArriba() {
    var top = stage.getBoundingClientRect().top + window.scrollY;
    if (EMBEBIDO) {
      window.parent.postMessage({ tipo: 'scrollTo', top: top }, '*');
    } else {
      var destino = Math.max(0, top - navbar.offsetHeight);
      if (window.scrollY > destino) {
        window.scrollTo({ top: destino, behavior: mqReduce.matches ? 'auto' : 'smooth' });
      }
    }
  }

  function scrollAElemento(el) {
    var top = el.getBoundingClientRect().top + window.scrollY;
    if (EMBEBIDO) {
      window.parent.postMessage({ tipo: 'scrollTo', top: top }, '*');
    } else {
      window.scrollTo({
        top: Math.max(0, top - navbar.offsetHeight - 16),
        behavior: mqReduce.matches ? 'auto' : 'smooth'
      });
    }
  }

  // ---------- CAMBIO DE DIAPOSITIVA ----------
  function terminar() {
    clearTimeout(timerFin);
    ocupado = false;
    ajustarAltura();
    notificarAltura();
    var cb = alTerminarCb;
    alTerminarCb = null;
    if (cb) cb();
  }

  function ir(destino, opts) {
    opts = opts || {};
    destino = Math.max(0, Math.min(slides.length - 1, destino));
    cerrarMenu();
    if (destino === actual) return false;

    var distancia = Math.abs(destino - actual);
    var instantaneo = opts.instantaneo || mqReduce.matches;
    var dur = instantaneo ? 0 : Math.min(DURACION_MS + (distancia - 1) * 110, 1100);

    actual = destino;
    marcarActiva();

    // Si había una animación en curso, se reemplaza (la transición retoma desde donde va).
    alTerminarCb = opts.alTerminar || null;
    track.style.transitionDuration = dur + 'ms';
    stage.style.transitionDuration = dur + 'ms';
    slides.forEach(function (s) { s.style.transitionDuration = dur + 'ms'; });

    track.style.transform = 'translate3d(' + (-actual * 100) + '%, 0, 0)';
    stage.style.height = alturaActiva() + 'px';

    if (!opts.sinScroll) volverArriba();
    if (!opts.sinFoco) {
      try { slides[actual].focus({ preventScroll: true }); } catch (e) { /* navegadores antiguos */ }
    }

    ocupado = dur > 0;
    clearTimeout(timerFin);
    if (ocupado) timerFin = setTimeout(terminar, dur + 40);
    else terminar();
    return true;
  }

  // Siguiente/anterior sección del menú (saltando subpáginas). Devuelve -1 si no hay.
  function vecina(dir) {
    var desde = slides.indexOf(seccionDe(slides[actual]));
    for (var k = desde + dir; k >= 0 && k < slides.length; k += dir) {
      if (!esSub(slides[k])) return k;
    }
    return -1;
  }

  // ---------- DESTINO DENTRO DE UNA DIAPOSITIVA (p. ej. #CentroAtencion) ----------
  function resaltar(el) {
    var details = el.closest('details');
    if (details && !details.open) details.open = true;
    el.classList.remove('summary-highlight');
    void el.offsetWidth;                       // reinicia la animación
    el.classList.add('summary-highlight');
    setTimeout(function () { el.classList.remove('summary-highlight'); }, 2400);
  }

  function irAElemento(destino, opts) {
    opts = opts || {};
    var slide = diapositivaDe(destino);
    if (!slide) return false;
    var interno = destino !== slide;
    function despues() {
      if (!interno) return;
      resaltar(destino);
      ajustarAltura();                         // el <details> acaba de abrirse
      notificarAltura();
      if (!opts.sinScroll) scrollAElemento(destino);
    }
    var cambio = ir(slides.indexOf(slide), {
      instantaneo: opts.instantaneo,
      sinScroll: interno || opts.sinScroll,
      sinFoco: opts.sinFoco,
      alTerminar: despues
    });
    if (!cambio) despues();                    // ya estaba en esa diapositiva
    return true;
  }

  // ---------- CLICS EN ENLACES INTERNOS (#...) ----------
  page.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    if (a.hasAttribute('data-volver')) {             // "Volver" de una subpágina compartida
      e.preventDefault();
      irAElemento(seccionDe(slides[actual]));
      return;
    }
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    var destino = document.getElementById(href.slice(1));
    if (!destino || !diapositivaDe(destino)) return;
    e.preventDefault();
    cerrarMenu();
    irAElemento(destino);
  });

  // ---------- RUEDA DEL MOUSE / TRACKPAD ----------
  var acum = 0, ultimoWheel = 0, bloqueoHasta = 0;

  function puedeScrollHorizontal(el, dir) {
    while (el && el !== page) {
      if (el.scrollWidth > el.clientWidth + 1) {
        var ox = window.getComputedStyle(el).overflowX;
        if (ox === 'auto' || ox === 'scroll') {
          if (dir > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
          if (dir < 0 && el.scrollLeft > 0) return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  page.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;                                   // zoom con ctrl + rueda / pellizco
    var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    var delta = horizontal ? e.deltaX : e.deltaY;
    if (!delta) return;
    var dir = delta > 0 ? 1 : -1;

    if (horizontal) {
      if (puedeScrollHorizontal(e.target, dir)) return;      // tablas con scroll lateral propio
    } else {
      if (EMBEBIDO && !RUEDA_VERTICAL_EN_IFRAME) return;     // el scroll vertical es de la página contenedora
      var r = stage.getBoundingClientRect();
      var p = page.getBoundingClientRect();
      // Mientras quede contenido por ver en esta diapositiva, el scroll normal de la página manda.
      if (dir > 0 && r.bottom > window.innerHeight + 2) return;
      if (dir < 0 && p.top < -2) return;
    }

    var destino = vecina(dir);
    if (destino < 0) return;                                 // primera/última: scroll normal

    e.preventDefault();
    var ahora = Date.now();
    if (ocupado || ahora < bloqueoHasta) {                   // absorbe la inercia del trackpad
      bloqueoHasta = ahora + 150;
      return;
    }
    if (ahora - ultimoWheel > 200 || (acum !== 0 && (acum > 0) !== (delta > 0))) acum = 0;
    ultimoWheel = ahora;
    acum += delta;
    if (Math.abs(acum) >= UMBRAL_RUEDA) {
      acum = 0;
      ir(destino);
      bloqueoHasta = Date.now() + 150;
    }
  }, { passive: false });

  // ---------- DESLIZAR CON EL DEDO ----------
  var tx = 0, ty = 0, tactil = false;
  stage.addEventListener('touchstart', function (e) {
    tactil = e.touches.length === 1 && !(e.target.closest && e.target.closest('.course-table-wrap, .lecciones-wrap'));
    if (tactil) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!tactil) return;
    tactil = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - tx, dy = t.clientY - ty;
    if (ocupado) return;
    if (Math.abs(dx) < UMBRAL_SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var destino = vecina(dx < 0 ? 1 : -1);
    if (destino >= 0) ir(destino);
  }, { passive: true });

  // ---------- TECLADO ----------
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { cerrarMenu(true); return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || ocupado) return;
    var t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    var p = page.getBoundingClientRect();
    if (p.bottom <= 0 || p.top >= window.innerHeight) return;   // el componente no está a la vista
    var destino = vecina(e.key === 'ArrowRight' ? 1 : -1);
    if (destino >= 0) ir(destino);
  });

  // ---------- MENÚ HAMBURGUESA ----------
  function abrirMenu() {
    if (!menu || !toggle) return;
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
  }
  function cerrarMenu(devolverFoco) {
    if (!menu || !toggle || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    if (devolverFoco) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) cerrarMenu(); else abrirMenu();
    });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('is-open') && !navbar.contains(e.target)) cerrarMenu();
    });
  }

  // ---------- AJUSTES AL CAMBIAR EL TAMAÑO / CARGAR CONTENIDO ----------
  window.addEventListener('resize', function () {
    if (window.innerWidth > BREAKPOINT_MOVIL) cerrarMenu();
    moverIndicador();
    if (!ocupado) ajustarAltura();
  });
  if (window.ResizeObserver) {
    // Las tablas se cargan de forma asíncrona y los <details> se abren/cierran: la altura se recalcula.
    var ro = new ResizeObserver(function () { if (!ocupado) ajustarAltura(); });
    slides.forEach(function (s) { ro.observe(s); });
  }
  window.addEventListener('load', function () { if (!ocupado) { ajustarAltura(); notificarAltura(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);

  // ---------- ENLACES CON #hash (al cargar y al cambiar) ----------
  function desdeHash(instantaneo) {
    var id = '';
    try { id = decodeURIComponent((window.location.hash || '').slice(1)); } catch (e) { return false; }
    var el = id ? document.getElementById(id) : null;
    if (!el || !diapositivaDe(el) || !page.contains(el)) return false;
    return irAElemento(el, { instantaneo: instantaneo, sinScroll: instantaneo, sinFoco: instantaneo });
  }
  window.addEventListener('hashchange', function () { desdeHash(false); });

  // ---------- INICIO ----------
  marcarActiva();
  ajustarAltura();
  if (indicador) {
    moverIndicador();
    requestAnimationFrame(function () { indicador.classList.add('is-ready'); });
  }
  desdeHash(true);

  // Seguro: si el navegador desplazó el contenedor por un ancla, se vuelve a alinear.
  stage.addEventListener('scroll', function () { if (stage.scrollLeft) stage.scrollLeft = 0; });
})();
