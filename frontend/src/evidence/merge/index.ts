import type { Outcome, MergeMode, SourceEvent, CanonicalRecord } from '../domain/types';

import { addSupplier } from './add-supplier';
import { replaceMarket } from './replace-market';
import { replaceSupplierSubset } from './replace-supplier-subset';

type MergeFn = (previous: readonly CanonicalRecord[], event: SourceEvent) => Outcome<CanonicalRecord[]>;

const MERGES: Record<MergeMode, MergeFn> = {
  replace_market: replaceMarket,
  add_supplier: addSupplier,
  replace_supplier_subset: replaceSupplierSubset,
};

/** Pure dispatch: same (previous, event) ⇒ same result. */
export function merge(previous: readonly CanonicalRecord[], event: SourceEvent): Outcome<CanonicalRecord[]> {
  const fn = MERGES[event.mode];
  if (!fn) return { status: 'rejected', reason: 'malformed_input', detail: `unknown mode ${String(event.mode)}` };
  return fn(previous, event);
}

export { addSupplier, replaceMarket, replaceSupplierSubset };
