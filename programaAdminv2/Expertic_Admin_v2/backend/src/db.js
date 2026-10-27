import { createClient } from '@libsql/client';
import { config, assertWritableDb } from './config.js';

assertWritableDb(config.dbUrl);

export const client = createClient({ url: config.dbUrl, authToken: config.dbToken });

/**
 * Crea las tablas si no existen y aplica cambios ADITIVOS (no borra ni renombra nada),
 * de modo que el esquema siga siendo compatible con las plantillas actuales.
 */
export async function migrate(db = client) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS asignaturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      escuela TEXT NOT NULL,
      facultad TEXT NOT NULL,
      codigo TEXT
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lecciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asignatura_id INTEGER NOT NULL,
      modulo TEXT NOT NULL,
      leccion TEXT NOT NULL,
      resumen_link TEXT,
      competencias TEXT DEFAULT '[]',
      catalogo_videos TEXT DEFAULT '[]',
      catalogo_simuladores TEXT DEFAULT '[]',
      catalogo_libros TEXT DEFAULT '[]',
      bibliografia TEXT DEFAULT '[]',
      preguntas_autoevaluacion TEXT DEFAULT '[]',
      FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
    )
  `);

  // La versión anterior intentaba "ADD COLUMN codigo TEXT UNIQUE", que SQLite rechaza.
  // Aquí se agrega la columna sin restricción y la unicidad va en un índice aparte.
  const cols = await db.execute('PRAGMA table_info(asignaturas)');
  if (!cols.rows.some(r => r.name === 'codigo')) {
    await db.execute('ALTER TABLE asignaturas ADD COLUMN codigo TEXT');
  }
  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_asignaturas_codigo
    ON asignaturas(codigo) WHERE codigo IS NOT NULL AND codigo <> ''
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_lecciones_asignatura ON lecciones(asignatura_id)');
}
