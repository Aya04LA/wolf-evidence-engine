import { guard } from 'src/evidence/api/route-guard';
import { CorrectBody } from 'src/evidence/api/schemas';
import { correctRecord } from 'src/evidence/api/service';
import { json, statusFor, readCommand } from 'src/evidence/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST { recordId, recordContentId, field, to, reason, reviewer }: correct one record version. */
export const POST = guard(async (req) => {
  const body = await readCommand(req, CorrectBody);
  if (!body.ok) return body.res;
  const out = correctRecord(body.data);
  return json(out, statusFor(out.result.status));
});
