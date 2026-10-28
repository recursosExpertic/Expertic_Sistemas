# Referencia: HTML raíz y componentes

**Propósito:** describir qué contiene y qué responsabilidad tiene cada archivo HTML.
**Cuándo leerlo:** antes de editar contenido o la estructura base.
**Relacionados:** [../navegacion.md](../navegacion.md), [../guias/agregar-seccion.md](../guias/agregar-seccion.md)

## Raíz

### `Aulas_Entrenamiento.html`
Documento principal.

- Carga fuentes de Google Fonts y todos los CSS: `base`, `navbar`, `inicio`, `plataformas`, `connect`, `dudas`, `sobre-nosotros`, `footer`.
- Define el wrapper `.ae-page`.
- Define `nav#navbar` con enlaces a `#inicio`, `#quiero-empezar`, `#ya-soy-miembro`, `#dudas`, `#sobre-nosotros`.
- Define el contenedor del slider `.slides#slides > .slides-track#slidesTrack` con placeholders `<div data-component="..."></div>`.
- Incluye el `footer` y carga `js/cargador-componentes.js` al final de `.ae-page`.

## `componentes/`

El cargador **solo extrae `section.slide`** de cada archivo; cualquier otro nodo se ignora.

| Archivo | Contenido |
|---|---|
| `inicio.html` | Sección inicio. Al menos `<section class="slide" id="inicio">`. |
| `sobre-nosotros.html` | `<section class="slide" id="sobre-nosotros">`. |
| `quiero-empezar.html` | `#quiero-empezar` y sus subpáginas (`section.slide` con `data-sub` y `data-padre`, p. ej. `#connect`, `#pearson`, `#aleks`). |
| `ya-soy-miembro.html` | `#ya-soy-miembro`. |
| `dudas.html` | `#dudas`: centro de atención y preguntas frecuentes. |
