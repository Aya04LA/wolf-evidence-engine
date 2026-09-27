import { guard } from 'src/evidence/api/route-guard';
import { ApproveBody } from 'src/evidence/api/schemas';
import { approveFinding } from 'src/evidence/api/service';
import { json, statusFor, readCommand } from 'src/evidence/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST { findingKey, versionId, reviewer, note? }: approve one exact finding version. */
export const POST = guard(async (req) => {
  const body = await readCommand(req, ApproveBody);
  if (!body.ok) return body.res;
  const out = approveFinding(body.data);
  return json(out, statusFor(out.result.status));
});
