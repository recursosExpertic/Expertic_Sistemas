# Administrador Académico v2

Nueva versión del administrador de asignaturas y lecciones. Es un proyecto **independiente**
del repositorio `Expertic_Sistemas`: no modifica el admin actual, las plantillas ni la base de datos de producción.

```
Expertic_Admin_v2/
├── backend/                 API en Node.js (Express). Aquí vive el token de la BD, en backend/.env
│   ├── src/
│   │   ├── server.js        Arranque, archivos estáticos y manejo de errores
│   │   ├── config.js        Variables de entorno + bloqueo de la BD de producción
│   │   ├── db.js            Conexión y migraciones (solo cambios aditivos)
│   │   ├── schemas.js       Validación con Zod (en el servidor, no se puede saltar)
│   │   ├── repo.js          Consultas SQL (guardado en una sola transacción)
│   │   ├── routes.js        Endpoints /api/...
│   │   └── auth.js          Contraseña de administrador y sesiones
│   └── scripts/             migrate, seed, copy-from-prod
└── frontend/                HTML + CSS + JS (módulos ES), sin paso de compilación
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── main.js, router.js, api.js, dom.js
        └── views/  list.js, create.js, edit.js, lesson-editor.js, guide.js
```

## Arrancar en local

Requisito: Node.js 20.12 o superior.

```powershell
cd programaAdminv2\Expertic_Admin_v2\backend
npm install          # solo la primera vez
copy .env.example .env   # y completa los valores (ver abajo)
npm start
```

Abre **http://localhost:3000**. Sin configurar nada, usa una base local (`backend/data/local.db`)
con datos de ejemplo. Arriba a la derecha siempre se ve qué base está en uso.

Para desarrollo, `npm run dev` reinicia el servidor al guardar cambios del backend
(los del frontend solo necesitan recargar el navegador).

## Trabajar con una copia de los datos reales

El backend **se niega a arrancar** si `DATABASE_URL` apunta a la base de producción
(`expertic-db-recursosexpertic...`). Hay dos formas de tener una copia:

### Opción A: copia local (no necesita la CLI de Turso)

1. Consigue un token de **solo lectura** de producción. Desde el panel de Turso
   (Databases → expertic-db → Create token → *Read-only*) o con la CLI:
   `turso db tokens create expertic-db --read-only`
2. Crea `backend/.env` a partir de `.env.example` y pega el token en `SOURCE_AUTH_TOKEN`.
3. Ejecuta:
   ```powershell
   npm run copy-from-prod -- --force
   ```
   Sobre producción el script solo ejecuta `SELECT`. Copia todo en `backend/data/local.db`,
   y `--force` reemplaza los datos de ejemplo.

### Opción B: copia en Turso (para compartirla o publicarla después)

```bash
turso auth login
turso db create expertic-db-v2 --from-db expertic-db   # copia exacta de producción
turso db show expertic-db-v2 --url                      # → DATABASE_URL
turso db tokens create expertic-db-v2                   # → DATABASE_AUTH_TOKEN
```

Pon esos dos valores en `backend/.env` y reinicia con `npm start`.

## Contraseña

Con `ADMIN_PASSWORD` vacío no se pide contraseña (cómodo en local). Antes de publicarlo,
define `ADMIN_PASSWORD` y un `SESSION_SECRET` largo y aleatorio en `backend/.env`.

## Compatibilidad con las plantillas

Las tablas `asignaturas` y `lecciones` mantienen las mismas columnas y el mismo formato JSON,
así que las plantillas actuales leerían los datos igual. Los únicos cambios son **aditivos**:
la columna `codigo` (con índice único cuando no está vacía) y un índice en `lecciones.asignatura_id`.

Las plantillas buscan cada lección por *nombre de asignatura + nombre de lección*. Por eso el editor
avisa cuando cambias alguno de esos nombres o cuando hay dos lecciones con el mismo nombre.

## Qué se corrigió respecto a la versión anterior

| Antes | Ahora |
|---|---|
| Token de lectura/escritura visible en el HTML | El token vive en `backend/.env`; el navegador solo habla con `/api` |
| Cambios perdidos al cambiar de lección, crear una nueva o guardar la asignatura | Cada campo escribe en el estado en cuanto se teclea; redibujar nunca borra nada |
| Textos con comillas se cortaban; riesgo de XSS | Todo se inserta como texto (sin `innerHTML` con datos) |
| "Código" se pedía pero no se guardaba; `ADD COLUMN ... UNIQUE` fallaba en silencio | Se guarda, con validación de que sea único |
| Guardado por partes: si fallaba a mitad, quedaba a medias | Una sola transacción: se guarda todo o nada |
| No se podían eliminar lecciones | Eliminar, duplicar y reordenar elementos |
| La búsqueda traía todas las asignaturas en cada tecla | Búsqueda en el servidor (`LIKE`) con espera de 300 ms |
| Tablas y datos de ejemplo creados desde el navegador | Migraciones y datos de ejemplo en scripts del backend |
| Sin aviso al salir con cambios | Aviso al navegar o cerrar la pestaña; atajo Ctrl+S |

La guía de uso para editar lecciones está dentro de la aplicación, en **Guía** (`#/guia`).
