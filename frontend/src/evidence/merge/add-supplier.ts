import type { Outcome, SourceEvent, CanonicalRecord } from '../domain/types';

import { checkMarket, suppliersIn, checkUniqueIds, checkSupplierScope } from './guards';

/**
 * HU (UPD-HU-002): appends one supplier's rows and never deletes existing suppliers.
 *
 * If the scope supplier already has rows in the market, this "addition" is really a replacement
 * and appending would double count, so it is rejected as wrong_scope.
 */
export function addSupplier(
  previous: readonly CanonicalRecord[],
  event: SourceEvent
): Outcome<CanonicalRecord[]> {
  const bad = checkMarket(event) ?? checkSupplierScope(event);
  if (bad) return bad;

  if (suppliersIn([...previous], event.market).has(event.scopeSupplierId!)) {
    return {
      status: 'rejected',
      reason: 'wrong_scope',
      detail: `${event.lineageId}: ${event.scopeSupplierId} already has rows in ${event.market}; appending would double count — this is a replacement, not an addition`,
    };
  }

  return checkUniqueIds([...previous, ...event.records]);
}
