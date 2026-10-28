# Descripción del proyecto

**Propósito:** explicar qué es Aulas_Entrenamiento, qué problema resuelve y a quién va dirigido.
**Cuándo leerlo:** primer contacto con el proyecto.
**Relacionados:** [estructura-carpetas.md](estructura-carpetas.md), [navegacion.md](navegacion.md)

## Qué es

Un sitio de una sola página, con navegación por secciones/diapositivas, que centraliza la información de las Aulas de Entrenamiento de [ExperTIC](https://expertic.uis.edu.co) (UIS). Está hecho con HTML, CSS y JavaScript vanilla, sin build step.

## Qué problema resuelve

Unifica en un solo sitio:

- El acceso a las plataformas de cursos: Pearson MyLab, McGraw Hill Connect y McGraw Hill ALEKS.
- Los instructivos de inscripción/matriculación.
- Los listados de cursos por escuela.
- El centro de atención y dudas.

## A quién va dirigido

Estudiantes de la UIS que participan en las Aulas de Entrenamiento de ExperTIC y necesitan acceder a las plataformas, consultar sus cursos por escuela o seguir los instructivos.

## Restricciones técnicas

- Sin build step ni herramientas de documentación.
- Debe servirse desde un servidor estático porque los componentes se cargan con `fetch`.
- Puede incrustarse en un iframe (ver [referencia/js.md](referencia/js.md#altura-js)).
