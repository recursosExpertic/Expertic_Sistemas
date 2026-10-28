# Guía: agregar una nueva sección

**Propósito:** pasos para añadir una diapositiva/sección al sitio.
**Cuándo leerlo:** al crear una sección nueva.
**Relacionados:** [../navegacion.md](../navegacion.md), [../referencia/raiz-y-componentes.md](../referencia/raiz-y-componentes.md), [mantener-documentacion.md](mantener-documentacion.md)

## Archivos que se tocan
`componentes/<nombre>.html` (nuevo) · `Aulas_Entrenamiento.html` · opcionalmente `css/<nombre>.css`.

## Pasos
1. **Crear el componente** `componentes/<nombre-seccion>.html` con al menos un `<section class="slide" id="<id-seccion>">…</section>`. El cargador solo extrae `section.slide`.
2. **Agregar al track:** en `Aulas_Entrenamiento.html`, dentro de `<div class="slides-track" id="slidesTrack">`, añadir `<div data-component="componentes/<nombre-seccion>.html"></div>`. El orden de los placeholders define el orden de las diapositivas.
3. **Agregar al navbar:** en `#navbar .nav-links`, añadir `<li><a href="#<id-seccion>">Nombre visible</a></li>` si debe aparecer en el menú.
4. **Estilos (opcional):** crear `css/<nombre>.css` y enlazarlo en el `<head>` de `Aulas_Entrenamiento.html`.
5. **Verificar:** abrir la página desde un servidor (usa `fetch`). El placeholder debe sustituirse por la `section.slide`.
6. **Documentar:** actualizar [estructura-carpetas](../estructura-carpetas.md), [referencia/raiz-y-componentes](../referencia/raiz-y-componentes.md) y, si hay CSS nuevo, [referencia/css](../referencia/css.md).
