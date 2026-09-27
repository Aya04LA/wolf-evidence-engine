import type { ReferenceData } from './fixtures';
import type { Outcome, Refusal, SourceRef, IngestCheck, CanonicalRecord } from '../domain/types';

export interface ParsedSheet {
  records: CanonicalRecord[];
  checks: IngestCheck[];
}

export const malformed = (detail: string): Refusal => ({
  status: 'rejected',
  reason: 'malformed_input',
  detail,
});

/** A sheet row where every cell is blank. */
export const isBlank = (cells: string[]): boolean => cells.every((c) => c.trim() === '');

/** Header labels checked by position. Trailing spaces in the source ("Date ") are tolerated. */
export function checkHeaders(
  row: string[] | undefined,
  expected: Partial<Record<number, string>>,
  where: string
): Refusal | null {
  if (!row) return malformed(`${where}: header row missing`);
  for (const [col, name] of Object.entries(expected)) {
    if (row[Number(col)]?.trim() !== name) {
      return malformed(`${where}: column ${col} is "${row[Number(col)] ?? ''}", expected "${name}"`);
    }
  }
  return null;
}

export const recordId = (prefix: string, seq: number): string => `${prefix}-${String(seq).padStart(4, '0')}`;

/**
 * Resolves the supplier for layouts that carry no supplier column (XK, IT). The only
 * defensible source is the previous version of the same market: a product that had exactly one
 * supplier keeps it. Zero or several candidates ⇒ abstain, never a guess.
 */
export type SupplierResolver = (productCode: string, at: SourceRef) => Outcome<string>;

export function supplierFromPrevious(
  previous: readonly CanonicalRecord[],
  market: string
): SupplierResolver {
  const byProduct = new Map<string, Set<string>>();
  for (const r of previous) {
    if (r.iso !== market) continue;
    byProduct.set(r.productCode, (byProduct.get(r.productCode) ?? new Set()).add(r.supplierId));
  }
  return (productCode, at) => {
    const candidates = [...(byProduct.get(productCode) ?? [])].sort();
    if (candidates.length === 1) return { status: 'ok', value: candidates[0] };
    return {
      status: 'abstain',
      reason: 'unresolved_supplier',
      detail:
        candidates.length === 0
          ? `${market}: no previous supplier for ${productCode}, and the sheet has no supplier column`
          : `${market}: ${productCode} had several previous suppliers (${candidates.join(', ')})`,
      evidence: [at],
    };
  };
}

/** Looks a product up by its exact catalogue name (XK only prints names in group rows). */
export function productByName(ref: ReferenceData, name: string): string[] {
  return [...ref.products.values()].filter((p) => p.name === name.trim()).map((p) => p.code);
}
