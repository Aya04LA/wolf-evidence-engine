import type { ReferenceData } from './fixtures';
import type { Outcome, SourceRef, IngestCheck, CanonicalRecord } from '../domain/types';

import { sealRecord } from './record';
import { excelSerialToIso } from './csv';
import { sumCents, parseCents, divRoundHalfEven } from '../domain/money';

/**
 * FR-v2 (UPD-FR-002): a repaired subset for one supplier.
 *
 * Hazards in this layout (see `input-schema.json`):
 * - 34 columns with duplicate header names, so every column is addressed by position.
 * - The invoice header total (col 3) repeats on every line. It is a reconciliation target and
 *   is NEVER summed per line.
 * - Cancellations arrive as CREDIT_NOTE lines with negative quantity and net value.
 * - The sheet carries no supplier column. Supplier comes from the event scope, labelled as such.
 */
const COL = {
  invoiceDate: 2,
  invoiceTotal: 3,
  headerCurrency: 4,
  invoice: 5,
  article: 6,
  qty: 8,
  unit: 9,
  net: 10,
  lineCurrency: 11,
  itemSeq: 14,
  typeCode: 20,
} as const;

const EXPECTED_WIDTH = 34;
const EXPECTED_HEADERS: Partial<Record<number, string>> = {
  [COL.invoiceDate]: 'Invoice date',
  [COL.invoiceTotal]: 'Invoice total',
  [COL.invoice]: 'Invoice',
  [COL.article]: 'Article',
  [COL.qty]: 'Invoiced quantity',
  [COL.unit]: 'Quantity unit',
  [COL.net]: 'Net value',
  [COL.lineCurrency]: 'Currency',
  [COL.itemSeq]: 'Item',
  [COL.typeCode]: 'Invoice type code',
};
const UNIT_MAP: Record<string, 'piece'> = { PC: 'piece' };

export interface ParseContext {
  file: string;
  market: string;
  scopeSupplierId: string;
  idPrefix: string;
  ref: ReferenceData;
}

export interface ParsedSheet {
  records: CanonicalRecord[];
  checks: IngestCheck[];
}

