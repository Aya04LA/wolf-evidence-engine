import type { LedgerState } from './event-log';
import type { ReferenceData } from '../ingest/fixtures';
import type { ApprovalInput } from '../approval/approve';
import type { FindingHistory } from '../provenance/graph';
import type { CorrectionInput } from '../approval/corrections';
import type { Correction, SourceEvent, FindingPolicy, ApprovalRecord, CanonicalRecord } from '../domain/types';

import { approve } from '../approval/approve';
import { assertNever } from '../domain/types';
import { EMPTY, apply as applyEvent } from './event-log';
import { advance, EMPTY_HISTORY } from '../provenance/graph';
import { DEFAULT_POLICY, computeFindings } from '../findings/compute';
import { applyCorrections, prepareCorrection } from '../approval/corrections';

/**
 * The whole evidence state as one pure fold over commands:
 *   ingest (source event) · correct (buyer edit) · approve (buyer decision).
 * Replaying the same command list always produces the same workspace. Duplicate commands are
 * absorbed (events by content id, corrections and approvals by their content ids).
 */
export type Command =
  | { type: 'ingest'; event: SourceEvent }
  | { type: 'correct'; input: CorrectionInput }
  | { type: 'approve'; input: ApprovalInput };

export interface AuditEntry {
  seq: number;
  command: Command['type'];
  subject: string;
  status: 'ok' | 'duplicate' | 'abstain' | 'conflict' | 'rejected';
  detail: string;
  /** Findings that received a new version because of this command. */
  changedFindings: string[];
}

export interface Workspace {
  readonly ledger: LedgerState;
  readonly corrections: readonly Correction[];
  readonly approvals: readonly ApprovalRecord[];
  /** Source records with corrections applied: what findings are computed from. */
  readonly effective: readonly CanonicalRecord[];
  readonly staleCorrections: readonly { correctionId: string; detail: string }[];
  readonly history: FindingHistory;
  readonly audit: readonly AuditEntry[];
}

export interface WorkspaceContext {
  ref: ReferenceData;
  referencePrices: ReadonlyMap<string, number>;
  policy?: FindingPolicy;
}

export const EMPTY_WORKSPACE: Workspace = {
  ledger: EMPTY,
  corrections: [],
  approvals: [],
  effective: [],
  staleCorrections: [],
  history: EMPTY_HISTORY,
  audit: [],
};

export function dispatch(ws: Workspace, cmd: Command, ctx: WorkspaceContext): Workspace {
  const seq = ws.audit.length + 1;
  const log = (entry: Omit<AuditEntry, 'seq' | 'command'>): AuditEntry[] => [
    ...ws.audit,
    { seq, command: cmd.type, ...entry },
  ];

  switch (cmd.type) {
    case 'ingest': {
      const ledger = applyEvent(ws.ledger, cmd.event);
      const entry = ledger.log.at(-1)!;
      if (entry.status !== 'applied') {
        return {
          ...ws,
          ledger,
          audit: log({
            subject: cmd.event.lineageId,
            status: entry.status === 'duplicate_event' ? 'duplicate' : entry.status,
            detail: entry.detail,
            changedFindings: [],
          }),
        };
      }
      return recompute({ ...ws, ledger }, ctx, seq, {
        command: 'ingest',
        subject: cmd.event.lineageId,
        status: 'ok',
        detail: entry.detail,
      });
    }

    case 'correct': {
      const prepared = prepareCorrection(cmd.input, ws.effective, ctx.ref);
      if (prepared.status !== 'ok') {
        // A replayed correction is already applied, so its record no longer has the reviewed content.
        const dup = ws.corrections.some(
          (c) => c.recordId === cmd.input.recordId && c.recordContentId === cmd.input.recordContentId &&
            c.field === cmd.input.field && c.to === cmd.input.to && c.at === cmd.input.at
        );
        return {
          ...ws,
          audit: log({
            subject: cmd.input.recordId,
            status: dup ? 'duplicate' : prepared.status,
            detail: dup ? 'identical correction already applied; no change' : `${prepared.reason}: ${prepared.detail}`,
            changedFindings: [],
          }),
        };
      }
      return recompute({ ...ws, corrections: [...ws.corrections, prepared.value] }, ctx, seq, {
        command: 'correct',
        subject: cmd.input.recordId,
        status: 'ok',
        detail: `${prepared.value.field} → ${prepared.value.to} (${prepared.value.reason})`,
      });
    }

    case 'approve': {
      const out = approve(cmd.input, ws.history);
      if (out.status !== 'ok') {
        return {
          ...ws,
          audit: log({ subject: cmd.input.findingKey, status: out.status, detail: `${out.reason}: ${out.detail}`, changedFindings: [] }),
        };
      }
      if (ws.approvals.some((a) => a.id === out.value.id)) {
        return {
          ...ws,
          audit: log({ subject: cmd.input.findingKey, status: 'duplicate', detail: 'identical approval already recorded', changedFindings: [] }),
        };
      }
      return {
        ...ws,
        approvals: [...ws.approvals, out.value],
        audit: log({
          subject: cmd.input.findingKey,
          status: 'ok',
          detail: `approved version ${out.value.versionId.slice(0, 12)} by ${out.value.reviewer}`,
          changedFindings: [],
        }),
      };
    }
    default:
      return assertNever(cmd);
  }
}

function recompute(
  ws: Workspace,
  ctx: WorkspaceContext,
  seq: number,
  entry: Pick<AuditEntry, 'command' | 'subject' | 'status' | 'detail'>
): Workspace {
  const policy = ctx.policy ?? DEFAULT_POLICY;
  const { records: effective, stale } = applyCorrections(ws.ledger.records, ws.corrections, ctx.ref);
  const computed = computeFindings(effective, ctx.referencePrices, policy);
  const { history, changedKeys } = advance(ws.history, computed, policy, seq);
  return {
    ...ws,
    effective,
    staleCorrections: stale,
    history,
    audit: [...ws.audit, { seq, ...entry, changedFindings: changedKeys }],
  };
}

export const replayCommands = (cmds: readonly Command[], ctx: WorkspaceContext, from: Workspace = EMPTY_WORKSPACE) =>
  cmds.reduce((ws, cmd) => dispatch(ws, cmd, ctx), from);
