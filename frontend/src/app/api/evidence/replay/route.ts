import { z } from 'zod';

import { replay } from 'src/evidence/api/service';
import { guard } from 'src/evidence/api/route-guard';
import { json, readCommand } from 'src/evidence/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST {}: rebuild from the command log once and twice; prove identical state. Read-only. */
export const POST = guard(async (req) => {
  const body = await readCommand(req, z.object({}).strict());
  if (!body.ok) return body.res;
  return json(replay());
});
