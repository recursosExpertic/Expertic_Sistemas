import { client } from './db.js';
import { HttpError, notFound } from './errors.js';

export const JSON_FIELDS = [
  'competencias', 'catalogo_videos', 'catalogo_simuladores',
  'catalogo_libros', 'bibliografia', 'preguntas_autoevaluacion',
];

// ---------------------------------------------------------------------------
// Conversión de filas
// ---------------------------------------------------------------------------
function rowsToObjects(rs) {
  return rs.rows.map(row => Object.fromEntries(rs.columns.map((col, i) => [col, row[i]])));
}

function parseArray(value) {
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const str = v => (v == null ? '' : String(v));
const media = m => ({ titulo: str(m?.titulo), link: str(m?.link), imagen: str(m?.imagen) });

// Normaliza el JSON guardado para que el frontend siempre reciba la misma forma.
function toLeccion(row) {
  return {
    id: Number(row.id),
    asignatura_id: Number(row.asignatura_id),
    modulo: str(row.modulo),
    leccion: str(row.leccion),
    resumen_link: str(row.resumen_link),
    competencias: parseArray(row.competencias).map(str),
    catalogo_videos: parseArray(row.catalogo_videos).map(media),
    catalogo_simuladores: parseArray(row.catalogo_simuladores).map(media),
    catalogo_libros: parseArray(row.catalogo_libros).map(media),
    bibliografia: parseArray(row.bibliografia).map(t => ({
      tema: str(t?.tema),
      subtemas: (Array.isArray(t?.subtemas) ? t.subtemas : []).map(s => ({
        nombre: str(s?.nombre),
        referencias: (Array.isArray(s?.referencias) ? s.referencias : [])
          .map(r => ({ libro: str(r?.libro), link: str(r?.link) })),
      })),
    })),
    preguntas_autoevaluacion: parseArray(row.preguntas_autoevaluacion).map(str),
  };
}

function toAsignatura(row) {
  const a = {
    id: Number(row.id),
    nombre: str(row.nombre),
    escuela: str(row.escuela),
    facultad: str(row.facultad),
    codigo: str(row.codigo),
  };
  if (row.total_lecciones !== undefined) a.total_lecciones = Number(row.total_lecciones);
  return a;
}

function translateDbError(err) {
  if (/UNIQUE constraint failed: asignaturas\.codigo/i.test(err?.message ?? '')) {
    return new HttpError(409, 'Ya existe otra asignatura con ese código', [
      { path: ['asignatura', 'codigo'], message: 'Código repetido' },
    ]);
  }
  return err;
}

const escapeLike = q => q.replace(/[\\%_]/g, m => '\\' + m);

// ---------------------------------------------------------------------------
// Asignaturas
// ---------------------------------------------------------------------------
export async function listAsignaturas(q = '') {
  const base = `
    SELECT a.*, (SELECT COUNT(*) FROM lecciones l WHERE l.asignatura_id = a.id) AS total_lecciones
    FROM asignaturas a`;
  const query = q.trim();
  const rs = query
    ? await client.execute({
        sql: `${base}
          WHERE CAST(a.id AS TEXT) = ?
             OR a.nombre LIKE ? ESCAPE '\\' OR a.escuela LIKE ? ESCAPE '\\'
             OR a.facultad LIKE ? ESCAPE '\\' OR a.codigo LIKE ? ESCAPE '\\'
          ORDER BY a.nombre COLLATE NOCASE`,
        args: [query, ...Array(4).fill(`%${escapeLike(query)}%`)],
      })
    : await client.execute(`${base} ORDER BY a.nombre COLLATE NOCASE`);
  return rowsToObjects(rs).map(toAsignatura);
}

export async function getAsignaturaCompleta(id) {
  const [asig, lecs] = await client.batch([
    { sql: 'SELECT * FROM asignaturas WHERE id = ?', args: [id] },
    { sql: 'SELECT * FROM lecciones WHERE asignatura_id = ? ORDER BY id', args: [id] },
  ], 'read');
  const [row] = rowsToObjects(asig);
  if (!row) throw notFound('Asignatura');
  return { asignatura: toAsignatura(row), lecciones: rowsToObjects(lecs).map(toLeccion) };
}

export async function createAsignatura({ nombre, escuela, facultad, codigo }) {
  try {
    const rs = await client.execute({
      sql: 'INSERT INTO asignaturas (nombre, escuela, facultad, codigo) VALUES (?, ?, ?, ?)',
      args: [nombre, escuela, facultad, codigo || null],
    });
    return Number(rs.lastInsertRowid);
  } catch (err) {
    throw translateDbError(err);
  }
}

export async function deleteAsignatura(id) {
  // Se borran las lecciones explícitamente: no dependemos de que PRAGMA foreign_keys esté activo.
  const [, del] = await client.batch([
    { sql: 'DELETE FROM lecciones WHERE asignatura_id = ?', args: [id] },
    { sql: 'DELETE FROM asignaturas WHERE id = ?', args: [id] },
  ], 'write');
  if (del.rowsAffected === 0) throw notFound('Asignatura');
}

// ---------------------------------------------------------------------------
// Guardado completo (asignatura + lecciones) en UNA transacción:
// o se guarda todo, o no se guarda nada.
// ---------------------------------------------------------------------------
export async function saveContenido(id, { asignatura, lecciones, eliminadas }) {
  const tx = await client.transaction('write');
  try {
    const upd = await tx.execute({
      sql: 'UPDATE asignaturas SET nombre = ?, escuela = ?, facultad = ?, codigo = ? WHERE id = ?',
      args: [asignatura.nombre, asignatura.escuela, asignatura.facultad, asignatura.codigo || null, id],
    });
    if (upd.rowsAffected === 0) throw notFound('Asignatura');

    for (const leccionId of eliminadas) {
      await tx.execute({
        sql: 'DELETE FROM lecciones WHERE id = ? AND asignatura_id = ?',
        args: [leccionId, id],
      });
    }

    const creadas = [];
    for (const lec of lecciones) {
      const values = [lec.modulo, lec.leccion, lec.resumen_link, ...JSON_FIELDS.map(f => JSON.stringify(lec[f]))];
      if (lec.id) {
        const rs = await tx.execute({
          sql: `UPDATE lecciones SET modulo = ?, leccion = ?, resumen_link = ?,
                  ${JSON_FIELDS.map(f => `${f} = ?`).join(', ')}
                WHERE id = ? AND asignatura_id = ?`,
          args: [...values, lec.id, id],
        });
        if (rs.rowsAffected === 0) {
          throw new HttpError(409, `La lección "${lec.leccion}" ya no existe. Recarga la página.`);
        }
      } else {
        const rs = await tx.execute({
          sql: `INSERT INTO lecciones (asignatura_id, modulo, leccion, resumen_link, ${JSON_FIELDS.join(', ')})
                VALUES (?, ?, ?, ?, ${JSON_FIELDS.map(() => '?').join(', ')})`,
          args: [id, ...values],
        });
        creadas.push({ clientKey: lec.clientKey, id: Number(rs.lastInsertRowid) });
      }
    }

    await tx.commit();
    return creadas;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw translateDbError(err);
  } finally {
    tx.close();
  }
}
