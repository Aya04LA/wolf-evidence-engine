import type { Outcome, SourceEvent, CanonicalRecord } from '../domain/types';

import { checkMarket, suppliersIn, checkUniqueIds } from './guards';

/**
 * XK (UPD-XK-002) and IT (UPD-IT-002): the incoming delivery supersedes the whole market.
 *
 * Guard against the "country replacement mistaken for something else" failure: if the incoming
 * delivery silently drops a supplier the market had before, it looks like a partial delivery
 * labelled as a full one. That is rejected, and the buyer must confirm it explicitly by
 * re-issuing the event with the dropped suppliers listed. Not guessed.
 */
export function replaceMarket(
  previous: readonly CanonicalRecord[],
  event: SourceEvent
): Outcome<CanonicalRecord[]> {
  const bad = checkMarket(event);
  if (bad) return bad;

  const before = suppliersIn([...previous], event.market);
  const after = suppliersIn(event.records, event.market);
  const dropped = [...before].filter((s) => !after.has(s)).sort();
  if (dropped.length > 0) {
    return {
      status: 'rejected',
      reason: 'wrong_scope',
      detail: `${event.lineageId}: market replacement would silently delete supplier(s) ${dropped.join(', ')} in ${event.market}; looks like a partial delivery`,
    };
  }

  return checkUniqueIds([...previous.filter((r) => r.iso !== event.market), ...event.records]);
}
