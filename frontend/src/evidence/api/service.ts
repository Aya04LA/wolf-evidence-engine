import 'server-only';

import type { IngestInput, ApproveInput, CorrectInput } from './schemas';
import type { Command, Workspace, AuditEntry, WorkspaceContext } from '../store/workspace';
import type { LineageEntry, FindingVersion, ApprovalRecord, CanonicalRecord } from '../domain/types';
import type {
  AuditDto,
  StateDto,
  RecordDto,
  ReplayDto,
  VersionDto,
  LineageDto,
  ApprovalDto,
  FindingDetailDto,
  FindingSummaryDto,
} from './dto';

import { polish } from '../explain/polish';
import { formatEUR } from '../domain/money';
import { explainChange } from '../explain/narrate';
import { approvalStatus } from '../approval/approve';
import { dispatch, replayCommands } from '../store/workspace';
import { diffVersions, currentVersion } from '../provenance/graph';
import { fixtureEvent, baselineLineage, loadLineageEvent } from '../ingest/load-event';
import { readFixtureJson, referencePrices, loadReferenceData } from '../ingest/fixtures';

/**
 * The single application service behind /api/evidence/*. It owns an in-memory workspace and
 * its command log. MOCK: state lives in this server process and resets on restart. There is no
 * persistence, auth or tenant separation.
 *
 * Routes call only these functions. Business rules live in the engine layers, not here.
 */

interface Session {
  ctx: WorkspaceContext;
  lineage: LineageEntry[];
  commands: Command[];
  ws: Workspace;
}

// Survive dev hot-reload without resetting the demo.
const g = globalThis as typeof globalThis & { __wolfEvidence?: Session };

const BASELINE_MARKETS = ['FR', 'HU', 'XK', 'IT'] as const;

export class ServiceUnavailable extends Error {}

/**
 * The in-memory log is bounded: without persistence or auth, an unbounded log is a memory
 * exhaustion vector, and replay cost grows with it. Reset the demo to continue.
 */
export const MAX_AUDIT_ENTRIES = 1000;
export class CapacityExceeded extends Error {}

function withCapacity(s: Session): Session {
  if (s.ws.audit.length >= MAX_AUDIT_ENTRIES) throw new CapacityExceeded();
  return s;
}

function boot(): Session {
  const ref = loadReferenceData();
  const lineage = readFixtureJson<LineageEntry[]>('update-lineage.json');
  const versions = readFixtureJson<Record<string, { v1: Parameters<typeof fixtureEvent>[1] }>>('ingestion-versions.json');
  if (!ref || !lineage || !versions) throw new ServiceUnavailable('kit dataset not found (set WOLF_KIT_DIR)');

  const ctx: WorkspaceContext = { ref, referencePrices: referencePrices(ref) };
  const commands: Command[] = [];
  for (const m of BASELINE_MARKETS) {
    const ev = fixtureEvent(baselineLineage(m), versions[m]?.v1 ?? [], `${m}.v1`);
    if (ev.status !== 'ok') throw new ServiceUnavailable(`baseline ${m}: ${ev.detail}`);
    commands.push({ type: 'ingest', event: ev.value });
  }
  return { ctx, lineage, commands, ws: replayCommands(commands, ctx) };
}

function session(): Session {
  g.__wolfEvidence ??= boot();
  return g.__wolfEvidence;
}

export function reset(): StateDto {
  g.__wolfEvidence = boot();
  return toState(session());
}

const now = () => new Date().toISOString();

function run(s: Session, cmd: Command): AuditDto {
  s.ws = dispatch(s.ws, cmd, s.ctx);
  s.commands.push(cmd);
  return toAudit(s.ws.audit.at(-1)!);
}

// ---------------------------------------------------------------------------------------------
// Commands

export function getState(): StateDto {
  return toState(session());
}

