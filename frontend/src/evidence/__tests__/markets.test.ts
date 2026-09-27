import type { FixtureRecord } from '../ingest/load-event';
import type { SourceEvent, LineageEntry, CanonicalRecord } from '../domain/types';

import { it, expect, describe } from 'vitest';

import { parseCsv } from '../ingest/csv';
import { sumCents } from '../domain/money';
import { parseHu } from '../ingest/parse-hu';
import { parseIt } from '../ingest/parse-it';
import { parseXk } from '../ingest/parse-xk';
import { ref, cents, versions } from './helpers';
import { apply, replay } from '../store/event-log';
import { supplierFromPrevious } from '../ingest/common';
import { readFixtureJson, readFixtureText } from '../ingest/fixtures';
import { fixtureEvent, baselineLineage, loadLineageEvent } from '../ingest/load-event';

const lineages = readFixtureJson<LineageEntry[]>('update-lineage.json')!;
const lineage = (m: string) => lineages.find((l) => l.market === m)!;
const v = versions() as unknown as Record<string, Record<'v1' | 'v2' | 'current', FixtureRecord[]>>;
const MARKETS = ['FR', 'HU', 'XK', 'IT'] as const;

const unwrap = <T>(o: { status: string; value?: T; detail?: string }): T => {
  if (o.status !== 'ok') throw new Error(`${o.status}: ${o.detail}`);
  return o.value as T;
};

const baselineEvents = (): SourceEvent[] =>
  MARKETS.map((m) => unwrap(fixtureEvent(baselineLineage(m), v[m].v1, `${m}.v1`)));
const base = () => replay(baselineEvents());

const raw = (m: string, previous: readonly CanonicalRecord[] = base().records) =>
  unwrap(loadLineageEvent(lineage(m), ref(), previous));

const total = (rs: readonly CanonicalRecord[], iso: string) =>
  sumCents(rs.filter((r) => r.iso === iso).map((r) => r.valueEURCents));

/** Every economic field the sheet can prove must equal the expected v2 record. */
function expectMatchesV2(market: string, records: CanonicalRecord[], extra: (keyof FixtureRecord)[] = []) {
  const byId = new Map(records.map((r) => [r.id, r]));
  expect(records).toHaveLength(v[market].v2.length);
  for (const exp of v[market].v2) {
    const got = byId.get(exp.id);
    expect(got, exp.id).toBeDefined();
    const pick = (r: CanonicalRecord) => ({
      productCode: r.productCode,
      supplierId: r.supplierId,
      brand: r.brand,
      qty: r.qty,
      unitPriceEURCents: r.unitPriceEURCents,
      valueEURCents: r.valueEURCents,
      currency: r.currency,
      ...(extra.includes('valueLocal') ? { valueLocalCents: r.valueLocalCents } : {}),
    });
    expect(pick(got!)).toEqual({
      productCode: exp.productCode,
      supplierId: exp.supplierId,
      brand: exp.brand,
      qty: exp.qty,
      unitPriceEURCents: cents(exp.unitPriceEUR),
      valueEURCents: cents(exp.valueEUR),
      currency: exp.currency,
      ...(extra.includes('valueLocal') ? { valueLocalCents: cents(exp.valueLocal) } : {}),
    });
  }
}

const sheet = (key: Parameters<typeof readFixtureText>[0]) => parseCsv(readFixtureText(key)!);

// ---------------------------------------------------------------------------------------------

describe('raw sheets reproduce the expected v2 records', () => {
  it('HU: HUF unit price → EUR at 394, × qty; local value exact', () => {
    expectMatchesV2('HU', raw('HU').records, ['valueLocal']);
  });

  it('XK: net (excl. VAT) value, product from group rows, supplier carried from v1', () => {
    const ev = raw('XK');
    expectMatchesV2('XK', ev.records);
    expect(ev.checks).toHaveLength(24);
    expect(ev.checks.every((c) => c.passed)).toBe(true);
    expect(ev.records[0].origins.supplierId).toBe('derived');
  });

  it('IT: two sheets, net position and purchasing price (never sales price)', () => {
    const ev = raw('IT');
    expectMatchesV2('IT', ev.records);
    expect(new Set(ev.records.map((r) => r.source.sheet))).toEqual(new Set(['MA CARR', 'MA VERN']));
    expect(ev.records.every((r) => r.origins.unit === 'reference' && r.date === null)).toBe(true);
  });
});

