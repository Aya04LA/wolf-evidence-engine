import { json, error } from 'src/evidence/api/http';
import { guard } from 'src/evidence/api/route-guard';
import { findingDetail } from 'src/evidence/api/service';
import { FindingKeyParam } from 'src/evidence/api/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: one finding's versions, contributing records with source refs, and diff. */
export const GET = guard<{ params: Promise<{ key: string }> }>(async (_req, { params }) => {
  const key = FindingKeyParam.safeParse(decodeURIComponent((await params).key));
  if (!key.success) return error(400, 'invalid finding key');
  const detail = findingDetail(key.data);
  return detail ? json(detail) : error(404, 'finding not found');
});
