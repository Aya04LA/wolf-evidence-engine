import type { FindingHistory } from '../provenance/graph';
import type { Outcome, ContentId, ApprovalRecord, FindingVersion } from '../domain/types';

import { contentId } from '../domain/hash';
import { currentVersion } from '../provenance/graph';

export interface ApprovalInput {
  findingKey: string;
  versionId: string;
  reviewer: string;
  note?: string;
  at: string;
}

const REVIEWER = /^[\p{L}\p{N} .'@_-]{2,80}$/u;

/** Pure staleness check: an approval is stale when it pins a version that is no longer current. */
export const isStale = (a: ApprovalRecord, current: FindingVersion | undefined): boolean =>
  !current || a.findingKey !== current.findingKey || a.versionId !== current.versionId;

export type ApprovalStatus = 'current' | 'stale';

export const approvalStatus = (a: ApprovalRecord, h: FindingHistory): ApprovalStatus =>
  isStale(a, currentVersion(h, a.findingKey)) ? 'stale' : 'current';

/**
 * The human boundary. An approval pins one exact version and is refused when that version is
 * not current, when the finding abstains or conflicts (nothing to approve), or when no
 * identifiable reviewer is given.
 */
export function approve(input: ApprovalInput, history: FindingHistory): Outcome<ApprovalRecord> {
  const reviewer = input.reviewer.trim();
  if (!REVIEWER.test(reviewer)) {
    return { status: 'rejected', reason: 'malformed_input', detail: 'a reviewer name (2–80 characters) is required' };
  }
  const current = currentVersion(history, input.findingKey);
  if (!current) {
    return { status: 'rejected', reason: 'unknown_lineage', detail: `no finding ${input.findingKey}` };
  }
  if (current.versionId !== input.versionId) {
    return {
      status: 'rejected',
      reason: 'stale_version',
      detail: `version ${input.versionId.slice(0, 12)} is not current for ${input.findingKey}; current is ${current.versionId.slice(0, 12)}. Review the new evidence first.`,
    };
  }
  if (current.finding.value.status !== 'ok') {
    return {
      status: 'rejected',
      reason: 'not_approvable',
      detail: `${input.findingKey} is ${current.finding.value.status}: resolve it (correct a record) before approving`,
    };
  }
  const note = (input.note ?? '').trim().slice(0, 500);
  const body = { findingKey: input.findingKey, versionId: current.versionId, reviewer, note, at: input.at };
  return { status: 'ok', value: { id: contentId(body) as ContentId, ...body } };
}
