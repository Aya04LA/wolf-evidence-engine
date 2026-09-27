import { it, expect, describe } from 'vitest';

import { parseCsv } from '../ingest/csv';
import { sumCents } from '../domain/money';
import { parseFr } from '../ingest/parse-fr';
import { cents, frCtx, frText, versions } from './helpers';

/** Rewrites one cell of the FR sheet: `row` is the 1-based physical row, `col` 0-based. */
function tamper(row: number, col: number, value: string): string[][] {
  const m = parseCsv(frText());
  m[row - 1][col] = value;
  return m;
}

describe('FR-v2 ingestion (UPD-FR-002, replace_supplier_subset)', () => {
  const parsed = parseFr(parseCsv(frText()), frCtx());

  it('reads 16 sup-aster lines totalling €90,909.28 from the raw sheet', () => {
    expect(parsed.status).toBe('ok');
    if (parsed.status !== 'ok') return;
    const { records } = parsed.value;
    expect(records).toHaveLength(16);
    expect(sumCents(records.map((r) => r.valueEURCents))).toBe(9_090_928);
    expect(new Set(records.map((r) => r.supplierId))).toEqual(new Set(['sup-aster']));
  });

  it('matches every expected v2 record on its economic fields', () => {
    if (parsed.status !== 'ok') throw new Error(parsed.detail);
    const byId = new Map(parsed.value.records.map((r) => [r.id, r]));
    for (const exp of versions().FR.v2) {
      const got = byId.get(exp.id);
      expect(got, exp.id).toBeDefined();
      expect({
        productCode: got!.productCode,
        qty: got!.qty,
        valueEURCents: got!.valueEURCents,
        unitPriceEURCents: got!.unitPriceEURCents,
        supplierId: got!.supplierId,
        brand: got!.brand,
        cluster: got!.cluster,
        description: got!.description,
      }).toEqual({
        productCode: exp.productCode,
        qty: exp.qty,
        valueEURCents: cents(exp.valueEUR),
        unitPriceEURCents: cents(exp.unitPriceEUR),
        supplierId: exp.supplierId,
        brand: exp.brand,
        cluster: exp.cluster,
        description: exp.description,
      });
    }
  });

  it('keeps credit notes as signed lines instead of dropping them', () => {
    if (parsed.status !== 'ok') throw new Error(parsed.detail);
    const credits = parsed.value.records.filter((r) => r.kind === 'credit_note');
    expect(credits.map((r) => r.id).sort()).toEqual(['FR-LATEST-0001', 'FR-LATEST-0012']);
    expect(credits.every((r) => r.qty < 0 && r.valueEURCents < 0)).toBe(true);
  });

  it('labels fields that did not come from the sheet', () => {
    if (parsed.status !== 'ok') throw new Error(parsed.detail);
    const r = parsed.value.records[0];
    expect(r.origins.supplierId).toBe('event_scope');
    expect(r.origins.brand).toBe('reference');
    expect(r.source).toMatchObject({ file: 'input-sheets/FR-v2--Sheet1.csv', row: 2 });
  });

  it('records the sheet invoice date, which differs from the fixture transaction date (known gap)', () => {
    if (parsed.status !== 'ok') throw new Error(parsed.detail);
    const r = parsed.value.records.find((x) => x.id === 'FR-LATEST-0001')!;
    expect(r.date).toBe('2026-09-05');
    expect(versions().FR.v2.find((x) => x.id === 'FR-LATEST-0001')!.date).toBe('2026-01-10');
  });

  it('reconciles every invoice: Σ line net == repeated header total', () => {
    if (parsed.status !== 'ok') throw new Error(parsed.detail);
    const { checks } = parsed.value;
    expect(checks).toHaveLength(6);
    expect(checks.every((c) => c.passed)).toBe(true);
    expect(checks.find((c) => c.name === 'reconcile:FAC-WOLF-0001')!.detail).toContain('95304');
  });

  it('shows why the header total must not be summed per line', () => {
    const body = parseCsv(frText()).slice(1);
    const naive = sumCents(body.map((row) => Number(row[3].replace('.', ''))));
    expect(naive).not.toBe(9_090_928);
  });
});

describe('FR-v2 failure states are explicit, never defaults', () => {
  it('conflict when a line no longer reconciles with its invoice total', () => {
    const out = parseFr(tamper(2, 10, '-11336.00'), frCtx());
    expect(out).toMatchObject({ status: 'conflict', reason: 'reconciliation_failed' });
  });

  it('abstains on a box unit instead of assuming pieces', () => {
    const out = parseFr(tamper(3, 9, 'BOX'), frCtx());
    expect(out).toMatchObject({ status: 'abstain', reason: 'unit_unverified' });
    if (out.status === 'abstain') expect(out.evidence[0].row).toBe(3);
  });

  it('conflict on line/header currency mismatch', () => {
    const out = parseFr(tamper(4, 11, 'USD'), frCtx());
    expect(out).toMatchObject({ status: 'conflict', reason: 'currency_mismatch' });
  });

  it('conflict when an INVOICE line carries a negative amount', () => {
    const m = tamper(3, 8, '-174');
    m[2][10] = '-8727.84';
    expect(parseFr(m, frCtx())).toMatchObject({ status: 'conflict', reason: 'arithmetic_mismatch' });
  });

  it('abstains on an unknown article', () => {
    expect(parseFr(tamper(5, 6, 'WLF-9999'), frCtx())).toMatchObject({
      status: 'abstain',
      reason: 'unknown_product',
    });
  });

  it('rejects a sheet whose columns moved', () => {
    const m = parseCsv(frText()).map((row) => row.slice(1));
    expect(parseFr(m, frCtx())).toMatchObject({ status: 'rejected', reason: 'malformed_input' });
  });

  it('rejects an unknown scope supplier', () => {
    expect(parseFr(parseCsv(frText()), { ...frCtx(), scopeSupplierId: 'sup-ghost' })).toMatchObject({
      status: 'rejected',
    });
  });
});
