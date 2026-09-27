import type { CanonicalRecord } from '../domain/types';

import { contentId } from '../domain/hash';

type Draft = Omit<CanonicalRecord, 'contentId'>;

/** The fields a record asserts. `source` and `origins` are evidence about it and are not hashed. */
export const economicIdentity = (r: Draft) => ({
  id: r.id,
  iso: r.iso,
  supplierId: r.supplierId,
  productCode: r.productCode,
  date: r.date,
  qty: r.qty,
  unit: r.unit,
  unitPriceEURCents: r.unitPriceEURCents,
  valueEURCents: r.valueEURCents,
  currency: r.currency,
  valueLocalCents: r.valueLocalCents,
  kind: r.kind,
  invoiceRef: r.invoiceRef,
});

/** Seals a record with its content id: same assertion ⇒ same id, wherever it was read from. */
export function sealRecord(draft: Draft): CanonicalRecord {
  return { ...draft, contentId: contentId(economicIdentity(draft)) };
}
