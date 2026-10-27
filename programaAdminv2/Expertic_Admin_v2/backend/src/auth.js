import crypto from 'node:crypto';
import { config } from './config.js';
import { HttpError } from './errors.js';

const SESSION_MS = 8 * 60 * 60 * 1000; // 8 horas
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export const authEnabled = Boolean(config.adminPassword);

// Sin SESSION_SECRET se genera uno al arrancar (las sesiones se pierden al reiniciar).
const secret = config.sessionSecret || crypto.randomBytes(32).toString('hex');

const sign = payload => crypto.createHmac('sha256', secret).update(payload).digest('base64url');
const sha = value => crypto.createHash('sha256').update(String(value)).digest();

export function issueToken() {
  const exp = String(Date.now() + SESSION_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token) {
  const [exp, sig] = String(token || '').split('.');
  if (!exp || !sig) return false;
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) && Number(exp) > Date.now();
}

// Bloqueo sencillo por IP tras varios intentos fallidos.
const fails = new Map();

export function login(ip, password) {
  const entry = fails.get(ip);
  if (entry && entry.count >= MAX_FAILS && Date.now() - entry.last < LOCK_MS) {
    throw new HttpError(429, 'Demasiados intentos. Espera 15 minutos.');
  }
  const ok = crypto.timingSafeEqual(sha(password), sha(config.adminPassword));
  if (!ok) {
    fails.set(ip, { count: (entry?.count ?? 0) + 1, last: Date.now() });
    throw new HttpError(401, 'Contraseña incorrecta');
  }
  fails.delete(ip);
  return issueToken();
}

export const tokenFrom = req => (req.get('authorization') || '').replace(/^Bearer\s+/i, '');

export function requireAuth(req, _res, next) {
  if (!authEnabled || verifyToken(tokenFrom(req))) return next();
  next(new HttpError(401, 'Tu sesión expiró. Vuelve a ingresar.'));
}
