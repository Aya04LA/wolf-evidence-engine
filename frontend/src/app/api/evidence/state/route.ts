import { json } from 'src/evidence/api/http';
import { getState } from 'src/evidence/api/service';
import { guard } from 'src/evidence/api/route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: current findings, lineage queue, approvals and audit trail. */
export const GET = guard(async () => json(getState()));
