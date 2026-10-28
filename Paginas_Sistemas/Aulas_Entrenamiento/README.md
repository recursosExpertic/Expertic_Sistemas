# Aulas_Entrenamiento

Página web estática (HTML, CSS y JavaScript vanilla, sin build step) de la estrategia **Aulas de Entrenamiento** de [ExperTIC](https://expertic.uis.edu.co), Universidad Industrial de Santander (UIS). Centraliza el acceso a Pearson MyLab, McGraw Hill Connect y McGraw Hill ALEKS, los instructivos, los listados de cursos por escuela y el centro de atención.

> Este archivo es el **punto de entrada único** de la documentación. Toda la información detallada vive en [`docs/`](docs/).

## Stack en una línea

HTML + CSS + JS vanilla · cursos leídos desde Google Sheets publicados como TSV · requiere servidor estático (usa `fetch`).

## ¿Qué quiero hacer?

| Si quiero... | Leer |
|---|---|
| Entender qué es el proyecto y a quién sirve | [docs/descripcion-proyecto.md](docs/descripcion-proyecto.md) |
| Ver el árbol de carpetas | [docs/estructura-carpetas.md](docs/estructura-carpetas.md) |
| Saber qué hace un HTML o componente concreto | [docs/referencia/raiz-y-componentes.md](docs/referencia/raiz-y-componentes.md) |
| Saber qué hace un CSS concreto | [docs/referencia/css.md](docs/referencia/css.md) |
| Saber qué hace un JS concreto | [docs/referencia/js.md](docs/referencia/js.md) |
| Entender cómo funciona el slider y la navegación | [docs/navegacion.md](docs/navegacion.md) |
| Agregar una nueva sección | [docs/guias/agregar-seccion.md](docs/guias/agregar-seccion.md) |
| Agregar una plataforma o escuela de cursos | [docs/guias/agregar-plataforma-cursos.md](docs/guias/agregar-plataforma-cursos.md) |
| Modificar el navbar | [docs/guias/modificar-navbar.md](docs/guias/modificar-navbar.md) |
| Configurar Google Sheets / GID | [docs/google-sheets.md](docs/google-sheets.md) |
| Mantener la documentación al día | [docs/guias/mantener-documentacion.md](docs/guias/mantener-documentacion.md) |

## Mapa de la documentación

```text
README.md                          # Índice (este archivo)
docs/
├── descripcion-proyecto.md        # Qué es, problema, público
├── estructura-carpetas.md         # Solo el árbol del repositorio
├── navegacion.md                  # Arquitectura del slider
├── google-sheets.md               # Origen de datos de cursos
├── guias/                         # Procedimientos paso a paso
│   ├── agregar-seccion.md
│   ├── agregar-plataforma-cursos.md
│   ├── modificar-navbar.md
│   └── mantener-documentacion.md
└── referencia/                    # Descripción archivo por archivo
    ├── raiz-y-componentes.md
    ├── css.md
    └── js.md
```

## Convenciones de la documentación

- Un tema por archivo; nombres en kebab-case.
- Cada documento abre con **Propósito**, **Cuándo leerlo** y **Relacionados**.
- Si agregas un archivo a `docs/`, añade una fila a la tabla "¿Qué quiero hacer?" y una línea al mapa. Ver [mantenimiento](docs/guias/mantener-documentacion.md).
- Los enlaces son relativos y apuntan a archivos `.md`.
