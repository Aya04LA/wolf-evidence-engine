import type { VersionDiff } from '../provenance/graph';
import type { Finding, FindingVersion } from '../domain/types';

import { formatEUR } from '../domain/money';

/**
 * Plain-English explanation of why a finding changed, built only from computed facts.
 *
 * This is the default and the source of truth for wording. It needs no model. Every number in
 * the output comes from the finding facts or the record-level diff, never from source text, so
 * an instruction hidden in a supplier file cannot reach it. Product codes and supplier names
 * come from the reference catalogue.
 */

export type SupplierName = (supplierId: string) => string;

export function explainChange(
  previous: FindingVersion | undefined,
  current: FindingVersion,
  diff: VersionDiff,
  supplierName: SupplierName
): string {
  const now = describe(current.finding, supplierName);
  if (!previous) return `First version: ${now}.`;

  const was = describe(previous.finding, supplierName);
  const cause = causeOf(diff);
  const f = current.finding.facts;
  const p = previous.finding.facts;

  if (f.kind === 'spend_total' && p.kind === 'spend_total') {
    const delta = f.totalEURCents - p.totalEURCents;
    const direction = delta === 0 ? 'is unchanged at' : delta > 0 ? 'rose to' : 'fell to';
    return (
      `${f.market} net spend ${direction} ${formatEUR(f.totalEURCents)}` +
      (delta === 0 ? '' : ` from ${formatEUR(p.totalEURCents)} (${delta > 0 ? '+' : '−'}${formatEUR(Math.abs(delta))})`) +
      `${cause}.`
    );
  }

  const pv = previous.finding.value;
  const cv = current.finding.value;
  const subject =
    f.kind === 'price_decision' ? `${f.market} ${f.productCode}` : `${f.market}`;

  if (pv.status !== 'ok' && cv.status === 'ok') {
    return `${subject}: a recommendation is now possible — ${now}. Previously there was none (${pv.reason})${cause}.`;
  }
  if (pv.status === 'ok' && cv.status !== 'ok') {
    return `${subject}: the previous recommendation (${was}) no longer holds — ${cv.reason}${cause}. A buyer must decide.`;
  }
  if (pv.status === 'ok' && cv.status === 'ok') {
    return `${subject}: recommendation changed from ${was} to ${now}${cause}.`;
  }
  return `${subject}: still no recommendation (${cv.status === 'ok' ? '' : cv.reason})${cause}.`;
}

function describe(finding: Finding, supplierName: SupplierName): string {
  const { facts, value } = finding;
  if (value.status !== 'ok') return `no recommendation (${value.reason})`;
  if (facts.kind === 'spend_total') return `${formatEUR(facts.totalEURCents)} net spend over ${facts.rows} rows`;
  const rec = value.value as { supplierId: string; avgUnitPriceEURCents: number; singleSource: boolean };
  // A cheaper supplier excluded for weak evidence must be named, or the recommendation looks wrong.
  const cheaper = facts.candidates
    .filter((c) => c.status !== 'eligible' && c.avgUnitPriceEURCents < rec.avgUnitPriceEURCents)
    .map(
      (c) =>
        `${supplierName(c.supplierId)} averages ${formatEUR(c.avgUnitPriceEURCents)} but is excluded (${
          c.status === 'unstable_price' ? 'unstable price' : 'too few invoice lines'
        })`
    );
  return (
    `${supplierName(rec.supplierId)} at ${formatEUR(rec.avgUnitPriceEURCents)} per piece${rec.singleSource ? ' (single source)' : ''}` +
    (cheaper.length ? `; ${cheaper.join('; ')}` : '')
  );
}

/** " because 16 rows were replaced and 1 row changed", from the record-level diff. */
function causeOf(d: VersionDiff): string {
  const replaced = Math.min(d.addedRecords.length, d.removedRecords.length);
  const added = d.addedRecords.length - replaced;
  const removed = d.removedRecords.length - replaced;
  const parts = [
    replaced && `${plural(replaced, 'row')} ${replaced === 1 ? 'was' : 'were'} replaced`,
    added && `${plural(added, 'row')} ${added === 1 ? 'was' : 'were'} added`,
    removed && `${plural(removed, 'row')} ${removed === 1 ? 'was' : 'were'} removed`,
    d.changedRecords.length && `${plural(d.changedRecords.length, 'row')} changed (${d.changedRecords.join(', ')})`,
  ].filter(Boolean);
  if (parts.length === 0) return ' because the decision policy changed';
  return ` because ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
