# Guía: mantener la documentación

**Propósito:** reglas para que la documentación siga siendo navegable.
**Cuándo leerlo:** al agregar, mover o eliminar archivos en `docs/`.
**Relacionados:** [../../README.md](../../README.md)

## Reglas
1. **Un tema por archivo**, nombre en kebab-case.
2. **Encabezado fijo:** Propósito, Cuándo leerlo, Relacionados.
3. **Sin duplicar información:** cada dato vive en un solo archivo; los demás enlazan.
4. **Todo archivo nuevo se registra en `README.md`:** una fila en "¿Qué quiero hacer?" y una línea en el mapa.
5. **Enlaces relativos a `.md`.**
6. **Si un archivo supera ~200 líneas**, dividirlo en una subcarpeta.

## Qué tocar según el cambio

| Cambio en el proyecto | Documentos a actualizar |
|---|---|
| Nueva sección | `estructura-carpetas.md`, `referencia/raiz-y-componentes.md` (+ `referencia/css.md` si hay CSS) |
| Nueva escuela/plataforma | `referencia/js.md`, `google-sheets.md` |
| Cambio en el slider | `navegacion.md`, `referencia/js.md` |
| Nuevo documento en `docs/` | `README.md` |
