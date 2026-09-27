import type { ParsedSheet } from './common';
import type { ReferenceData } from './fixtures';
import type { Outcome, CanonicalRecord } from '../domain/types';

import { sealRecord } from './record';
import { parseCents, localToEURCents } from '../domain/money';
import { isBlank, recordId, malformed, checkHeaders } from './common';

/**
 * HU-v2 (UPD-HU-002, add_supplier): one supplier's delivery priced in HUF per unit.
 *
 * - Supplier is named by Brand. It must resolve to exactly one supplier AND equal the event
 *   scope; a sheet from a different supplier is a conflict, not a silent relabel.
 * - EUR conversion: unit price HUF → EUR at fx-rates.json (rounded once, half-even), then
 *   × quantity. Local value stays exact in HUF. This is the rule the expected records follow.
 * - The sheet carries no date: `date` is null rather than invented.
 */
const COL = { brand: 0, supplierCode: 1, product: 2, description: 3, unit: 4, qty: 5, price: 6 } as const;
const HEADERS = {
  [COL.brand]: 'Brand',
  [COL.supplierCode]: 'Supplier Code',
  [COL.product]: 'Manufacturer Code',
  [COL.unit]: 'Unit',
  [COL.qty]: 'Quantity',
  [COL.price]: 'Selling Price/Unit (Ft)',
};
const CURRENCY = 'HUF';

export interface HuContext {
  file: string;
  market: string;
  scopeSupplierId: string;
  idPrefix: string;
  ref: ReferenceData;
}

export function parseHu(matrix: string[][], ctx: HuContext): Outcome<ParsedSheet> {
  const [header, ...body] = matrix;
  const bad = checkHeaders(header, HEADERS, ctx.file);
  if (bad) return bad;

  const rate = ctx.ref.fx[CURRENCY];
  if (rate === undefined) {
    return {
      status: 'abstain',
      reason: 'unknown_currency',
      detail: `no ${CURRENCY} rate in fx-rates.json`,
      evidence: [{ file: 'fx-rates.json', row: 0, columns: [] }],
    };
  }

  const records: CanonicalRecord[] = [];
  for (let i = 0; i < body.length; i++) {
    const cells = body[i];
    const row = i + 2;
    if (isBlank(cells)) continue;
    const at = { file: ctx.file, row, columns: Object.values(COL) };

    const brand = cells[COL.brand].trim();
    const matches = [...ctx.ref.suppliers.values()].filter((s) => s.name === brand);
    if (matches.length !== 1 || matches[0].id !== ctx.scopeSupplierId) {
      return {
        status: 'conflict',
        reason: 'supplier_mismatch',
        detail: `row ${row}: brand "${brand}" resolves to ${matches.map((s) => s.id).join('/') || 'no supplier'}, event scope is ${ctx.scopeSupplierId}`,
        evidence: [at],
      };
    }

    if (cells[COL.unit].trim() !== 'PC') {
      return {
        status: 'abstain',
        reason: 'unit_unverified',
        detail: `row ${row}: unit "${cells[COL.unit]}" has no verified piece conversion`,
        evidence: [at],
      };
    }

    const productCode = cells[COL.product].trim();
    const product = ctx.ref.products.get(productCode);
    if (!product) {
      return { status: 'abstain', reason: 'unknown_product', detail: `row ${row}: ${productCode}`, evidence: [at] };
    }

    const qty = Number(cells[COL.qty]);
    const unitLocal = parseCents(cells[COL.price]);
    const seq = Number(/^[A-Z]+-(\d+)$/.exec(cells[COL.supplierCode].trim())?.[1]);
    if (!Number.isInteger(qty) || qty <= 0 || unitLocal === null || unitLocal <= 0 || !Number.isInteger(seq)) {
      return malformed(`row ${row}: unreadable quantity, price or supplier code`);
    }
    const unitEUR = localToEURCents(unitLocal, rate);
    if (unitEUR === null) return malformed(`fx rate ${rate} for ${CURRENCY} is not a plain decimal`);

    records.push(
      sealRecord({
        id: recordId(ctx.idPrefix, seq),
        iso: ctx.market,
        supplierId: matches[0].id,
        brand: matches[0].name,
        productCode,
        description: product.name,
        cluster: product.cluster,
        date: null,
        qty,
        unit: 'piece',
        unitPriceEURCents: unitEUR,
        valueEURCents: unitEUR * qty,
        currency: CURRENCY,
        valueLocalCents: unitLocal * qty,
        kind: 'invoice',
        invoiceRef: null,
        source: at,
        origins: {
          supplierId: 'sheet',
          unitPriceEURCents: 'derived',
          valueEURCents: 'derived',
          valueLocalCents: 'derived',
          cluster: 'reference',
        },
      })
    );
  }

  return { status: 'ok', value: { records, checks: [] } };
}