/** Push-agent entry point: a lineage event arrives, the service builds and applies it. */
export function ingest(input: IngestInput): { result: AuditDto; state: StateDto } {
  const s = withCapacity(session());
  const entry = s.lineage.find((l) => l.id === input.lineageId);
  if (!entry) {
    return { result: refusal('ingest', input.lineageId, 'rejected', `unknown_lineage: ${input.lineageId}`), state: toState(s) };
  }
  const built = loadLineageEvent(entry, s.ctx.ref, s.ws.ledger.records, input.asMode ? { mode: input.asMode } : {});
  if (built.status !== 'ok') {
    // No event could be built, so there is nothing to replay. The refusal is still put in the
    // audit trail so the buyer sees it.
    const result = refusal('ingest', entry.id, built.status, `${built.reason}: ${built.detail}`);
    s.ws = { ...s.ws, audit: [...s.ws.audit, { ...result, seq: s.ws.audit.length + 1 }] };
    return { result: toAudit(s.ws.audit.at(-1)!), state: toState(s) };
  }
  return { result: run(s, { type: 'ingest', event: built.value }), state: toState(s) };
}

export function approveFinding(input: ApproveInput): { result: AuditDto; state: StateDto } {
  const s = withCapacity(session());
  return { result: run(s, { type: 'approve', input: { ...input, at: now() } }), state: toState(s) };
}

export function correctRecord(input: CorrectInput): { result: AuditDto; state: StateDto } {
  const s = withCapacity(session());
  return { result: run(s, { type: 'correct', input: { ...input, at: now() } }), state: toState(s) };
}

/** Proof of replay safety: rebuild from the command log, once and twice, and compare. */
export function replay(): ReplayDto {
  const s = session();
  const once = replayCommands(s.commands, s.ctx);
  const twice = replayCommands([...s.commands, ...s.commands], s.ctx);
  const versionsOf = (ws: Workspace) => [...ws.history.keys()].sort().map((k) => currentVersion(ws.history, k)!.versionId);
  return {
    commands: s.commands.length,
    liveStateHash: s.ws.ledger.stateHash,
    replayedStateHash: once.ledger.stateHash,
    replayedTwiceStateHash: twice.ledger.stateHash,
    identical: once.ledger.stateHash === s.ws.ledger.stateHash && twice.ledger.stateHash === s.ws.ledger.stateHash,
    findingVersionsIdentical:
      JSON.stringify(versionsOf(once)) === JSON.stringify(versionsOf(s.ws)) &&
      JSON.stringify(versionsOf(twice)) === JSON.stringify(versionsOf(s.ws)),
  };
}

export async function findingDetail(key: string): Promise<FindingDetailDto | null> {
  const s = session();
  const versions = s.ws.history.get(key);
  if (!versions || versions.length === 0) return null;
  const current = versions.at(-1)!;
  const previous = versions.at(-2);
  const byId = new Map(s.ws.effective.map((r) => [r.id, r]));
  const correctedIds = new Set(s.ws.corrections.map((c) => c.recordId));
  const diff = diffVersions(previous, current);
  const supplierName = (id: string) => s.ctx.ref.suppliers.get(id)?.name ?? id;
  return {
    key,
    current: toVersion(current, s.ctx),
    versions: versions.map((v) => toVersion(v, s.ctx)),
    records: current.contributing
      .map((c) => byId.get(c.recordId))
      .filter((r): r is CanonicalRecord => r !== undefined)
      .map((r) => toRecord(r, correctedIds.has(r.id))),
    diff,
    approvals: s.ws.approvals.filter((a) => a.findingKey === key).map((a) => toApproval(a, s.ws)),
    explanation: await polish(explainChange(previous, current, diff, supplierName)),
  };
}

// ---------------------------------------------------------------------------------------------
// Projection to DTOs

function refusal(command: AuditDto['command'], subject: string, status: AuditDto['status'], detail: string): AuditDto {
  return { seq: 0, command, subject, status, detail, changedFindings: [] };
}

