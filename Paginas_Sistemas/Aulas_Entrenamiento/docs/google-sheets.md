# Configuración de Google Sheets

**Propósito:** documentar el origen de datos de los listados de cursos y cómo editarlo.
**Cuándo leerlo:** al cambiar una hoja, un GID o agregar una escuela.
**Relacionados:** [guias/agregar-plataforma-cursos.md](guias/agregar-plataforma-cursos.md), [referencia/js.md](referencia/js.md)

Los archivos `js/cursos_connect.js`, `js/cursos_aleks.js` y `js/cursos_mylab.js` obtienen datos de Google Sheets publicados como TSV: `BASE_TSV` + `&gid=<GID>`.

## Pasos
1. **Publicar la hoja como TSV:** `Archivo > Publicar en web` > elegir la hoja/pestaña > tipo `Valores separados por tabulaciones (.tsv)` > Publicar. La URL debe terminar en `pub?output=tsv`.
2. **Copiar el GID:** en la URL de edición, buscar `gid=`. Ejemplo: `https://docs.google.com/spreadsheets/d/<ID>/edit#gid=2547548` → GID `2547548`.
3. **Pegar el GID** en el objeto de `SCHOOLS` del JS de esa plataforma.
4. **Asegurar coincidencia:** `escuela` debe coincidir exactamente con `data-escuela="..."` en el HTML.

Formato del GID: numérico, sin comillas (`123456789`).

## Dónde va en el código

### `js/cursos_connect.js`
```js
const BASE_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vROVAjcR21cudmX98yuu4YqqIqdMPTfG9xXK1mJkSNUfGkSjcccqAn8UzjW2OcIVC0tlgvozS3nMKRj/pub?output=tsv';

const SCHOOLS = [
  { gid: 2547548,   escuela: 'e3t_C', title: 'Escuela E3T',            tableClass: 'table-e3t' },
  { gid: 704898453, escuela: 'mat_C', title: 'Escuela de Matemáticas', tableClass: 'table-matematicas' },
  { gid: 915914968, escuela: 'fis_C', title: 'Escuela de Física',      tableClass: 'table-fisica' },
  { gid: 373143542, escuela: 'qui_C', title: 'Escuela de Química',     tableClass: 'table-quimica' },
  { gid: 405299746, escuela: 'bio_C', title: 'Escuela de Biología',    tableClass: 'table-biologia' }
];
```

### `js/cursos_aleks.js`
```js
const BASE_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTH_aN2fgxf7zeCX5TjpRYEQkDBABfJOrL0tqM4Z271wQ1KiHztPZ20zixOurKiGrVTEuM-0BSbe6T/pub?output=tsv';

const SCHOOLS = [
  { gid: 0, escuela: 'fis_M', title: 'Escuela de Física', tableClass: 'table-fisica' }
];
```
Cambiar `gid: 0` por el GID numérico de la hoja de ALEKS.

### `js/cursos_mylab.js`
```js
const BASE_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMCx0EUCAKcQ1pdieKhy308JhhXUnNZ_R9qEQsQKtiGUtzm7_-rsvg1JsX46jWxX7W3gZILdZreLBb/pub?output=tsv';

const SCHOOLS = [
  { gid: 0, escuela: 'mat_A', title: 'Escuela de Matemáticas', tableClass: 'table-matematicas' }
];
```
Cambiar `gid: 0` por el GID numérico de la hoja de MyLab.
