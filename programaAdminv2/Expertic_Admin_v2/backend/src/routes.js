import express from 'express';
import { config, describeDb } from './config.js';
import { authEnabled, login, requireAuth, tokenFrom, verifyToken } from './auth.js';
import { AsignaturaSchema, ContenidoSchema, IdParam } from './schemas.js';
import * as repo from './repo.js';

export const api = express.Router();

// Envuelve handlers async para que los errores lleguen al manejador central.
const handle = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// --- Sesión -----------------------------------------------------------------
api.get('/session', (req, res) => {
  res.json({
    authRequired: authEnabled,
    authenticated: !authEnabled || verifyToken(tokenFrom(req)),
    database: describeDb(config.dbUrl),
  });
});

api.post('/login', handle(async (req, res) => {
  const token = login(req.ip, String(req.body?.password ?? ''));
  res.json({ token });
}));

// --- A partir de aquí todo requiere sesión ------------------------------------
api.use(requireAuth);

api.get('/asignaturas', handle(async (req, res) => {
  res.json(await repo.listAsignaturas(String(req.query.q ?? '')));
}));

api.post('/asignaturas', handle(async (req, res) => {
  const data = AsignaturaSchema.parse(req.body);
  const id = await repo.createAsignatura(data);
  res.status(201).json({ id });
}));

api.get('/asignaturas/:id', handle(async (req, res) => {
  res.json(await repo.getAsignaturaCompleta(IdParam.parse(req.params.id)));
}));

api.put('/asignaturas/:id/contenido', handle(async (req, res) => {
  const id = IdParam.parse(req.params.id);
  const data = ContenidoSchema.parse(req.body);
  const creadas = await repo.saveContenido(id, data);
  res.json({ ...(await repo.getAsignaturaCompleta(id)), creadas });
}));

api.delete('/asignaturas/:id', handle(async (req, res) => {
  await repo.deleteAsignatura(IdParam.parse(req.params.id));
  res.json({ ok: true });
}));
