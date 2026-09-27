import type { Outcome, Refusal, SourceEvent, CanonicalRecord } from '../domain/types';

/** Every incoming record must belong to the event's market. */
export function checkMarket(event: SourceEvent): Refusal | null {
  const stray = event.records.filter((r) => r.iso !== event.market);
  if (stray.length === 0) return null;
  return {
    status: 'rejected',
    reason: 'market_mismatch',
    detail: `${event.lineageId}: ${stray.length} record(s) outside ${event.market}, e.g. ${stray[0].id} (${stray[0].iso})`,
  };
}

/** For supplier-scoped modes: the scope is set and every incoming record belongs to it. */
export function checkSupplierScope(event: SourceEvent): Refusal | null {
  if (!event.scopeSupplierId) {
    return { status: 'rejected', reason: 'wrong_scope', detail: `${event.mode} requires a scope supplier` };
  }
  const stray = event.records.filter((r) => r.supplierId !== event.scopeSupplierId);
  if (stray.length === 0) return null;
  return {
    status: 'rejected',
    reason: 'wrong_scope',
    detail: `${event.lineageId}: ${stray.length} record(s) are not ${event.scopeSupplierId}, e.g. ${stray[0].id} (${stray[0].supplierId})`,
  };
}

/** The merged result must never contain the same business id twice. */
export function checkUniqueIds(records: CanonicalRecord[]): Outcome<CanonicalRecord[]> {
  const seen = new Map<string, CanonicalRecord>();
  for (const r of records) {
    const prior = seen.get(r.id);
    if (prior) {
      return {
        status: 'conflict',
        reason: 'duplicate_record_id',
        detail: `record id ${r.id} would exist twice after merge`,
        evidence: [prior.source, r.source],
      };
    }
    seen.set(r.id, r);
  }
  return { status: 'ok', value: records };
}

export const suppliersIn = (records: CanonicalRecord[], market: string): Set<string> =>
  new Set(records.filter((r) => r.iso === market).map((r) => r.supplierId));
