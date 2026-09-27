import type { ReferenceData } from './fixtures';
import type { ParsedSheet, SupplierResolver } from './common';
import type { Outcome, IngestCheck, CanonicalRecord } from '../domain/types';

import { sealRecord } from './record';
import { excelSerialToIso } from './csv';
import { parseCents, divRoundHalfEven } from '../domain/money';
import { isBlank, recordId, malformed, checkHeaders, productByName } from './common';

/**
 * XK-v2 (UPD-XK-002, replace_market): a report layout, not a table.
 *
 * - Title rows, then the header on physical row 4.
 * - Group rows name the product (col 1) and carry the VAT rate (col 7). Line rows below them
 *   inherit that product. Only the catalogue name identifies the product.
 * - Each line has gross total, VAT and total excl. VAT. The canonical value is the NET total.
 *   Gross − VAT = net and VAT = net × rate are both checked per line.
 * - No supplier column: the supplier comes from the resolver (previous version) and is
 *   labelled `derived`.
 */
const HEADER_ROW = 4;
const COL = { seq: 0, group: 1, date: 2, qty: 3, unit: 4, price: 5, gross: 6, vat: 7, net: 8 } as const;
const HEADERS = {
  [COL.date]: 'Date',
  [COL.qty]: 'Quantity',
  [COL.unit]: 'Unit',
  [COL.price]: 'Price',
  [COL.gross]: 'Total',
  [COL.vat]: 'VAT',
  [COL.net]: 'Total excl. VAT',
};
const VAT_RATE = /^0\.(\d{1,4})$/;

export interface XkContext {
  file: string;
  market: string;
  idPrefix: string;
  ref: ReferenceData;
  resolveSupplier: SupplierResolver;
}

export function parseXk(matrix: string[][], ctx: XkContext): Outcome<ParsedSheet> {
  const bad = checkHeaders(matrix[HEADER_ROW - 1], HEADERS, ctx.file);
  if (bad) return bad;

  const records: CanonicalRecord[] = [];
  const checks: IngestCheck[] = [];
  let group: { productCode: string; vatScaled: number } | null = null;

  for (let i = HEADER_ROW; i < matrix.length; i++) {
    const cells = matrix[i];
    const row = i + 1;
    if (isBlank(cells)) continue;
    const at = { file: ctx.file, row, columns: Object.values(COL) };

    if (cells[COL.group].trim() !== '') {
      const codes = productByName(ctx.ref, cells[COL.group]);
      const vat = VAT_RATE.exec(cells[COL.vat].trim());
      if (codes.length !== 1) {
        return {
          status: 'abstain',
          reason: 'unknown_product',
          detail: `row ${row}: group "${cells[COL.group]}" matches ${codes.length} catalogue products`,
          evidence: [at],
        };
      }
      if (!vat) return malformed(`row ${row}: group VAT rate "${cells[COL.vat]}" unreadable`);
      group = { productCode: codes[0], vatScaled: Number(vat[1].padEnd(4, '0')) };
      continue;
    }
    if (!group) return malformed(`row ${row}: line before any product group`);

    if (cells[COL.unit].trim() !== 'PC') {
      return {
        status: 'abstain',
        reason: 'unit_unverified',
        detail: `row ${row}: unit "${cells[COL.unit]}" has no verified piece conversion`,
        evidence: [at],
      };
    }

    const seq = Number(cells[COL.seq]);
    const qty = Number(cells[COL.qty]);
    const gross = parseCents(cells[COL.gross]);
    const vat = parseCents(cells[COL.vat]);
    const net = parseCents(cells[COL.net]);
    const date = excelSerialToIso(Number(cells[COL.date]));
    if (!Number.isInteger(seq) || !Number.isInteger(qty) || qty <= 0 || gross === null || vat === null || net === null || !date) {
      return malformed(`row ${row}: unreadable sequence, quantity, amounts or date`);
    }

    const expectedVat = divRoundHalfEven(net * group.vatScaled, 10_000);
    const passed = gross - vat === net && vat === expectedVat;
    checks.push({
      name: `vat:${ctx.idPrefix}-${seq}`,
      passed,
      detail: `gross ${gross} − VAT ${vat} = ${gross - vat} vs net ${net}; VAT expected ${expectedVat}`,
      evidence: [at],
    });
    if (!passed) {
      return {
        status: 'conflict',
        reason: 'arithmetic_mismatch',
        detail: `row ${row}: gross/VAT/net do not reconcile`,
        evidence: [at],
      };
    }

    const supplier = ctx.resolveSupplier(group.productCode, at);
    if (supplier.status !== 'ok') return supplier;
    const product = ctx.ref.products.get(group.productCode)!;

    records.push(
      sealRecord({
        id: recordId(ctx.idPrefix, seq),
        iso: ctx.market,
        supplierId: supplier.value,
        brand: ctx.ref.suppliers.get(supplier.value)?.name ?? supplier.value,
        productCode: group.productCode,
        description: product.name,
        cluster: product.cluster,
        date,
        qty,
        unit: 'piece',
        unitPriceEURCents: divRoundHalfEven(net, qty),
        valueEURCents: net,
        currency: 'EUR',
        valueLocalCents: net,
        kind: 'invoice',
        invoiceRef: null,
        source: at,
        origins: {
          supplierId: 'derived',
          brand: 'reference',
          productCode: 'reference',
          unitPriceEURCents: 'derived',
          valueEURCents: 'sheet',
          date: 'sheet',
        },
      })
    );
  }

  return { status: 'ok', value: { records, checks } };
}
