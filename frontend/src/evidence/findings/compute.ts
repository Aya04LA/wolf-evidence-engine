import type {
  Finding,
  PriceFacts,
  SpendFacts,
  FindingPolicy,
  CanonicalRecord,
  SupplierCandidate,
} from '../domain/types';

import { sumCents, divRoundHalfEven } from '../domain/money';

export const DEFAULT_POLICY: FindingPolicy = { minInvoiceLines: 3, maxPriceSpreadPct: 25 };

export interface ComputedFinding {
  findingKey: string;
  finding: Finding;
  contributing: readonly CanonicalRecord[];
}

export const spendKey = (market: string) => `${market}:spend-total`;
export const priceKey = (market: string, productCode: string) => `${market}:${productCode}:price-decision`;

/**
 * All findings for a canonical state. Deterministic: output order is sorted by key, and every
 * number is integer cents.
 */
export function computeFindings(
  records: readonly CanonicalRecord[],
  referencePrices: ReadonlyMap<string, number>,
  policy: FindingPolicy = DEFAULT_POLICY
): ComputedFinding[] {
  const byMarket = groupBy(records, (r) => r.iso);
  const out: ComputedFinding[] = [];

  for (const [market, rows] of byMarket) {
    out.push(spendFinding(market, rows));
    for (const [productCode, productRows] of groupBy(rows, (r) => r.productCode)) {
      out.push(priceFinding(market, productCode, productRows, referencePrices.get(productCode) ?? null, policy));
    }
  }
  return out.sort((a, b) => (a.findingKey < b.findingKey ? -1 : 1));
}

/** Net market spend. Credit notes reduce it; they are never dropped. */
function spendFinding(market: string, rows: CanonicalRecord[]): ComputedFinding {
  const invoice = sumCents(rows.filter((r) => r.kind === 'invoice').map((r) => r.valueEURCents));
  const credit = sumCents(rows.filter((r) => r.kind === 'credit_note').map((r) => r.valueEURCents));
  const facts: SpendFacts = {
    kind: 'spend_total',
    market,
    totalEURCents: invoice + credit,
    invoiceEURCents: invoice,
    creditEURCents: credit,
    rows: rows.length,
  };
  return {
    findingKey: spendKey(market),
    finding: { facts, value: { status: 'ok', value: { totalEURCents: facts.totalEURCents } } },
    contributing: rows,
  };
}

/**
 * Which supplier should get this product in this market? The cheapest supplier whose price
 * evidence is both sufficient (≥ minInvoiceLines) and stable (spread ≤ maxPriceSpreadPct).
 * If no supplier qualifies, the finding abstains and names the reason and the rows.
 */
function priceFinding(
  market: string,
  productCode: string,
  rows: CanonicalRecord[],
  referencePrice: number | null,
  policy: FindingPolicy
): ComputedFinding {
  const candidates: SupplierCandidate[] = [];
  for (const [supplierId, supplierRows] of groupBy(rows, (r) => r.supplierId)) {
    candidates.push(candidate(supplierId, supplierRows, policy));
  }
  candidates.sort((a, b) => (a.supplierId < b.supplierId ? -1 : 1));

  const facts: PriceFacts = {
    kind: 'price_decision',
    market,
    productCode,
    referencePriceEURCents: referencePrice,
    candidates,
  };
  const key = priceKey(market, productCode);
  const eligible = candidates
    .filter((c) => c.status === 'eligible')
    .sort((a, b) => a.avgUnitPriceEURCents - b.avgUnitPriceEURCents || (a.supplierId < b.supplierId ? -1 : 1));

  if (eligible.length === 0) {
    const worst = candidates.find((c) => c.status === 'unstable_price');
    const evidenceRows = rows.filter(
      (r) =>
        r.kind === 'invoice' &&
        (r.unitPriceEURCents === worst?.minUnitPriceEURCents || r.unitPriceEURCents === worst?.maxUnitPriceEURCents)
    );
    const value = worst
      ? {
          status: 'abstain' as const,
          reason: 'price_inconsistent' as const,
          detail: `${worst.supplierId} prices ${productCode} between ${worst.minUnitPriceEURCents} and ${worst.maxUnitPriceEURCents} cents (> ${policy.maxPriceSpreadPct}% spread); no supplier has stable price evidence`,
          evidence: evidenceRows.map((r) => r.source),
        }
      : {
          status: 'abstain' as const,
          reason: 'insufficient_rows' as const,
          detail: `no supplier has ${policy.minInvoiceLines}+ invoice lines for ${productCode}`,
          evidence: rows.map((r) => r.source),
        };
    return { findingKey: key, finding: { facts, value }, contributing: rows };
  }

  const [best, runnerUp] = eligible;
  if (runnerUp && runnerUp.avgUnitPriceEURCents === best.avgUnitPriceEURCents) {
    return {
      findingKey: key,
      finding: {
        facts,
        value: {
          status: 'conflict',
          reason: 'price_tie',
          detail: `${best.supplierId} and ${runnerUp.supplierId} tie at ${best.avgUnitPriceEURCents} cents; a buyer must choose`,
          evidence: [],
        },
      },
      contributing: rows,
    };
  }

  return {
    findingKey: key,
    finding: {
      facts,
      value: {
        status: 'ok',
        value: {
          supplierId: best.supplierId,
          avgUnitPriceEURCents: best.avgUnitPriceEURCents,
          singleSource: candidates.length === 1,
        },
      },
    },
    contributing: rows,
  };
}

function candidate(supplierId: string, rows: CanonicalRecord[], policy: FindingPolicy): SupplierCandidate {
  const invoices = rows.filter((r) => r.kind === 'invoice');
  const qty = invoices.reduce((a, r) => a + r.qty, 0);
  const prices = invoices.map((r) => r.unitPriceEURCents);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const avg = qty > 0 ? divRoundHalfEven(sumCents(invoices.map((r) => r.valueEURCents)), qty) : 0;
  const status =
    invoices.length < policy.minInvoiceLines
      ? 'too_few_lines'
      : max * 100 > min * (100 + policy.maxPriceSpreadPct)
        ? 'unstable_price'
        : 'eligible';
  return {
    supplierId,
    invoiceLines: invoices.length,
    invoiceQty: qty,
    avgUnitPriceEURCents: avg,
    minUnitPriceEURCents: min,
    maxUnitPriceEURCents: max,
    status,
  };
}

function groupBy<T>(items: readonly T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = m.get(k);
    if (list) list.push(item);
    else m.set(k, [item]);
  }
  return new Map([...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
}
