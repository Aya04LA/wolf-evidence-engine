import 'server-only';

import { error, internal } from './http';
import { ServiceUnavailable } from './service';

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route: dataset missing → 503; anything unexpected → opaque 500 (logged server-side). */
export function guard<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ServiceUnavailable) return error(503, 'evidence dataset unavailable');
      return internal(e);
    }
  };
}