export function parseFr(matrix: string[][], ctx: ParseContext): Outcome<ParsedSheet> {
  const [header, ...body] = matrix;
  const at = (row: number, columns: number[]): SourceRef => ({ file: ctx.file, row, columns });

  if (!header || header.length !== EXPECTED_WIDTH) {
    return reject(`expected ${EXPECTED_WIDTH} header columns, got ${header?.length ?? 0}`);
  }
  for (const [col, name] of Object.entries(EXPECTED_HEADERS)) {
    if (header[Number(col)]?.trim() !== name) {
      return reject(`header at column ${col} is "${header[Number(col)]}", expected "${name}"`);
    }
  }

  const supplier = ctx.ref.suppliers.get(ctx.scopeSupplierId);
  if (!supplier) return reject(`scope supplier ${ctx.scopeSupplierId} is not in suppliers.json`);

  const records: CanonicalRecord[] = [];
  const invoices = new Map<string, { headerTotals: Set<number>; lines: number[]; refs: SourceRef[] }>();

  for (let i = 0; i < body.length; i++) {
    const cells = body[i];
    const rowNo = i + 2; // 1-based, header is row 1
    if (cells.every((c) => c.trim() === '')) continue;
    if (cells.length !== EXPECTED_WIDTH) {
      return reject(`row ${rowNo} has ${cells.length} columns, expected ${EXPECTED_WIDTH}`);
    }
    const ref = at(rowNo, Object.values(COL));

    const qty = Number(cells[COL.qty]);
    const net = parseCents(cells[COL.net]);
    const headerTotal = parseCents(cells[COL.invoiceTotal]);
    const date = excelSerialToIso(Number(cells[COL.invoiceDate]));
    if (!Number.isInteger(qty) || qty === 0 || net === null || headerTotal === null || !date) {
      return reject(`row ${rowNo}: unreadable quantity, net value, invoice total or date`);
    }

    const unit = UNIT_MAP[cells[COL.unit].trim()];
    if (!unit) {
      return {
        status: 'abstain',
        reason: 'unit_unverified',
        detail: `row ${rowNo}: unit "${cells[COL.unit]}" has no verified piece conversion`,
        evidence: [ref],
      };
    }

    const currency = cells[COL.lineCurrency].trim();
    if (currency !== cells[COL.headerCurrency].trim()) {
      return {
        status: 'conflict',
        reason: 'currency_mismatch',
        detail: `row ${rowNo}: line currency ${currency} differs from invoice currency ${cells[COL.headerCurrency]}`,
        evidence: [ref],
      };
    }
    if (currency !== 'EUR') {
      // FR is EUR-only. Converting here would need an effective-dated rate we do not have.
      return {
        status: 'abstain',
        reason: 'unknown_currency',
        detail: `row ${rowNo}: FR line in ${currency}, no effective-dated rate`,
        evidence: [ref],
      };
    }

    const typeCode = cells[COL.typeCode].trim();
    const kind = typeCode === 'CREDIT_NOTE' ? 'credit_note' : typeCode === 'INVOICE' ? 'invoice' : null;
    const signOk = kind === 'credit_note' ? qty < 0 && net < 0 : qty > 0 && net > 0;
    if (!kind || !signOk) {
      return {
        status: 'conflict',
        reason: 'arithmetic_mismatch',
        detail: `row ${rowNo}: type ${typeCode} with qty ${qty} and net ${net} cents is inconsistent`,
        evidence: [ref],
      };
    }

    const productCode = cells[COL.article].trim();
    const product = ctx.ref.products.get(productCode);
    if (!product) {
      return {
        status: 'abstain',
        reason: 'unknown_product',
        detail: `row ${rowNo}: article ${productCode} is not in products.json`,
        evidence: [ref],
      };
    }

    const seq = Number(cells[COL.itemSeq]);
    if (!Number.isInteger(seq) || seq < 1) return reject(`row ${rowNo}: item sequence unreadable`);

    const invoiceRef = cells[COL.invoice].trim();
    const inv = invoices.get(invoiceRef) ?? { headerTotals: new Set(), lines: [], refs: [] };
    inv.headerTotals.add(headerTotal);
    inv.lines.push(net);
    inv.refs.push(ref);
    invoices.set(invoiceRef, inv);

    records.push(
      sealRecord({
        id: `${ctx.idPrefix}-${String(seq).padStart(4, '0')}`,
        iso: ctx.market,
        supplierId: supplier.id,
        brand: supplier.name,
        productCode,
        description: product.name,
        cluster: product.cluster,
        date,
        qty,
        unit,
        unitPriceEURCents: divRoundHalfEven(Math.abs(net), Math.abs(qty)),
        valueEURCents: net,
        currency,
        valueLocalCents: net,
        kind,
        invoiceRef,
        source: ref,
        origins: {
          supplierId: 'event_scope',
          brand: 'reference',
          description: 'reference',
          cluster: 'reference',
          unitPriceEURCents: 'derived',
          valueEURCents: 'sheet',
          qty: 'sheet',
          date: 'sheet',
        },
      }),
    );
  }

  const seen = new Set<string>();
  for (const r of records) {
    if (seen.has(r.id)) {
      return {
        status: 'conflict',
        reason: 'duplicate_record_id',
        detail: `item sequence produces duplicate id ${r.id}`,
        evidence: [r.source],
      };
    }
    seen.add(r.id);
  }

  // Reconciliation: header total is constant per invoice and equals the sum of its line nets.
  const checks: IngestCheck[] = [];
  for (const [invoiceRef, inv] of invoices) {
    const lineSum = sumCents(inv.lines);
    const [headerTotal] = inv.headerTotals;
    const passed = inv.headerTotals.size === 1 && headerTotal === lineSum;
    checks.push({
      name: `reconcile:${invoiceRef}`,
      passed,
      detail: `Σ line net ${lineSum} cents vs header total ${[...inv.headerTotals].join('/')} cents over ${inv.lines.length} lines`,
      evidence: inv.refs,
    });
  }
  const failed = checks.filter((c) => !c.passed);
  if (failed.length > 0) {
    return {
      status: 'conflict',
      reason: 'reconciliation_failed',
      detail: failed.map((c) => `${c.name}: ${c.detail}`).join('; '),
      evidence: failed.flatMap((c) => c.evidence),
    };
  }

  return { status: 'ok', value: { records, checks } };
}

function reject(detail: string): Outcome<never> {
  return { status: 'rejected', reason: 'malformed_input', detail };
}