const toAudit = (e: AuditEntry): AuditDto => ({ ...e, changedFindings: [...e.changedFindings] });

const toApproval = (a: ApprovalRecord, ws: Workspace): ApprovalDto => ({ ...a, status: approvalStatus(a, ws.history) });

function headline(v: FindingVersion, ctx: WorkspaceContext): string {
  const { facts, value } = v.finding;
  if (value.status !== 'ok') return `${value.status}: ${value.reason}`;
  if (facts.kind === 'spend_total') return `${formatEUR(facts.totalEURCents)} net spend · ${facts.rows} rows`;
  const rec = value.value as { supplierId: string; avgUnitPriceEURCents: number; singleSource: boolean };
  const name = ctx.ref.suppliers.get(rec.supplierId)?.name ?? rec.supplierId;
  return `${name} at ${formatEUR(rec.avgUnitPriceEURCents)}/pc${rec.singleSource ? ' (single source)' : ''}`;
}

function toVersion(v: FindingVersion, ctx: WorkspaceContext): VersionDto {
  const value = v.finding.value;
  return {
    versionId: v.versionId,
    supersedes: v.supersedes,
    producedAt: v.producedAt,
    status: value.status,
    reason: value.status === 'ok' ? null : value.reason,
    headline: headline(v, ctx),
    detail: value.status === 'ok' ? null : value.detail,
    facts: v.finding.facts,
    evidence: value.status === 'abstain' || value.status === 'conflict' ? value.evidence : [],
    contributingCount: v.contributing.length,
  };
}

const toRecord = (r: CanonicalRecord, corrected: boolean): RecordDto => ({
  id: r.id,
  contentId: r.contentId,
  supplierId: r.supplierId,
  brand: r.brand,
  productCode: r.productCode,
  description: r.description,
  date: r.date,
  qty: r.qty,
  unitPriceEURCents: r.unitPriceEURCents,
  valueEURCents: r.valueEURCents,
  currency: r.currency,
  kind: r.kind,
  invoiceRef: r.invoiceRef,
  source: r.source,
  origins: { ...r.origins } as Record<string, string>,
  corrected,
});

function toState(s: Session): StateDto {
  const { ws } = s;
  const lineage: LineageDto[] = s.lineage.map((l) => {
    const last = [...ws.audit].reverse().find((a) => a.command === 'ingest' && a.subject === l.id);
    const applied = ws.ledger.log.some((e) => e.lineageId === l.id && e.status === 'applied');
    return {
      id: l.id,
      market: l.market,
      mode: l.mode,
      scopeSupplierId: l.scopeSupplierId,
      previous: l.previous,
      incoming: l.incoming,
      status: applied ? 'applied' : last ? 'refused' : 'pending',
      lastDetail: last?.detail ?? null,
    };
  });

  const findings: FindingSummaryDto[] = [...ws.history.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, versions]) => {
      const v = versions.at(-1)!;
      const { facts, value } = v.finding;
      return {
        key,
        kind: facts.kind,
        market: facts.market,
        productCode: facts.kind === 'price_decision' ? facts.productCode : null,
        status: value.status,
        reason: value.status === 'ok' ? null : value.reason,
        headline: headline(v, s.ctx),
        versionId: v.versionId,
        versionCount: versions.length,
        changedAt: v.producedAt,
        approvals: ws.approvals.filter((a) => a.findingKey === key).map((a) => toApproval(a, ws)),
      };
    });

  return {
    mode: 'in-memory-demo',
    stateHash: ws.ledger.stateHash,
    recordCount: ws.effective.length,
    lineage,
    findings,
    audit: ws.audit.map(toAudit),
    staleCorrections: [...ws.staleCorrections],
  };
}

/** Test hook: start from a clean session. Not exposed over HTTP. */
export const __resetForTests = () => {
  g.__wolfEvidence = undefined;
};

