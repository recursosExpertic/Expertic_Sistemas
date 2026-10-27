import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FRONTEND_ROOT = path.resolve(BACKEND_ROOT, '..', 'frontend');

try {
  process.loadEnvFile(path.join(BACKEND_ROOT, '.env'));
} catch {
  // Sin .env: se usan los valores por defecto (base local, sin contraseña).
}

// Base de datos en producción que usan el admin actual y las plantillas.
// Este proyecto NUNCA debe escribir en ella.
const PROTECTED_HOSTS = [
  'expertic-db-recursosexpertic.aws-us-east-1.turso.io',
  ...(process.env.PROTECTED_DB_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean),
];

function defaultLocalUrl() {
  const dir = path.join(BACKEND_ROOT, 'data');
  fs.mkdirSync(dir, { recursive: true });
  return 'file:' + path.join(dir, 'local.db').replaceAll('\\', '/');
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  dbUrl: process.env.DATABASE_URL?.trim() || defaultLocalUrl(),
  dbToken: process.env.DATABASE_AUTH_TOKEN?.trim() || undefined,
  sourceUrl: process.env.SOURCE_DATABASE_URL?.trim() || '',
  sourceToken: process.env.SOURCE_AUTH_TOKEN?.trim() || undefined,
  adminPassword: process.env.ADMIN_PASSWORD || '',
  sessionSecret: process.env.SESSION_SECRET || '',
};

export function isProtectedUrl(url) {
  return PROTECTED_HOSTS.some(host => url.includes(host));
}

/** Detiene el proceso si la URL apunta a la base de producción. */
export function assertWritableDb(url) {
  if (isProtectedUrl(url)) {
    throw new Error(
      `La URL ${url} es la base de datos de PRODUCCIÓN. ` +
      'Este proyecto solo puede escribir en una copia. Revisa DATABASE_URL en backend/.env.'
    );
  }
}

/** Texto corto para mostrar en la interfaz qué base se está usando. */
export function describeDb(url) {
  if (url.startsWith('file:')) return 'Local (archivo)';
  try {
    return new URL(url.replace(/^libsql:/, 'https:')).hostname.split('.')[0];
  } catch {
    return 'Remota';
  }
}
