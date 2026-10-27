/**
 * Copia asignaturas y lecciones desde la base de producción (SOLO LECTURA)
 * hacia la base de este proyecto (DATABASE_URL o el archivo local).
 *
 *   npm run copy-from-prod            → copia si el destino está vacío
 *   npm run copy-from-prod -- --force → vacía el destino y vuelve a copiar
 *
 * Sobre el origen solo se ejecutan SELECT. Nunca se escribe en producción.
 */
import { createClient } from '@libsql/client';
import { config, describeDb } from '../src/config.js';
import { client as target, migrate } from '../src/db.js';
import { JSON_FIELDS } from '../src/repo.js';

const force = process.argv.includes('--force');

if (!config.sourceUrl || !config.sourceToken) {
  console.error('Falta SOURCE_DATABASE_URL o SOURCE_AUTH_TOKEN en backend/.env (ver README).');
  process.exit(1);
}
if (config.sourceUrl === config.dbUrl) {
  console.error('El origen y el destino son la misma base. Revisa DATABASE_URL.');
  process.exit(1);
}

const source = createClient({ url: config.sourceUrl, authToken: config.sourceToken });

const toObjects = rs => rs.rows.map(r => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));

console.log(`Leyendo de ${describeDb(config.sourceUrl)} (solo lectura)…`);
const asignaturas = toObjects(await source.execute('SELECT * FROM asignaturas ORDER BY id'));
const lecciones = toObjects(await source.execute('SELECT * FROM lecciones ORDER BY id'));
source.close();
console.log(`  ${asignaturas.length} asignaturas, ${lecciones.length} lecciones`);

await migrate();

const [{ total }] = toObjects(await target.execute(
  'SELECT (SELECT COUNT(*) FROM asignaturas) + (SELECT COUNT(*) FROM lecciones) AS total'
));
if (Number(total) > 0 && !force) {
  console.error(`\nEl destino (${describeDb(config.dbUrl)}) ya tiene datos.`);
  console.error('Si quieres reemplazarlos por la copia de producción ejecuta:  npm run copy-from-prod -- --force');
  process.exit(1);
}

const stmts = [
  'DELETE FROM lecciones',
  'DELETE FROM asignaturas',
  ...asignaturas.map(a => ({
    sql: 'INSERT INTO asignaturas (id, nombre, escuela, facultad, codigo) VALUES (?, ?, ?, ?, ?)',
    args: [a.id, a.nombre, a.escuela, a.facultad, a.codigo || null],
  })),
  ...lecciones.map(l => ({
    sql: `INSERT INTO lecciones (id, asignatura_id, modulo, leccion, resumen_link, ${JSON_FIELDS.join(', ')})
          VALUES (?, ?, ?, ?, ?, ${JSON_FIELDS.map(() => '?').join(', ')})`,
    args: [l.id, l.asignatura_id, l.modulo, l.leccion, l.resumen_link ?? '', ...JSON_FIELDS.map(f => l[f] ?? '[]')],
  })),
];

// batch 'write' = una sola transacción: si algo falla no queda una copia a medias.
await target.batch(stmts, 'write');
console.log(`\n✔ Copia terminada en ${describeDb(config.dbUrl)}.`);
