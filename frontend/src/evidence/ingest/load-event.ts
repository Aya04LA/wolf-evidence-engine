import type { ParsedSheet } from './parse-fr';
import type { ReferenceData } from './fixtures';
import type { Outcome, MergeMode, SourceEvent, LineageEntry, CanonicalRecord } from '../domain/types';

import { parseCsv } from './csv';
import { parseFr } from './parse-fr';
import { sealRecord } from './record';
import { contentId } from '../domain/hash';
import { parseCents } from '../domain/money';
import { fixturePath, readFixtureText } from './fixtures';

/**
 * Builds SourceEvents. The event id hashes the lineage identity plus the sorted record content
 * ids, so an identical re-delivery produces the identical id and a changed one never does.
 */
export function sealEvent(
  lineage: LineageEntry,
  records: CanonicalRecord[],
  checks: SourceEvent['checks'],
  overrides: Partial<Pick<LineageEntry, 'mode' | 'scopeSupplierId'>> = {}
): SourceEvent {
  const mode: MergeMode = overrides.mode ?? lineage.mode;
  const scopeSupplierId =
    overrides.scopeSupplierId !== undefined ? overrides.scopeSupplierId : lineage.scopeSupplierId;
  const identity = {
    lineageId: lineage.id,
    market: lineage.market,
    mode,
    scopeSupplierId,
    incomingVersion: lineage.incoming,
    records: records.map((r) => r.contentId).sort(),
  };
  return {
    id: contentId(identity),
    lineageId: lineage.id,
    market: lineage.market,
    mode,
    scopeSupplierId,
    previousVersion: lineage.previous,
    incomingVersion: lineage.incoming,
    effectiveDate: lineage.effectiveDate,
    records,
    checks,
  };
}

// ---------------------------------------------------------------------------------------------
// Baseline (v1). No raw v1 sheets exist in the kit, so v1 enters as fixture records and every
// field is labelled `baseline_fixture`.

export interface FixtureRecord {
  id: string;
  iso: string;
  date: string;
  productCode: string;
  supplierId: string;
  brand: string;
  description: string;
  cluster: string;
  qty: number;
  unit: string;
  unitPriceEUR: number;
  valueEUR: number;
  currency: string;
  valueLocal: number;
}

const toCents = (eur: number): number | null =>
  Number.isFinite(eur) ? parseCents(eur.toFixed(2)) : null;

export function fixtureToRecord(
  r: FixtureRecord,
  file: string,
  sheet: string,
  index: number
): Outcome<CanonicalRecord> {
  const unitPrice = toCents(r.unitPriceEUR);
  const value = toCents(r.valueEUR);
  const local = toCents(r.valueLocal);
  const source = { file, sheet, row: index + 1, columns: [] };
  if (unitPrice === null || value === null || local === null || !Number.isInteger(r.qty)) {
    return { status: 'rejected', reason: 'malformed_input', detail: `${r.id}: unreadable amount` };
  }
  if (r.unit !== 'piece') {
    return {
      status: 'abstain',
      reason: 'unit_unverified',
      detail: `${r.id}: unit ${r.unit}`,
      evidence: [source],
    };
  }
  return {
    status: 'ok',
    value: sealRecord({
      id: r.id,
      iso: r.iso,
      supplierId: r.supplierId,
      brand: r.brand,
      productCode: r.productCode,
      description: r.description,
      cluster: r.cluster,
      date: r.date,
      qty: r.qty,
      unit: 'piece',
      unitPriceEURCents: unitPrice,
      valueEURCents: value,
      currency: r.currency,
      valueLocalCents: local,
      kind: r.qty < 0 ? 'credit_note' : 'invoice',
      invoiceRef: null,
      source,
      origins: { id: 'baseline_fixture', valueEURCents: 'baseline_fixture', qty: 'baseline_fixture' },
    }),
  };
}

/** Converts fixture records into an event. Used for the v1 baseline and for merge tests. */
export function fixtureEvent(
  lineage: LineageEntry,
  rows: FixtureRecord[],
  sheet: string
): Outcome<SourceEvent> {
  const records: CanonicalRecord[] = [];
  for (const [i, row] of rows.entries()) {
    const out = fixtureToRecord(row, 'ingestion-versions.json', sheet, i);
    if (out.status !== 'ok') return out;
    records.push(out.value);
  }
  return { status: 'ok', value: sealEvent(lineage, records, []) };
}

/** The v1 state of a market, expressed as a market replacement from nothing. */
export function baselineLineage(market: string): LineageEntry {
  return {
    id: `BASELINE-${market}-v1`,
    market,
    mode: 'replace_market',
    previous: '(none)',
    incoming: `${market}-v1`,
    effectiveDate: '2026-08-31',
    scopeSupplierId: null,
  };
}

// ---------------------------------------------------------------------------------------------
// Raw-sheet events

/** UPD-FR-002 from the raw FR-v2 sheet. `overrides` exists to test wrong-scope deliveries. */
export function loadFrEvent(
  lineage: LineageEntry,
  ref: ReferenceData,
  overrides: Partial<Pick<LineageEntry, 'mode' | 'scopeSupplierId'>> = {}
): Outcome<SourceEvent> {
  if (!lineage.scopeSupplierId) {
    return { status: 'rejected', reason: 'malformed_input', detail: 'FR lineage has no scope supplier' };
  }
  const text = readFixtureText('FR-v2');
  const file = fixturePath('FR-v2');
  if (text === null) {
    return {
      status: 'abstain',
      reason: 'missing_source',
      detail: `${file} is not readable`,
      evidence: [{ file, row: 0, columns: [] }],
    };
  }
  const parsed: Outcome<ParsedSheet> = parseFr(parseCsv(text), {
    file,
    market: lineage.market,
    scopeSupplierId: lineage.scopeSupplierId,
    idPrefix: `${lineage.market}-LATEST`,
    ref,
  });
  if (parsed.status !== 'ok') return parsed;
  return { status: 'ok', value: sealEvent(lineage, parsed.value.records, parsed.value.checks, overrides) };
}
