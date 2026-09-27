import { ingest } from 'src/evidence/api/service';
import { guard } from 'src/evidence/api/route-guard';
import { IngestBody } from 'src/evidence/api/schemas';
import { json, statusFor, readCommand } from 'src/evidence/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST { lineageId, asMode? }: a late source file arrives (simulated local event queue). */
export const POST = guard(async (req) => {
  const body = await readCommand(req, IngestBody);
  if (!body.ok) return body.res;
  const out = ingest(body.data);
  return json(out, statusFor(out.result.status));
});
