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

/**
 * Parses a mutating request defensively:
 * - same-origin only (no auth exists, so this is the CSRF boundary);
 * - JSON content type, body capped at 16 KB, then validated by a strict zod schema.
 */
export async function readCommand<T>(req: Request, schema: ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; res: Response }> {
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

  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: false, res: error(400, 'unreadable body') };
  }
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return { ok: false, res: error(413, 'request body too large') };
  }

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
