import { z } from 'zod';

// Todas las cadenas se recortan; los elementos completamente vacíos se descartan al guardar.
const text = (max = 2000) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const required = (label, max = 300) => text(max).min(1, `${label} es obligatorio`);

const isHttpUrl = v => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};
const urlOrEmpty = text(2000).refine(v => v === '' || isHttpUrl(v), 'Debe ser una URL que empiece por http:// o https://');

export const AsignaturaSchema = z.object({
  nombre: required('El nombre'),
  escuela: required('La escuela'),
  facultad: required('La facultad'),
  codigo: text(50).optional().default(''),
});

const MediaSchema = z.object({
  titulo: text(500).default(''),
  link: text(2000).default(''),
  imagen: text(2000).default(''),
});

const ReferenciaSchema = z.object({
  libro: text(1000).default(''),
  link: text(2000).default(''),
});

const SubtemaSchema = z.object({
  nombre: text(500).default(''),
  referencias: z.array(ReferenciaSchema).default([])
    .transform(refs => refs.filter(r => r.libro || r.link)),
});

const TemaSchema = z.object({
  tema: text(500).default(''),
  subtemas: z.array(SubtemaSchema).default([])
    .transform(subs => subs.filter(s => s.nombre || s.referencias.length)),
});

const stringList = max => z.array(text(max)).default([]).transform(list => list.filter(Boolean));
const mediaList = z.array(MediaSchema).default([])
  .transform(list => list.filter(m => m.titulo || m.link || m.imagen));

export const LeccionSchema = z.object({
  id: z.number().int().positive().optional(),
  clientKey: z.string().max(50).optional(),
  modulo: required('El módulo'),
  leccion: required('El nombre de la lección'),
  resumen_link: urlOrEmpty.default(''),
  competencias: stringList(1000),
  catalogo_videos: mediaList,
  catalogo_simuladores: mediaList,
  catalogo_libros: mediaList,
  bibliografia: z.array(TemaSchema).default([])
    .transform(list => list.filter(t => t.tema || t.subtemas.length)),
  preguntas_autoevaluacion: stringList(2000),
});

export const ContenidoSchema = z.object({
  asignatura: AsignaturaSchema,
  lecciones: z.array(LeccionSchema).default([]),
  eliminadas: z.array(z.number().int().positive()).default([]),
});

export const IdParam = z.coerce.number().int().positive();
