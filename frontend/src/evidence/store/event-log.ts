import type { Outcome, ContentId, SourceEvent, CanonicalRecord } from '../domain/types';

import { merge } from '../merge';
import { contentId } from '../domain/hash';

/**
 * Append-only event log and its projection. The canonical state is always
 * `events.reduce(apply, EMPTY)`, never mutated in place.
 *
 * Idempotency is by construction, not by a "seen" flag that can drift. An event's id is the
 * hash of its content, so re-applying the same event hits `applied` and is recorded as
 * `duplicate_event` with no state change. A re-delivery with different content has a
 * different id and goes through merge and scope guards like any new event.
 */

export interface ChangeSet {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: number;
}

export type LogStatus = 'applied' | 'duplicate_event' | Exclude<Outcome<unknown>['status'], 'ok'>;

export interface LogEntry {
  seq: number;
  eventId: ContentId;
  lineageId: string;
  mode: SourceEvent['mode'];
  status: LogStatus;
  detail: string;
  changes: ChangeSet | null;
  /** Projection hash after this entry. Equal hashes ⇒ identical canonical state. */
  stateHash: ContentId;
}

export interface LedgerState {
  readonly records: readonly CanonicalRecord[];
  readonly applied: ReadonlySet<ContentId>;
  readonly log: readonly LogEntry[];
  readonly stateHash: ContentId;
}

/** Hash over the sorted record content ids: order-independent fingerprint of the state. */
export const projectionHash = (records: readonly CanonicalRecord[]): ContentId =>
  contentId(records.map((r) => r.contentId).sort());

export const EMPTY: LedgerState = {
  records: [],
  applied: new Set(),
  log: [],
  stateHash: projectionHash([]),
};

export function diffRecords(
  before: readonly CanonicalRecord[],
  after: readonly CanonicalRecord[]
): ChangeSet {
  const prev = new Map(before.map((r) => [r.id, r.contentId]));
  const next = new Map(after.map((r) => [r.id, r.contentId]));
  const added = [...next.keys()].filter((id) => !prev.has(id)).sort();
  const removed = [...prev.keys()].filter((id) => !next.has(id)).sort();
  const changed = [...next.keys()].filter((id) => prev.has(id) && prev.get(id) !== next.get(id)).sort();
  const unchanged = [...next.keys()].filter((id) => prev.get(id) === next.get(id)).length;
  return { added, removed, changed, unchanged };
}

/** Pure: returns a new state; never mutates `state`. */
export function apply(state: LedgerState, event: SourceEvent): LedgerState {
  const base = { seq: state.log.length + 1, eventId: event.id, lineageId: event.lineageId, mode: event.mode };

  if (state.applied.has(event.id)) {
    const entry: LogEntry = {
      ...base,
      status: 'duplicate_event',
      detail: `identical content already applied; no change`,
      changes: null,
      stateHash: state.stateHash,
    };
    return { ...state, log: [...state.log, entry] };
  }

  const failedCheck = event.checks.find((c) => !c.passed);
  const result: Outcome<CanonicalRecord[]> = failedCheck
    ? {
        status: 'conflict',
        reason: 'reconciliation_failed',
        detail: `${failedCheck.name}: ${failedCheck.detail}`,
        evidence: failedCheck.evidence,
      }
    : merge(state.records, event);

  if (result.status !== 'ok') {
    // A refused event changes nothing. It is logged, but not marked applied, so a corrected
    // re-delivery can still be processed.
    const entry: LogEntry = {
      ...base,
      status: result.status,
      detail: `${result.reason}: ${result.detail}`,
      changes: null,
      stateHash: state.stateHash,
    };
    return { ...state, log: [...state.log, entry] };
  }

  const records = result.value;
  const stateHash = projectionHash(records);
  const entry: LogEntry = {
    ...base,
    status: 'applied',
    detail: `${event.mode} ${event.market}${event.scopeSupplierId ? `/${event.scopeSupplierId}` : ''}`,
    changes: diffRecords(state.records, records),
    stateHash,
  };
  return {
    records,
    applied: new Set([...state.applied, event.id]),
    log: [...state.log, entry],
    stateHash,
  };
}

export const replay = (events: readonly SourceEvent[], from: LedgerState = EMPTY): LedgerState =>
  events.reduce(apply, from);
