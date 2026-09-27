/**
 * Domain types for the Track 1 evidence engine.
 *
 * This module has no runtime dependencies. Every other layer builds on these shapes, so a
 * malformed record is rejected at the type boundary instead of being silently accepted.
 */

export type MergeMode = 'replace_market' | 'add_supplier' | 'replace_supplier_subset';

/** sha256 hex of a canonical JSON payload. Branded so a random string cannot pass as one. */
export type ContentId = string & { readonly __brand: 'ContentId' };

/** Where a field value came from. Anything not read from the sheet is labelled. */
export type FieldOrigin = 'sheet' | 'reference' | 'event_scope' | 'derived' | 'baseline_fixture' | 'buyer_correction';

/** Pointer back to the exact physical location in a source file. */
export interface SourceRef {
  /** Path relative to `kit/dataset/`, e.g. `input-sheets/FR-v2--Sheet1.csv`. */
  file: string;
  sheet?: string;
  /** 1-based physical row in the file, header rows included. */
  row: number;
  /** 0-based column positions actually read. Positional, never header names. */
  columns: number[];
}

export type RecordKind = 'invoice' | 'credit_note';

export interface CanonicalRecord {
  /** Stable business id, e.g. `FR-LATEST-0001`. */
  id: string;
  /** Hash of the normalized economic fields. Changes if and only if the content changes. */
  contentId: ContentId;
  iso: string;
  supplierId: string;
  brand: string;
  productCode: string;
  description: string;
  cluster: string;
  /** ISO date as printed in the source document. Null when the source carries no date (HU, IT). */
  date: string | null;
  /** Signed. Credit notes are negative and are never dropped. */
  qty: number;
  unit: 'piece';
  unitPriceEURCents: number;
  /** Line net value. Never a repeated invoice header total. */
  valueEURCents: number;
  currency: string;
  valueLocalCents: number;
  kind: RecordKind;
  invoiceRef: string | null;
  source: SourceRef;
  origins: Partial<Record<keyof CanonicalRecord, FieldOrigin>>;
}

export type AbstainReason =
  | 'insufficient_rows'
  | 'unit_unverified'
  | 'missing_source'
  | 'unknown_currency'
  | 'unknown_product'
  | 'unresolved_supplier'
  | 'price_inconsistent';
export type ConflictReason =
  | 'reconciliation_failed'
  | 'currency_mismatch'
  | 'duplicate_record_id'
  | 'arithmetic_mismatch'
  | 'supplier_mismatch'
  | 'price_tie';
export type RejectReason =
  | 'wrong_scope'
  | 'market_mismatch'
  | 'unknown_lineage'
  | 'malformed_input'
  | 'stale_version'
  | 'not_approvable'
  | 'invalid_correction';

/**
 * Every layer returns an Outcome. `abstain`, `conflict` and `rejected` are first-class results,
 * so no layer can fill a gap with a silent default.
 */
export type Outcome<T> =
  | { status: 'ok'; value: T }
  | { status: 'abstain'; reason: AbstainReason; detail: string; evidence: SourceRef[] }
  | { status: 'conflict'; reason: ConflictReason; detail: string; evidence: SourceRef[] }
  | { status: 'rejected'; reason: RejectReason; detail: string };

export const ok = <T>(value: T): Outcome<T> => ({ status: 'ok', value });

/** One deterministic check performed during ingestion, kept as evidence. */
export interface IngestCheck {
  name: string;
  passed: boolean;
  detail: string;
  evidence: SourceRef[];
}

export interface LineageEntry {
  id: string;
  market: string;
  mode: MergeMode;
  previous: string;
  incoming: string;
  effectiveDate: string;
  scopeSupplierId: string | null;
}

export interface SourceEvent {
  /** Content hash of lineage identity + scope + record contentIds. Identical re-delivery ⇒ same id. */
  id: ContentId;
  lineageId: string;
  market: string;
  mode: MergeMode;
  scopeSupplierId: string | null;
  previousVersion: string;
  incomingVersion: string;
  effectiveDate: string;
  records: CanonicalRecord[];
  checks: IngestCheck[];
}

/** Any non-ok Outcome. It carries no value, so it is valid as an Outcome of every type. */
export type Refusal = Exclude<Outcome<never>, { status: 'ok' }>;

// ---------------------------------------------------------------------------------------------
// Findings, approvals, corrections

/** Decision thresholds. Hashed into every finding version, so a policy change is a new version. */
export interface FindingPolicy {
  /** Minimum invoice lines before a supplier's price counts as evidence. */
  minInvoiceLines: number;
  /** Maximum spread between a supplier's lowest and highest unit price, in percent. */
  maxPriceSpreadPct: number;
}

export interface SpendFacts {
  kind: 'spend_total';
  market: string;
  totalEURCents: number;
  invoiceEURCents: number;
  creditEURCents: number;
  rows: number;
}

export type CandidateStatus = 'eligible' | 'unstable_price' | 'too_few_lines';

export interface SupplierCandidate {
  supplierId: string;
  invoiceLines: number;
  invoiceQty: number;
  /** Volume-weighted over invoice lines only. Credits are excluded from price, not from spend. */
  avgUnitPriceEURCents: number;
  minUnitPriceEURCents: number;
  maxUnitPriceEURCents: number;
  status: CandidateStatus;
}

export interface PriceFacts {
  kind: 'price_decision';
  market: string;
  productCode: string;
  referencePriceEURCents: number | null;
  candidates: SupplierCandidate[];
}

export interface Recommendation {
  supplierId: string;
  avgUnitPriceEURCents: number;
  singleSource: boolean;
}

export type Finding =
  | { facts: SpendFacts; value: Outcome<{ totalEURCents: number }> }
  | { facts: PriceFacts; value: Outcome<Recommendation> };

export interface Contribution {
  recordId: string;
  contentId: ContentId;
}

export interface FindingVersion {
  /** Hash of key + policy + facts + value + contributing content ids. */
  versionId: ContentId;
  findingKey: string;
  finding: Finding;
  /** The dependency-graph edges: exactly the records this version was computed from. */
  contributing: Contribution[];
  supersedes: ContentId | null;
  /** Audit sequence number of the command that produced this version. */
  producedAt: number;
}

export interface ApprovalRecord {
  id: ContentId;
  findingKey: string;
  versionId: ContentId;
  reviewer: string;
  note: string;
  at: string;
}

export type CorrectionField = 'unitPriceEURCents' | 'qty' | 'supplierId';

export interface Correction {
  id: ContentId;
  recordId: string;
  /** The record version the buyer looked at. If the source later changes it, the correction goes stale. */
  recordContentId: ContentId;
  field: CorrectionField;
  to: number | string;
  reason: string;
  reviewer: string;
  at: string;
}

/** Exhaustiveness guard: adding a union member without handling it is a compile error. */
export function assertNever(x: never): never {
  throw new Error(`unhandled case: ${JSON.stringify(x)}`);
}
