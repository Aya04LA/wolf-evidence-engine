import type {
  ErrorDto,
  StateDto,
  ReplayDto,
  CommandResultDto,
  FindingDetailDto,
} from 'src/evidence/api/dto';

/**
 * Typed client adapter for the Track 1 evidence engine. UI code reads and writes evidence only
 * through these functions. The engine itself is server-only and never shipped to the browser.
 *
 * Commands that the engine refuses (stale version, wrong scope, abstention…) come back as a
 * normal result with a non-ok `status`, so the UI can show the exception instead of hiding it.
 */

export type {
  AuditDto,
  StateDto,
  RecordDto,
  ReplayDto,
  VersionDto,
  LineageDto,
  ApprovalDto,
  FindingDetailDto,
  CommandResultDto,
  FindingSummaryDto,
} from 'src/evidence/api/dto';

const BASE = '/api/evidence';

export class EvidenceApiError extends Error {
  constructor(
    readonly httpStatus: number,
    message: string,
    readonly issues: string[] = []
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: { method: 'POST'; body: unknown }): Promise<T> {
  // next.config sets trailingSlash: true; call the canonical URL to avoid a 308 per request.
  const res = await fetch(`${BASE}${path}/`, {
    method: init?.method ?? 'GET',
    headers: init ? { 'Content-Type': 'application/json' } : undefined,
    body: init ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new EvidenceApiError(res.status, `unexpected response (${res.status})`);
  }
  // Command refusals (409/422) carry a CommandResultDto: return it so the UI can show the reason.
  if (res.ok || ((res.status === 409 || res.status === 422) && isCommandResult(payload))) return payload as T;
  const err = payload as Partial<ErrorDto>;
  throw new EvidenceApiError(res.status, err.error ?? `request failed (${res.status})`, err.issues ?? []);
}

const isCommandResult = (p: unknown): p is CommandResultDto =>
  typeof p === 'object' && p !== null && 'result' in p && 'state' in p;

export const evidenceApi = {
  state: () => call<StateDto>('/state'),
  finding: (key: string) => call<FindingDetailDto>(`/findings/${encodeURIComponent(key)}`),
  ingest: (lineageId: string, asMode?: 'replace_market' | 'add_supplier' | 'replace_supplier_subset') =>
    call<CommandResultDto>('/events', { method: 'POST', body: asMode ? { lineageId, asMode } : { lineageId } }),
  approve: (body: { findingKey: string; versionId: string; reviewer: string; note?: string }) =>
    call<CommandResultDto>('/approvals', { method: 'POST', body }),
  correct: (body: {
    recordId: string;
    recordContentId: string;
    field: 'unitPriceEURCents' | 'qty' | 'supplierId';
    to: number | string;
    reason: string;
    reviewer: string;
  }) => call<CommandResultDto>('/corrections', { method: 'POST', body }),
  replay: () => call<ReplayDto>('/replay', { method: 'POST', body: {} }),
  reset: () => call<StateDto>('/reset', { method: 'POST', body: {} }),
};

/** Money on the wire is integer cents; format only at the edge. */
export const eur = (cents: number): string =>
  (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'EUR' });
