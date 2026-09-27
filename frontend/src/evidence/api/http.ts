import 'server-only';

import type { ZodType } from 'zod';
import type { ErrorDto, CommandStatus } from './dto';

const MAX_BODY_BYTES = 16 * 1024;

const NO_STORE = { 'Cache-Control': 'no-store', 'X-Wolf-Mode': 'in-memory-demo' };

export const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: NO_STORE });

export const error = (status: number, message: string, issues?: string[]): Response =>
  json({ error: message, ...(issues ? { issues } : {}) } satisfies ErrorDto, status);

/** Command outcome → HTTP status. Refusals are successful *requests*, so they are 4xx, not 5xx. */
export const statusFor = (s: CommandStatus): number =>
  s === 'ok' || s === 'duplicate' ? 200 : s === 'conflict' ? 409 : 422;

// ---------------------------------------------------------------------------------------------
// Host allowlist (DNS-rebinding defence)

const DEFAULT_HOSTS = ['127.0.0.1:8084', 'localhost:8084', '[::1]:8084'];

/**
 * Hosts this API answers for. Without it, a page on attacker.example that rebinds its DNS to
 * 127.0.0.1 sends requests whose Origin and Host both say attacker.example, so a same-origin
 * check alone passes. A deployment sets WOLF_ALLOWED_HOSTS (comma-separated host[:port]).
 */
function allowedHosts(): Set<string> {
  const extra = (process.env.WOLF_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_HOSTS, ...extra]);
}

export function checkHost(req: Request): Response | null {
  const host = (req.headers.get('host') ?? '').toLowerCase();
  return allowedHosts().has(host) ? null : error(421, 'unrecognised host');
}

// ---------------------------------------------------------------------------------------------
// Mutating requests

/** Reads at most `limit` bytes; stops pulling from the stream as soon as the limit is passed. */
async function readLimited(req: Request, limit: number): Promise<string | 'too_large' | 'unreadable'> {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return 'too_large';
      }
      chunks.push(value);
    }
  } catch {
    return 'unreadable';
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(all);
  } catch {
    return 'unreadable';
  }
}

/**
 * Parses a mutating request defensively:
 * - same-origin only (no auth exists, so this is the CSRF boundary; the host allowlist in the
 *   route guard covers DNS rebinding);
 * - JSON content type, body streamed with a 16 KB cap, then validated by a strict zod schema.
 */
export async function readCommand<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ ok: true; data: T } | { ok: false; res: Response }> {
  const origin = req.headers.get('origin');
  if (origin !== null) {
    let sameHost = false;
    try {
      sameHost = new URL(origin).host === (req.headers.get('host') ?? new URL(req.url).host);
    } catch {
      sameHost = false;
    }
    if (!sameHost) return { ok: false, res: error(403, 'cross-origin requests are not accepted') };
  }
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return { ok: false, res: error(415, 'expected application/json') };
  }
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return { ok: false, res: error(413, 'request body too large') };

  const text = await readLimited(req, MAX_BODY_BYTES);
  if (text === 'too_large') return { ok: false, res: error(413, 'request body too large') };
  if (text === 'unreadable') return { ok: false, res: error(400, 'unreadable body') };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, res: error(400, 'body is not valid JSON') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      res: error(400, 'invalid request', parsed.error.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`)),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Last-resort handler: never leak internals (stack traces, paths) to the client. */
export function internal(e: unknown): Response {
  console.error('[evidence-api]', e);
  return error(500, 'internal error');
}
