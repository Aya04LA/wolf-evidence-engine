import { z } from 'zod';

import { reset } from 'src/evidence/api/service';
import { guard } from 'src/evidence/api/route-guard';
import { json, error, readCommand } from 'src/evidence/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST {}: restart the demo from the v1 baseline. Disabled unless WOLF_DEMO_RESET=1 or in dev. */
export const POST = guard(async (req) => {
  if (process.env.NODE_ENV === 'production' && process.env.WOLF_DEMO_RESET !== '1') {
    return error(404, 'not found');
  }
  const body = await readCommand(req, z.object({}).strict());
  if (!body.ok) return body.res;
  return json(reset());
});
