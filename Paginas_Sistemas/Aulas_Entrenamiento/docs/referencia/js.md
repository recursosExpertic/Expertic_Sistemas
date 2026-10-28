# Referencia: scripts JavaScript

**Propósito:** describir la responsabilidad y los parámetros clave de cada script.
**Cuándo leerlo:** antes de modificar comportamiento, carga de datos o integración con iframe.
**Relacionados:** [../navegacion.md](../navegacion.md), [../google-sheets.md](../google-sheets.md)

## `altura.js`
Define `window.aeEnviarAltura()`.

- Calcula la altura con `document.querySelector('.ae-page')` o `document.body` usando `getBoundingClientRect().bottom + window.pageYOffset`.
- Evita envíos repetidos comparando con `ultima`.
- Envía `postMessage({ tipo: 'setAltura', altura: altura }, '*')` si `window.parent !== window`.
- Se engancha a `load`, `resize` y a un `MutationObserver` sobre `document.body`.

## `cargador-componentes.js`
Orquestador de carga.

- `SCRIPTS = ["js/navegacion.js", "js/cursos_mylab.js", "js/cursos_connect.js", "js/cursos_aleks.js", "js/altura.js"]`.
- `cargarComponente(el)`: `fetch(el.dataset.component)`, parsea con `DOMParser`, extrae `section.slide`, adopta con `document.adoptNode` y reemplaza el placeholder directamente en `#slidesTrack`.
- `cargarScript(src)`: crea `<script src>` dinámicamente.
- `iniciar()`: procesa todos los `[data-component]` con `Promise.all`, carga `SCRIPTS` en orden, dispara `DOMContentLoaded` y `componentes:listos`, y hace `scrollIntoView()` si hay `location.hash`.

## `navegacion.js`
Controlador del slider.

- Config: `DURACION_MS = 650`, `UMBRAL_RUEDA = 40`, `UMBRAL_SWIPE = 60`, `BREAKPOINT_MOVIL = 900`, `RUEDA_VERTICAL_EN_IFRAME = false`.
- Requiere `.ae-page`, `#slides`, `#slidesTrack`, `#navbar`.
- Recoge `slides`, `links` (`.nav-links a`) e `indicador` (`.nav-indicator`).
- Añade `is-slider` a `.ae-page` y `tabindex='-1'` a los slides.
- Gestiona: `ir(destino, opts)`, indicador, altura (`ajustarAltura()` + `window.aeEnviarAltura()`), hash/clicks, subpáginas `data-sub`/`data-padre`, scroll interno, rueda/teclado/swipe, menú hamburguesa (`#navToggle`, `#navLinks`) e iframe.

Detalle del flujo en [../navegacion.md](../navegacion.md).

## Scripts de cursos
Los tres siguen la misma lógica: buscan `[data-escuela="..."]`, descargan `BASE_TSV&gid=<gid>`, parsean el TSV y pintan `<details><summary>…</summary><div class="details-body">…tabla…</div></details>`.

| Script | Plataforma | Escuelas en `SCHOOLS` | Notas |
|---|---|---|---|
| `cursos_connect.js` | Connect | `e3t_C`, `mat_C`, `fis_C`, `qui_C`, `bio_C` | Tiene además `LIBROS_TSV` y `agregarLibrosBiologia()` para Biología. |
| `cursos_aleks.js` | ALEKS | `fis_M` | `gid: 0`. |
| `cursos_mylab.js` | MyLab | `mat_A` | `gid: 0`. |

Valores de `BASE_TSV`, GID y procedimiento de edición en [../google-sheets.md](../google-sheets.md).
