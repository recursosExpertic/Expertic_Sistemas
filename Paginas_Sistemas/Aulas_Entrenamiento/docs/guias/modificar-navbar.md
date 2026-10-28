# Guía: modificar estilos o comportamiento del navbar

**Propósito:** localizar qué editar para cambiar el navbar.
**Cuándo leerlo:** antes de tocar el menú, el indicador o el menú hamburguesa.
**Relacionados:** [../navegacion.md](../navegacion.md), [../referencia/css.md](../referencia/css.md), [../referencia/js.md](../referencia/js.md)

## Estilos
Editar `css/navbar.css`. Elementos clave: `.ae-page #navbar`, `.nav-inner`, `.nav-logo`, `.nav-toggle` (`#navToggle`), `.nav-links` (`#navLinks`), `.nav-indicator`.

El breakpoint responsive es `@media (max-width: 900px)` y **debe coincidir** con `BREAKPOINT_MOVIL` en `js/navegacion.js`.

## Comportamiento
Editar `js/navegacion.js`. Puntos clave:

- Selección inicial de elementos (`#navbar`, `#navToggle`, `#navLinks`).
- `page.classList.add('is-slider')`.
- `marcarActiva()`: sincroniza `aria-current="page"`.
- `moverIndicador()`.
- `ir()` / `irAElemento()`: cambio de diapositiva y scroll interno.
- Listeners de clicks en `a[href^="#"]`, menú hamburguesa, rueda/teclado/swipe.

Revisar también `js/altura.js` si el cambio afecta la altura calculada.
