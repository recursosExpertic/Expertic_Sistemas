import express from 'express';
import { ZodError } from 'zod';
import { config, describeDb, FRONTEND_ROOT } from './config.js';
import { authEnabled } from './auth.js';
import { migrate } from './db.js';
import { HttpError } from './errors.js';
import { api } from './routes.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  next();
});

app.use('/api', api);
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Ruta no encontrada')));
app.use(express.static(FRONTEND_ROOT));

// Manejador central de errores: siempre responde JSON { error, details? }.
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Hay datos inválidos',
      details: err.issues.map(i => ({ path: i.path, message: i.message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

await migrate();

app.listen(config.port, () => {
  console.log(`\n  Administrador académico v2 → http://localhost:${config.port}`);
  console.log(`  Base de datos: ${describeDb(config.dbUrl)} (${config.dbUrl})`);
  if (!authEnabled) console.log('  ⚠  ADMIN_PASSWORD vacío: no se pide contraseña (solo para uso local).');
  console.log('');
});