describe('end to end from raw sheets: all four lineage events', () => {
  const run = () => {
    let s = base();
    for (const m of MARKETS) s = apply(s, raw(m, s.records));
    return s;
  };

  it.each([
    ['FR', 24, 11_654_684],
    ['HU', 48, 38_911_461],
    ['XK', 24, 16_136_398],
    ['IT', 24, 20_498_376],
  ])('%s → %i rows / %i cents (expected-current)', (m, rows, cts) => {
    const s = run();
    expect(s.records.filter((r) => r.iso === m)).toHaveLength(rows);
    expect(total(s.records, m)).toBe(cts);
    expect(total(s.records, m)).toBe(sumCents(v[m].current.map((r) => cents(r.valueEUR))));
    expect(
      s.records
        .filter((r) => r.iso === m)
        .map((r) => r.id)
        .sort()
    ).toEqual(v[m].current.map((r) => r.id).sort());
  });

  it('every event applied; replaying all four again changes nothing', () => {
    const once = run();
    expect(once.log.slice(-4).map((e) => e.status)).toEqual(['applied', 'applied', 'applied', 'applied']);
    let twice = once;
    for (const m of MARKETS) twice = apply(twice, raw(m, base().records));
    expect(twice.stateHash).toBe(once.stateHash);
    expect(twice.log.slice(-4).map((e) => e.status)).toEqual(Array(4).fill('duplicate_event'));
  });
});

describe('adversarial inputs become explicit exceptions', () => {
  const huCtx = () => ({
    file: 'input-sheets/HU-v2--Sheet1.csv',
    market: 'HU',
    scopeSupplierId: 'sup-orbit',
    idPrefix: 'HU-LATEST',
    ref: ref(),
  });

  it('HU sheet from a different brand than the event scope → supplier_mismatch', () => {
    const m = sheet('HU-v2');
    m[3][0] = '3M';
    expect(parseHu(m, huCtx())).toMatchObject({ status: 'conflict', reason: 'supplier_mismatch' });
  });

  it('HU with no HUF rate → abstain unknown_currency', () => {
    const r = ref();
    const fx = Object.fromEntries(Object.entries(r.fx).filter(([k]) => k !== 'HUF'));
    expect(parseHu(sheet('HU-v2'), { ...huCtx(), ref: { ...r, fx } })).toMatchObject({
      status: 'abstain',
      reason: 'unknown_currency',
    });
  });

  const xkCtx = (previous = base().records) => ({
    file: 'input-sheets/XK-v2--Report.csv',
    market: 'XK',
    idPrefix: 'XK-LATEST',
    ref: ref(),
    resolveSupplier: supplierFromPrevious(previous, 'XK'),
  });

  it('XK net that does not reconcile with gross − VAT → arithmetic_mismatch', () => {
    const m = sheet('XK-v2');
    m[5][8] = '1177.00';
    expect(parseXk(m, xkCtx())).toMatchObject({ status: 'conflict', reason: 'arithmetic_mismatch' });
  });

  it('XK with no previous version to carry suppliers from → abstain, no guessing', () => {
    expect(parseXk(sheet('XK-v2'), xkCtx([]))).toMatchObject({
      status: 'abstain',
      reason: 'unresolved_supplier',
    });
  });

  it('XK group row naming a product outside the catalogue → abstain', () => {
    const m = sheet('XK-v2');
    m[4][1] = 'Graduated mixing cup (new pack)';
    expect(parseXk(m, xkCtx())).toMatchObject({ status: 'abstain', reason: 'unknown_product' });
  });

  const itCtx = () => ({
    market: 'IT',
    idPrefix: 'IT-LATEST',
    ref: ref(),
    resolveSupplier: supplierFromPrevious(base().records, 'IT'),
  });
  const itSheets = () => [
    { name: 'MA CARR', file: 'input-sheets/IT-v2--MA CARR.csv', matrix: sheet('IT-v2:MA CARR') },
    { name: 'MA VERN', file: 'input-sheets/IT-v2--MA VERN.csv', matrix: sheet('IT-v2:MA VERN') },
  ];

  it('IT purchasing price swapped for the sales price → arithmetic_mismatch', () => {
    const s = itSheets();
    s[0].matrix[2][11] = s[0].matrix[2][12];
    expect(parseIt(s, itCtx())).toMatchObject({ status: 'conflict', reason: 'arithmetic_mismatch' });
  });

  it('IT order number duplicated across the two sheets → duplicate_record_id', () => {
    const s = itSheets();
    s[1].matrix[2][1] = s[0].matrix[2][1];
    expect(parseIt(s, itCtx())).toMatchObject({ status: 'conflict', reason: 'duplicate_record_id' });
  });

  it('a missing sheet file → abstain missing_source', () => {
    const previous = base().records;
    const r = ref();
    const prev = process.env.WOLF_KIT_DIR;
    process.env.WOLF_KIT_DIR = '/nonexistent-kit';
    try {
      expect(loadLineageEvent(lineage('XK'), r, previous)).toMatchObject({
        status: 'abstain',
        reason: 'missing_source',
      });
    } finally {
      if (prev === undefined) delete process.env.WOLF_KIT_DIR;
      else process.env.WOLF_KIT_DIR = prev;
    }
  });
});
