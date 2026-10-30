# Guía: agregar una plataforma o escuela de cursos

**Propósito:** pasos para mostrar un nuevo listado de cursos.
**Cuándo leerlo:** al añadir una escuela a una plataforma existente o una plataforma nueva.
**Relacionados:** [../google-sheets.md](../google-sheets.md), [../referencia/js.md](../referencia/js.md)

## Archivo JS según plataforma
- **Connect:** `js/cursos_connect.js` (múltiples escuelas)
- **MyLab:** `js/cursos_mylab.js`
- **ALEKS:** `js/cursos_aleks.js`

## Pasos
1. **Publicar la hoja** como TSV y obtener el GID (ver [google-sheets.md](../google-sheets.md)).
2. **Editar `SCHOOLS`** en el JS de la plataforma: añadir `{ gid, escuela, title, tableClass }`.
   - `escuela`: clave usada en `data-escuela="..."`.
   - `title`: texto del `<summary>`.
   - `tableClass`: clase del `<table>`.
3. **Agregar el contenedor** en el componente donde deba mostrarse (p. ej. dentro de la subpágina en `componentes/quiero-empezar.html` y `componentes/ya-soy-miembro.html`): `<div data-escuela="<valor-escuela>"></div>`.
4. **Verificar:** tras cargar los componentes, los scripts de cursos pintan los contenedores.
5. **Documentar:** actualizar la tabla de escuelas en [referencia/js.md](../referencia/js.md) y los ejemplos en [google-sheets.md](../google-sheets.md).

## Archivos que se tocan
`js/cursos_<plataforma>.js` · componente HTML con el contenedor · (si es plataforma nueva) `SCRIPTS` en `js/cargador-componentes.js`.
