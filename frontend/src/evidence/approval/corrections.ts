import type { ReferenceData } from '../ingest/fixtures';
import type { Outcome, Correction, CorrectionField, CanonicalRecord } from '../domain/types';

import { contentId } from '../domain/hash';
import { assertNever } from '../domain/types';
import { sealRecord } from '../ingest/record';

export interface CorrectionInput {
  recordId: string;
  recordContentId: string;
  field: CorrectionField;
  to: number | string;
  reason: string;
  reviewer: string;
  at: string;
}

/** Validates a buyer correction against the record version the buyer actually saw. */
export function prepareCorrection(
  input: CorrectionInput,
  records: readonly CanonicalRecord[],
  ref: Pick<ReferenceData, 'suppliers'>
): Outcome<Correction> {
  const refuse = (detail: string): Outcome<never> => ({ status: 'rejected', reason: 'invalid_correction', detail });
  const reason = input.reason.trim();
  const reviewer = input.reviewer.trim();
  if (reason.length < 5 || reason.length > 500) return refuse('a reason of 5–500 characters is required');
  if (reviewer.length < 2 || reviewer.length > 80) return refuse('a reviewer name is required');

  const record = records.find((r) => r.id === input.recordId);
  if (!record) return refuse(`record ${input.recordId} is not in the current state`);
  if (record.contentId !== input.recordContentId) {
    return {
      status: 'rejected',
      reason: 'stale_version',
      detail: `${input.recordId} changed since it was reviewed; reload the evidence`,
    };
  }
  const check = checkValue(record, input.field, input.to, ref);
  if (check) return refuse(check);

  const body = {
    recordId: record.id,
    recordContentId: record.contentId,
    field: input.field,
    to: input.to,
    reason,
    reviewer,
    at: input.at,
  };
  return { status: 'ok', value: { id: contentId(body), ...body } };
}

function checkValue(
  r: CanonicalRecord,
  field: CorrectionField,
  to: number | string,
  ref: Pick<ReferenceData, 'suppliers'>
): string | null {
  switch (field) {
    case 'unitPriceEURCents':
      return Number.isSafeInteger(to) && (to as number) > 0 ? null : 'unit price must be a positive whole number of cents';
    case 'qty':
      return Number.isSafeInteger(to) && to !== 0 && Math.sign(to as number) === Math.sign(r.qty)
        ? null
        : 'quantity must be a non-zero whole number with the same sign (credit notes stay negative)';
    case 'supplierId':
      return typeof to === 'string' && ref.suppliers.has(to) ? null : `unknown supplier ${String(to)}`;
    default:
      return `field ${String(field)} cannot be corrected`;
  }
}

export interface CorrectionResult {
  records: CanonicalRecord[];
  applied: string[];
  /** Corrections whose record was replaced or removed by a later source event. Shown, not applied. */
  stale: { correctionId: string; detail: string }[];
}

/**
 * Applies corrections on top of the source-derived state. A correction applies only while its
 * record still has the content the buyer reviewed, so a later source delivery is never overridden
 * silently by an older manual edit.
 */
export function applyCorrections(
  records: readonly CanonicalRecord[],
  corrections: readonly Correction[],
  ref: Pick<ReferenceData, 'suppliers'>
): CorrectionResult {
  const byId = new Map(records.map((r) => [r.id, r]));
  const applied: string[] = [];
  const stale: CorrectionResult['stale'] = [];

  for (const c of corrections) {
    // Corrections apply in order. Each must target the exact content the buyer reviewed: the
    // source version for a first edit, or the previous correction's result for a follow-up.
    const current = byId.get(c.recordId);
    if (!current || current.contentId !== c.recordContentId) {
      stale.push({
        correctionId: c.id,
        detail: current
          ? `${c.recordId} changed after it was reviewed (later source delivery); correction not applied`
          : `${c.recordId} no longer exists; correction not applied`,
      });
      continue;
    }
    byId.set(c.recordId, corrected(current, c, ref));
    applied.push(c.id);
  }

  return { records: records.map((r) => byId.get(r.id)!), applied, stale };
}

function corrected(r: CanonicalRecord, c: Correction, ref: Pick<ReferenceData, 'suppliers'>): CanonicalRecord {
  const origins = { ...r.origins, [c.field]: 'buyer_correction' as const };
  switch (c.field) {
    case 'unitPriceEURCents': {
      const unit = c.to as number;
      return sealRecord({ ...r, unitPriceEURCents: unit, valueEURCents: unit * r.qty, origins: { ...origins, valueEURCents: 'buyer_correction' } });
    }
    case 'qty': {
      const qty = c.to as number;
      return sealRecord({ ...r, qty, valueEURCents: r.unitPriceEURCents * qty, origins: { ...origins, valueEURCents: 'buyer_correction' } });
    }
    case 'supplierId': {
      const s = ref.suppliers.get(c.to as string)!;
      return sealRecord({ ...r, supplierId: s.id, brand: s.name, origins: { ...origins, brand: 'buyer_correction' } });
    }
    default:
      return assertNever(c.field);
  }
}
