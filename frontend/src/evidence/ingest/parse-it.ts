import type { ReferenceData } from './fixtures';
import type { ParsedSheet, SupplierResolver } from './common';
import type { Outcome, IngestCheck, CanonicalRecord } from '../domain/types';

import { sealRecord } from './record';
import { parseCents } from '../domain/money';
import { isBlank, recordId, malformed, checkHeaders } from './common';

/**
 * IT-v2 (UPD-IT-002, replace_market): two sheets (one per site) that together form the delivery.
 *
 * - Two header rows. Row 1 repeats "Order type" (cols 3 and 4); row 2 is the readable one.
 * - Several price concepts: Gross position (incl. VAT), Net position, Purchasing price (PA) and
 *   Sales price (PV). The canonical value is NET position and the unit price is PA. PV is the
 *   resale price and is never used. PA × qty = net is checked per line.
 * - No supplier, unit or date column. Supplier comes from the resolver (`derived`), unit from
 *   the product catalogue (`reference`), and date is null.
 * - Order numbers must be unique across both sheets.
 */
const COL = { order: 1, product: 7, gross: 9, net: 10, pa: 11, pv: 12, qty: 13, site: 14 } as const;
const HEADERS = {
  [COL.product]: 'Product ID',
  [COL.gross]: 'Gross position',
  [COL.net]: 'Net position',
  [COL.pa]: 'Purchasing price',
  [COL.pv]: 'Sales price',
  [COL.qty]: 'Quantity',
  [COL.site]: 'Internal operation abbreviation',
};

export interface ItSheet {
  name: string;
  file: string;
  matrix: string[][];
}

export interface ItContext {
  market: string;
  idPrefix: string;
  ref: ReferenceData;
  resolveSupplier: SupplierResolver;
}

export function parseIt(sheets: ItSheet[], ctx: ItContext): Outcome<ParsedSheet> {
  const records: CanonicalRecord[] = [];
  const checks: IngestCheck[] = [];
  const seenOrders = new Map<string, string>();

  for (const sheet of sheets) {
    const [row1, row2, ...body] = sheet.matrix;
    if (row1?.[3]?.trim() !== 'Order type' || row1?.[4]?.trim() !== 'Order type') {
      return malformed(`${sheet.file}: first header row does not have the expected duplicate "Order type"`);
    }
    const bad = checkHeaders(row2, HEADERS, sheet.file);
    if (bad) return bad;

    for (let i = 0; i < body.length; i++) {
      const cells = body[i];
      const row = i + 3;
      if (isBlank(cells)) continue;
      const at = { file: sheet.file, sheet: sheet.name, row, columns: Object.values(COL) };

      const order = cells[COL.order].trim();
      const prior = seenOrders.get(order);
      if (prior) {
        return {
          status: 'conflict',
          reason: 'duplicate_record_id',
          detail: `order ${order} appears in both ${prior} and ${sheet.name}`,
          evidence: [at],
        };
      }
      seenOrders.set(order, sheet.name);

      if (cells[COL.site].trim() !== sheet.name) {
        return malformed(`${sheet.file} row ${row}: site "${cells[COL.site]}" does not match sheet ${sheet.name}`);
      }

      const productCode = cells[COL.product].trim();
      const product = ctx.ref.products.get(productCode);
      if (!product) {
        return { status: 'abstain', reason: 'unknown_product', detail: `row ${row}: ${productCode}`, evidence: [at] };
      }
      if (product.unit !== 'piece') {
        return {
          status: 'abstain',
          reason: 'unit_unverified',
          detail: `row ${row}: no unit column and catalogue unit is "${product.unit}"`,
          evidence: [at],
        };
      }

      const seq = Number(/^ORD-[A-Z]{2}-(\d+)$/.exec(order)?.[1]);
      const qty = Number(cells[COL.qty]);
      const net = parseCents(cells[COL.net]);
      const pa = parseCents(cells[COL.pa]);
      if (!Number.isInteger(seq) || !Number.isInteger(qty) || qty <= 0 || net === null || pa === null) {
        return malformed(`${sheet.file} row ${row}: unreadable order number, quantity or amounts`);
      }

      const passed = pa * qty === net;
      checks.push({
        name: `pa-x-qty:${order}`,
        passed,
        detail: `PA ${pa} × ${qty} = ${pa * qty} vs net ${net}`,
        evidence: [at],
      });
      if (!passed) {
        return {
          status: 'conflict',
          reason: 'arithmetic_mismatch',
          detail: `${sheet.name} row ${row}: purchasing price × quantity ≠ net position`,
          evidence: [at],
        };
      }

      const supplier = ctx.resolveSupplier(productCode, at);
      if (supplier.status !== 'ok') return supplier;

      records.push(
        sealRecord({
          id: recordId(ctx.idPrefix, seq),
          iso: ctx.market,
          supplierId: supplier.value,
          brand: ctx.ref.suppliers.get(supplier.value)?.name ?? supplier.value,
          productCode,
          description: product.name,
          cluster: product.cluster,
          date: null,
          qty,
          unit: 'piece',
          unitPriceEURCents: pa,
          valueEURCents: net,
          currency: 'EUR',
          valueLocalCents: net,
          kind: 'invoice',
          invoiceRef: order,
          source: at,
          origins: {
            supplierId: 'derived',
            brand: 'reference',
            unit: 'reference',
            unitPriceEURCents: 'sheet',
            valueEURCents: 'sheet',
          },
        })
      );
    }
  }

  return { status: 'ok', value: { records, checks } };
}
