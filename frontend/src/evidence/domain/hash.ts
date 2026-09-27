import type { ContentId } from './types';

import { createHash } from 'node:crypto';

/**
 * JSON with recursively sorted object keys, so the same data always serialises identically.
 * Rejects values JSON cannot represent faithfully instead of silently dropping them.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`canonicalJson: non-finite number ${value}`);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  throw new TypeError(`canonicalJson: unsupported type ${typeof value}`);
}

export function contentId(value: unknown): ContentId {
  return createHash('sha256').update(canonicalJson(value)).digest('hex') as ContentId;
}
