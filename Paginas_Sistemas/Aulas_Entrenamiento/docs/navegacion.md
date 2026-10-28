# Cómo funciona la navegación

**Propósito:** explicar la arquitectura de carga de componentes y del slider.
**Cuándo leerlo:** antes de tocar `cargador-componentes.js`, `navegacion.js` o `altura.js`.
**Relacionados:** [referencia/js.md](referencia/js.md), [guias/modificar-navbar.md](guias/modificar-navbar.md)

## 1. Estructura base
`Aulas_Entrenamiento.html`: `.ae-page` contiene `nav#navbar`, `.slides#slides` con `.slides-track#slidesTrack` y placeholders `<div data-component="..."></div>`, el `footer` y `script src="js/cargador-componentes.js"`.

## 2. Inyección de componentes
`js/cargador-componentes.js`:

1. Busca `[data-component]` y hace `fetch` de cada ruta.
2. Parsea con `DOMParser` y extrae **únicamente** `section.slide`.
3. Adopta los nodos con `document.adoptNode` y reemplaza cada placeholder por esos `section.slide` dentro de `#slidesTrack` (**un único track** con todas las diapositivas).
4. Carga los scripts de `SCRIPTS` en orden y dispara `DOMContentLoaded` + `componentes:listos`.
5. Si hay `location.hash`, hace `scrollIntoView()` sobre el destino.

## 3. Control del slider
`js/navegacion.js`:

- Toma `#slides`, `#slidesTrack`, `.ae-page`, `#navbar` y añade `.is-slider` a `.ae-page`.
- Mantiene `actual` (índice) y anima con `transform: translate3d(-actual*100%, 0, 0)` en el track.
- Ajusta la altura con `stage.style.height = alturaActiva() + 'px'`.
- Marca la diapositiva activa con `.is-active`, gestiona `inert`/`aria-hidden`, actualiza `aria-current="page"` y mueve el indicador.

## 4. Enlaces, hash e interacción
- Escucha clicks en `a[href^="#"]` dentro de `.ae-page`, resuelve el destino y llama a `ir()` o `irAElemento()`.
- Subpáginas con `data-sub` y `data-padre`: se marca la sección padre en el menú.
- Maneja rueda, teclado, swipe (umbrales `UMBRAL_RUEDA`/`UMBRAL_SWIPE`) y menú hamburguesa.

## 5. Altura / iframe
`js/altura.js` envía la altura al contenedor padre para ajustar el iframe cuando aplica.

## Orden de ejecución

```text
HTML carga → cargador-componentes.js → fetch de componentes → inyección en #slidesTrack
→ navegacion.js → cursos_mylab.js → cursos_connect.js → cursos_aleks.js → altura.js
→ eventos DOMContentLoaded + componentes:listos → scrollIntoView() si hay hash
```
