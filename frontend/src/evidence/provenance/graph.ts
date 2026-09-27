import type { ComputedFinding } from '../findings/compute';
import type { ContentId, Contribution, FindingPolicy, FindingVersion } from '../domain/types';

import { contentId } from '../domain/hash';

/**
 * The dependency graph: finding → version history → contributing records (id + content id).
 * History is append-only. A finding gets a new version only when its content changes, so an
 * unaffected finding keeps its version id and its approvals stay current.
 */
export type FindingHistory = ReadonlyMap<string, readonly FindingVersion[]>;

export const EMPTY_HISTORY: FindingHistory = new Map();

export function versionIdOf(c: ComputedFinding, policy: FindingPolicy): ContentId {
  return contentId({
    findingKey: c.findingKey,
    policy,
    finding: c.finding,
    contributing: contributionsOf(c).map((x) => x.contentId),
  });
}

const contributionsOf = (c: ComputedFinding): Contribution[] =>
  c.contributing
    .map((r) => ({ recordId: r.id, contentId: r.contentId }))
    .sort((a, b) => (a.recordId < b.recordId ? -1 : 1));

export const currentVersion = (h: FindingHistory, key: string): FindingVersion | undefined => h.get(key)?.at(-1);

/**
 * Folds a fresh computation into the history. Findings that no longer exist (all their records
 * were removed) get a retirement version that abstains, so an approval on them turns stale
 * instead of silently pointing at nothing.
 */
export function advance(
  history: FindingHistory,
  computed: readonly ComputedFinding[],
  policy: FindingPolicy,
  producedAt: number
): { history: FindingHistory; changedKeys: string[] } {
  const next = new Map(history);
  const changedKeys: string[] = [];
  const seen = new Set<string>();

  for (const c of computed) {
    seen.add(c.findingKey);
    const versionId = versionIdOf(c, policy);
    const prior = currentVersion(history, c.findingKey);
    if (prior?.versionId === versionId) continue;
    next.set(c.findingKey, [
      ...(history.get(c.findingKey) ?? []),
      {
        versionId,
        findingKey: c.findingKey,
        finding: c.finding,
        contributing: contributionsOf(c),
        supersedes: prior?.versionId ?? null,
        producedAt,
      },
    ]);
    changedKeys.push(c.findingKey);
  }

  for (const [key, versions] of history) {
    const prior = versions.at(-1)!;
    if (seen.has(key) || prior.contributing.length === 0) continue;
    const finding = {
      ...prior.finding,
      value: {
        status: 'abstain' as const,
        reason: 'missing_source' as const,
        detail: `no records support ${key} any more`,
        evidence: [],
      },
    } as FindingVersion['finding'];
    next.set(key, [
      ...versions,
      {
        versionId: contentId({ findingKey: key, policy, retired: prior.versionId }),
        findingKey: key,
        finding,
        contributing: [],
        supersedes: prior.versionId,
        producedAt,
      },
    ]);
    changedKeys.push(key);
  }

  return { history: next, changedKeys: changedKeys.sort() };
}

/** Reverse edges: record id → finding keys it currently feeds. */
export function recordIndex(history: FindingHistory): Map<string, string[]> {
  const idx = new Map<string, string[]>();
  for (const [key, versions] of history) {
    for (const c of versions.at(-1)!.contributing) {
      idx.set(c.recordId, [...(idx.get(c.recordId) ?? []), key]);
    }
  }
  return idx;
}

export interface VersionDiff {
  findingKey: string;
  from: ContentId | null;
  to: ContentId;
  addedRecords: string[];
  removedRecords: string[];
  changedRecords: string[];
  unchangedRecords: number;
}

/** What changed between two versions of one finding, at record level. */
export function diffVersions(from: FindingVersion | undefined, to: FindingVersion): VersionDiff {
  const before = new Map((from?.contributing ?? []).map((c) => [c.recordId, c.contentId]));
  const after = new Map(to.contributing.map((c) => [c.recordId, c.contentId]));
  return {
    findingKey: to.findingKey,
    from: from?.versionId ?? null,
    to: to.versionId,
    addedRecords: [...after.keys()].filter((id) => !before.has(id)).sort(),
    removedRecords: [...before.keys()].filter((id) => !after.has(id)).sort(),
    changedRecords: [...after.keys()].filter((id) => before.has(id) && before.get(id) !== after.get(id)).sort(),
    unchangedRecords: [...after.keys()].filter((id) => before.get(id) === after.get(id)).length,
  };
}
