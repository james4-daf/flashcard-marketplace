import { createClient, type Client, type Row, type Value } from '@libsql/client/web';
import type { Env } from './types';

/**
 * Build a fresh libSQL client for the current request.
 *
 * We deliberately create the client per-request rather than reusing a global
 * pool: Cloudflare Workers are stateless and edge-native, and the libSQL HTTP
 * client is cheap to construct. Credentials are read exclusively from the
 * Worker bindings so they are never hard-coded.
 */
export function createDbClient(env: Env): Client {
  if (!env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL binding is not configured');
  }
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN || undefined,
  });
}

/** Coerce a libSQL cell to a string, throwing on unexpected null. */
export function asString(value: Value): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  throw new TypeError(`Expected string cell, received ${typeof value}`);
}

/** Coerce a libSQL cell to a number (handles bigint returned by SQLite). */
export function asNumber(value: Value): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  throw new TypeError(`Expected numeric cell, received ${typeof value}`);
}

/** Read a named column from a row as a string. */
export function colString(row: Row, key: string): string {
  return asString(row[key] as Value);
}

/** Read a named column from a row as a number. */
export function colNumber(row: Row, key: string): number {
  return asNumber(row[key] as Value);
}

/** Read a named column from a row as a boolean (SQLite stores 0/1). */
export function colBoolean(row: Row, key: string): boolean {
  return asNumber(row[key] as Value) !== 0;
}
