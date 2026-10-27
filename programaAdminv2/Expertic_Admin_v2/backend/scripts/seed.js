/** Inserta datos de ejemplo SOLO si la base está vacía. Útil para probar sin copiar producción. */
import { config, describeDb } from '../src/config.js';
import { client, migrate } from '../src/db.js';
import { createAsignatura, saveContenido } from '../src/repo.js';
import { ContenidoSchema } from '../src/schemas.js';

await migrate();

const rs = await client.execute('SELECT COUNT(*) AS n FROM asignaturas');
if (Number(rs.rows[0].n) > 0) {
  console.log('La base ya tiene datos; no se insertó nada.');
  process.exit(0);
}

const asignatura = { nombre: 'Matemáticas', escuela: 'Ciencias Básicas', facultad: 'Ingeniería', codigo: 'MAT-101' };
const id = await createAsignatura(asignatura);

await saveContenido(id, ContenidoSchema.parse({
  asignatura,
  lecciones: [
    {
      modulo: 'Módulo 1: Funciones',
      leccion: 'Funciones lineales',
      resumen_link: 'https://es.wikipedia.org/wiki/Funci%C3%B3n_lineal',
      competencias: ['Interpreta la pendiente como razón de cambio', 'Grafica funciones lineales'],
      catalogo_videos: [{ titulo: 'Introducción a funciones lineales', link: 'https://www.youtube.com/', imagen: '' }],
      catalogo_simuladores: [{ titulo: 'Graficador', link: 'https://www.geogebra.org/graphing', imagen: '' }],
      catalogo_libros: [],
      bibliografia: [{
        tema: 'Funciones',
        subtemas: [{ nombre: 'Pendiente', referencias: [{ libro: 'Stewart, Cálculo', link: '' }] }],
      }],
      preguntas_autoevaluacion: ['¿Qué representa la pendiente de una recta?'],
    },
    { modulo: 'Módulo 1: Funciones', leccion: 'Funciones cuadráticas' },
    { modulo: 'Módulo 2: Límites', leccion: 'Concepto de límite' },
  ],
}));

await createAsignatura({ nombre: 'Física', escuela: 'Ciencias Básicas', facultad: 'Ingeniería', codigo: 'FIS-101' });
console.log(`Datos de ejemplo creados en ${describeDb(config.dbUrl)}.`);
