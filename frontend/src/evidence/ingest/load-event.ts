import type { ParsedSheet } from './common';
import type { FixtureKey, ReferenceData } from './fixtures';
import type { Outcome, Refusal, MergeMode, SourceEvent, LineageEntry, CanonicalRecord } from '../domain/types';

import { parseCsv } from './csv';
import { parseFr } from './parse-fr';
import { parseHu } from './parse-hu';
import { parseIt } from './parse-it';
import { parseXk } from './parse-xk';
import { sealRecord } from './record';
import { contentId } from '../domain/hash';
import { parseCents } from '../domain/money';
import { supplierFromPrevious } from './common';
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

type Overrides = Partial<Pick<LineageEntry, 'mode' | 'scopeSupplierId'>>;

function readSheet(key: FixtureKey): Outcome<{ file: string; matrix: string[][] }> {
  const file = fixturePath(key);
  const text = readFixtureText(key);
  if (text === null) {
    return {
      status: 'abstain',
      reason: 'missing_source',
      detail: `${file} is not readable`,
      evidence: [{ file, row: 0, columns: [] }],
    };
  }
  return { status: 'ok', value: { file, matrix: parseCsv(text) } };
}

const needScope = (lineage: LineageEntry): Refusal | null =>
  lineage.scopeSupplierId
    ? null
    : { status: 'rejected', reason: 'malformed_input', detail: `${lineage.id} has no scope supplier` };

function parseLineage(
  lineage: LineageEntry,
  ref: ReferenceData,
  previous: readonly CanonicalRecord[]
): Outcome<ParsedSheet> {
  const idPrefix = `${lineage.market}-LATEST`;
  const market = lineage.market;

  switch (lineage.incoming) {
    case 'FR-v2': {
      const bad = needScope(lineage);
      if (bad) return bad;
      const s = readSheet('FR-v2');
      if (s.status !== 'ok') return s;
      return parseFr(s.value.matrix, { file: s.value.file, market, scopeSupplierId: lineage.scopeSupplierId!, idPrefix, ref });
    }
    case 'HU-v2': {
      const bad = needScope(lineage);
      if (bad) return bad;
      const s = readSheet('HU-v2');
      if (s.status !== 'ok') return s;
      return parseHu(s.value.matrix, { file: s.value.file, market, scopeSupplierId: lineage.scopeSupplierId!, idPrefix, ref });
    }
    case 'XK-v2': {
      const s = readSheet('XK-v2');
      if (s.status !== 'ok') return s;
      return parseXk(s.value.matrix, {
        file: s.value.file,
        market,
        idPrefix,
        ref,
        resolveSupplier: supplierFromPrevious(previous, market),
      });
    }
    case 'IT-v2': {
      const sheets = [];
      for (const [name, key] of [['MA CARR', 'IT-v2:MA CARR'], ['MA VERN', 'IT-v2:MA VERN']] as const) {
        const s = readSheet(key);
        if (s.status !== 'ok') return s;
        sheets.push({ name, ...s.value });
      }
      return parseIt(sheets, { market, idPrefix, ref, resolveSupplier: supplierFromPrevious(previous, market) });
    }
    default:
      return { status: 'rejected', reason: 'unknown_lineage', detail: `no parser for ${lineage.incoming}` };
  }
}

/**
 * Builds the SourceEvent for a lineage entry from its raw sheet(s).
 *
 * `previous` is the canonical state the event will be applied to. It is read only by layouts
 * without a supplier column (XK, IT), to carry each product's supplier forward.
 * `overrides` lets tests re-label a delivery (wrong-scope cases).
 */
export function loadLineageEvent(
  lineage: LineageEntry,
  ref: ReferenceData,
  previous: readonly CanonicalRecord[] = [],
  overrides: Overrides = {}
): Outcome<SourceEvent> {
  const parsed = parseLineage(lineage, ref, previous);
  if (parsed.status !== 'ok') return parsed;
  return { status: 'ok', value: sealEvent(lineage, parsed.value.records, parsed.value.checks, overrides) };
}

/** UPD-FR-002 from the raw FR-v2 sheet. FR needs no previous state. */
export const loadFrEvent = (lineage: LineageEntry, ref: ReferenceData, overrides: Overrides = {}) =>
  loadLineageEvent(lineage, ref, [], overrides);
