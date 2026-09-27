import 'server-only';

import { error, internal, checkHost } from './http';
import { CapacityExceeded, ServiceUnavailable } from './service';

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route: unknown host → 421; dataset missing → 503; log full → 429; anything else → opaque 500 (logged server-side). */
export function guard<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const badHost = checkHost(req);
    if (badHost) return badHost;
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ServiceUnavailable) return error(503, 'evidence dataset unavailable');
      if (e instanceof CapacityExceeded) return error(429, 'demo log is full: reset the demo to continue');
      return internal(e);
    }
  };
}
