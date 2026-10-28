# Estructura de carpetas

**Propósito:** mostrar el árbol del repositorio. La descripción de cada archivo está en `referencia/`.
**Cuándo leerlo:** para ubicar dónde vive algo.
**Relacionados:** [referencia/raiz-y-componentes.md](referencia/raiz-y-componentes.md), [referencia/css.md](referencia/css.md), [referencia/js.md](referencia/js.md)

```text
Aulas_Entrenamiento/
├── README.md                       # Índice de documentación
├── docs/                           # Documentación (ver README)
├── Aulas_Entrenamiento.html        # Shell principal de la página
├── componentes/                    # Fragmentos HTML por sección (inyectados al track)
│   ├── dudas.html                  # Centro de atención y FAQ
│   ├── inicio.html                 # Hero y botones
│   ├── quiero-empezar.html         # Selección de plataformas + subpáginas
│   ├── sobre-nosotros.html         # Sobre nosotros
│   └── ya-soy-miembro.html         # Ya soy miembro
├── css/                            # Hojas de estilo por bloque
│   ├── base.css
│   ├── connect.css
│   ├── dudas.css
│   ├── footer.css
│   ├── inicio.css
│   ├── navbar.css
│   ├── plataformas.css
│   └── sobre-nosotros.css
└── js/                             # Lógica cliente (vanilla)
    ├── altura.js
    ├── cargador-componentes.js
    ├── cursos_aleks.js
    ├── cursos_connect.js
    ├── cursos_mylab.js
    └── navegacion.js
```

## Dónde buscar según el tipo de cambio

| Tipo de cambio | Carpeta |
|---|---|
| Contenido de una sección | `componentes/` |
| Apariencia | `css/` |
| Comportamiento, carga de datos | `js/` |
| Orden de diapositivas, menú, scripts globales | `Aulas_Entrenamiento.html` |
