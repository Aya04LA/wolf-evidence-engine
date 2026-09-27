import type { Outcome, SourceEvent, CanonicalRecord } from '../domain/types';

import { checkMarket, suppliersIn, checkUniqueIds, checkSupplierScope } from './guards';

/**
 * FR (UPD-FR-002): replaces ONLY the scope supplier's rows in one market. Every other row,
 * including other suppliers in the same market (FR-UNCHANGED-*), passes through untouched.
 *
 * Guards:
 * - every incoming row belongs to the market and to the scope supplier;
 * - the scope supplier must already exist in the market. Repairing a subset that was never
 *   there is an addition wearing the wrong label, so it is rejected.
 * The row count may legitimately stay the same (FR: 16 invalid rows out, 16 repaired rows in).
 */
export function replaceSupplierSubset(
  previous: readonly CanonicalRecord[],
  event: SourceEvent
): Outcome<CanonicalRecord[]> {
  const bad = checkMarket(event) ?? checkSupplierScope(event);
  if (bad) return bad;

  const scope = event.scopeSupplierId!;
  if (!suppliersIn([...previous], event.market).has(scope)) {
    return {
      status: 'rejected',
      reason: 'wrong_scope',
      detail: `${event.lineageId}: ${scope} has no rows in ${event.market} to replace; this would be an addition`,
    };
  }

  const kept = previous.filter((r) => !(r.iso === event.market && r.supplierId === scope));
  return checkUniqueIds([...kept, ...event.records]);
}
