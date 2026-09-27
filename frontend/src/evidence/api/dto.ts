/**
 * Wire shapes for /api/evidence/*. Types only: safe to `import type` from browser code, and
 * the only engine module the UI may depend on.
 */

export type FindingStatus = 'ok' | 'abstain' | 'conflict' | 'rejected';
export type CommandStatus = 'ok' | 'duplicate' | 'abstain' | 'conflict' | 'rejected';
export type LineageStatus = 'pending' | 'applied' | 'refused';

export interface LineageDto {
  id: string;
  market: string;
  mode: 'replace_market' | 'add_supplier' | 'replace_supplier_subset';
  scopeSupplierId: string | null;
  previous: string;
  incoming: string;
  status: LineageStatus;
  lastDetail: string | null;
}

export interface ApprovalDto {
  id: string;
  findingKey: string;
  versionId: string;
  reviewer: string;
  note: string;
  at: string;
  status: 'current' | 'stale';
}

export interface FindingSummaryDto {
  key: string;
  kind: 'spend_total' | 'price_decision';
  market: string;
  productCode: string | null;
  status: FindingStatus;
  reason: string | null;
  headline: string;
  versionId: string;
  versionCount: number;
  changedAt: number;
  approvals: ApprovalDto[];
}

export interface AuditDto {
  seq: number;
  command: 'ingest' | 'correct' | 'approve';
  subject: string;
  status: CommandStatus;
  detail: string;
  changedFindings: string[];
}

export interface StateDto {
  mode: 'in-memory-demo';
  stateHash: string;
  recordCount: number;
  lineage: LineageDto[];
  findings: FindingSummaryDto[];
  audit: AuditDto[];
  staleCorrections: { correctionId: string; detail: string }[];
}

export interface SourceRefDto {
  file: string;
  sheet?: string;
  row: number;
  columns: number[];
}

export interface RecordDto {
  id: string;
  contentId: string;
  supplierId: string;
  brand: string;
  productCode: string;
  description: string;
  date: string | null;
  qty: number;
  unitPriceEURCents: number;
  valueEURCents: number;
  currency: string;
  kind: 'invoice' | 'credit_note';
  invoiceRef: string | null;
  source: SourceRefDto;
  origins: Record<string, string>;
  corrected: boolean;
}

export interface CandidateDto {
  supplierId: string;
  invoiceLines: number;
  invoiceQty: number;
  avgUnitPriceEURCents: number;
  minUnitPriceEURCents: number;
  maxUnitPriceEURCents: number;
  status: 'eligible' | 'unstable_price' | 'too_few_lines';
}

export type FactsDto =
  | {
      kind: 'spend_total';
      market: string;
      totalEURCents: number;
      invoiceEURCents: number;
      creditEURCents: number;
      rows: number;
    }
  | {
      kind: 'price_decision';
      market: string;
      productCode: string;
      referencePriceEURCents: number | null;
      candidates: CandidateDto[];
    };

export interface VersionDto {
  versionId: string;
  supersedes: string | null;
  producedAt: number;
  status: FindingStatus;
  reason: string | null;
  headline: string;
  detail: string | null;
  facts: FactsDto;
  evidence: SourceRefDto[];
  contributingCount: number;
}

export interface FindingDetailDto {
  key: string;
  current: VersionDto;
  versions: VersionDto[];
  records: RecordDto[];
  diff: {
    from: string | null;
    to: string;
    addedRecords: string[];
    removedRecords: string[];
    changedRecords: string[];
    unchangedRecords: number;
  };
  approvals: ApprovalDto[];
  /** Why this version differs from the previous one. Numbers come from computed facts only. */
  explanation: {
    text: string;
    source: 'template' | 'model' | 'model_rejected' | 'model_unavailable';
  };
}

export interface CommandResultDto {
  result: AuditDto;
  state: StateDto;
}

export interface ReplayDto {
  commands: number;
  liveStateHash: string;
  replayedStateHash: string;
  replayedTwiceStateHash: string;
  identical: boolean;
  findingVersionsIdentical: boolean;
}

export interface ErrorDto {
  error: string;
  issues?: string[];
}
