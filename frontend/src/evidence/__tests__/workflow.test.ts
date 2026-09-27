import type { FixtureRecord } from '../ingest/load-event';
import type { Command, Workspace } from '../store/workspace';
import type { LineageEntry, FindingVersion } from '../domain/types';

import { it, expect, describe } from 'vitest';

import { ref, versions } from './helpers';
import { computeFindings } from '../findings/compute';
import { applyCorrections } from '../approval/corrections';
import { isStale, approvalStatus } from '../approval/approve';
import { dispatch, replayCommands } from '../store/workspace';
import { readFixtureJson, referencePrices } from '../ingest/fixtures';
import { recordIndex, diffVersions, currentVersion } from '../provenance/graph';
import { fixtureEvent, baselineLineage, loadLineageEvent } from '../ingest/load-event';

// ---------------------------------------------------------------------------------------------
// Plumbing

const R = ref();
const ctx = { ref: R, referencePrices: referencePrices(R) };
const lineages = readFixtureJson<LineageEntry[]>('update-lineage.json')!;
const lineage = (m: string) => lineages.find((l) => l.market === m)!;
const v = versions() as unknown as Record<string, Record<'v1', FixtureRecord[]>>;
const MARKETS = ['FR', 'HU', 'XK', 'IT'];
const AT = '2026-09-27T10:00:00Z';

const unwrap = <T>(o: { status: string; value?: T; detail?: string }): T => {
  if (o.status !== 'ok') throw new Error(`${o.status}: ${o.detail}`);
  return o.value as T;
};

const baseline = (): Command[] =>
  MARKETS.map((m) => ({ type: 'ingest', event: unwrap(fixtureEvent(baselineLineage(m), v[m].v1, `${m}.v1`)) }));

const update = (ws: Workspace, m: string): Command => ({
  type: 'ingest',
  event: unwrap(loadLineageEvent(lineage(m), R, ws.ledger.records)),
});

const run = (cmds: Command[], from?: Workspace) => replayCommands(cmds, ctx, from);
const cur = (ws: Workspace, key: string) => currentVersion(ws.history, key)!;
const approveCmd = (ws: Workspace, key: string, reviewer = 'A. Buyer'): Command => ({
  type: 'approve',
  input: { findingKey: key, versionId: cur(ws, key).versionId, reviewer, at: AT },
});
const rec = (value: FindingVersion['finding']['value']) => (value.status === 'ok' ? value.value : null);

// ---------------------------------------------------------------------------------------------

describe('findings on v1', () => {
  const ws = run(baseline());

  it('FR spend total is approvable: €171,941.83', () => {
    expect(rec(cur(ws, 'FR:spend-total').finding.value)).toEqual({ totalEURCents: 17_194_183 });
  });

  it('FR paint cup: abstains, 3M prices swing 10.49–79.08 in the invalid v1 subset', () => {
    const f = cur(ws, 'FR:WLF-1008:price-decision');
    expect(f.finding.value).toMatchObject({ status: 'abstain', reason: 'price_inconsistent' });
    if (f.finding.value.status === 'abstain') expect(f.finding.value.evidence.length).toBeGreaterThan(0);
  });

  it('FR mixing cup: stable single source recommended (Mirka €20.98)', () => {
    expect(rec(cur(ws, 'FR:WLF-1001:price-decision').finding.value)).toEqual({
      supplierId: 'sup-novex',
      avgUnitPriceEURCents: 2098,
      singleSource: true,
    });
  });

  it('is deterministic: recomputing gives the same version ids', () => {
    const again = run(baseline());
    for (const [key] of ws.history) expect(cur(again, key).versionId).toBe(cur(ws, key).versionId);
  });
});

describe('the demo: approve, late file, stale, review, correct, approve, replay', () => {
  const s0 = run(baseline());
  const s1 = dispatch(s0, approveCmd(s0, 'FR:spend-total'), ctx);
  const s1b = dispatch(s1, approveCmd(s1, 'FR:WLF-1001:price-decision'), ctx);
  const frUpdate = update(s1b, 'FR');
  const s2 = dispatch(s1b, frUpdate, ctx);
  const [spendApproval, mixingCupApproval] = s2.approvals;

  it('step 1: the v1 spend approval is recorded and current', () => {
    expect(s1.approvals).toHaveLength(1);
    expect(approvalStatus(s1.approvals[0], s1.history)).toBe('current');
  });

  it('step 2: FR update touches exactly the three FR findings fed by sup-aster rows', () => {
    expect(s2.audit.at(-1)!.changedFindings).toEqual([
      'FR:WLF-1008:price-decision',
      'FR:WLF-1018:price-decision',
      'FR:spend-total',
    ]);
  });

  it('step 2: the spend approval is now stale; the untouched mixing-cup approval is still current', () => {
    expect(approvalStatus(spendApproval, s2.history)).toBe('stale');
    expect(approvalStatus(mixingCupApproval, s2.history)).toBe('current');
    expect(isStale(spendApproval, cur(s2, 'FR:spend-total'))).toBe(true);
  });

  it('step 2: the new spend version supersedes the approved one, €116,546.84', () => {
    const now = cur(s2, 'FR:spend-total');
    expect(now.supersedes).toBe(spendApproval.versionId);
    expect(rec(now.finding.value)).toEqual({ totalEURCents: 11_654_684 });
    expect(s2.history.get('FR:spend-total')).toHaveLength(2);
  });

  it('step 2: the paint-cup decision flips from abstain to "3M at €50.16"', () => {
    const now = cur(s2, 'FR:WLF-1008:price-decision');
    expect(rec(now.finding.value)).toEqual({ supplierId: 'sup-aster', avgUnitPriceEURCents: 5016, singleSource: true });
  });

  it('step 3: evidence — contributing rows and the record-level diff to the superseded version', () => {
    const [old, now] = s2.history.get('FR:spend-total')!;
    const d = diffVersions(old, now);
    expect(d.removedRecords).toHaveLength(16);
    expect(d.addedRecords).toHaveLength(16);
    expect(d.unchangedRecords).toBe(8);
    const idx = recordIndex(s2.history);
    expect(idx.get('FR-LATEST-0001')).toEqual(['FR:WLF-1008:price-decision', 'FR:spend-total']);
    const row = s2.effective.find((r) => r.id === 'FR-LATEST-0001')!;
    expect(row.source).toMatchObject({ file: 'input-sheets/FR-v2--Sheet1.csv', row: 2 });
  });

  it('step 3: approving the superseded version is refused (stale_version)', () => {
    const s = dispatch(
      s2,
      { type: 'approve', input: { findingKey: 'FR:spend-total', versionId: spendApproval.versionId, reviewer: 'A. Buyer', at: AT } },
      ctx
    );
    expect(s.audit.at(-1)).toMatchObject({ status: 'rejected' });
    expect(s.audit.at(-1)!.detail).toMatch(/^stale_version/);
    expect(s.approvals).toHaveLength(2);
  });

  const target = s2.effective.find((r) => r.id === 'FR-LATEST-0002')!;
  const correction: Command = {
    type: 'correct',
    input: {
      recordId: target.id,
      recordContentId: target.contentId,
      field: 'qty',
      to: 164,
      reason: 'Delivery note DN-4471 confirms 164 pieces received, not 174',
      reviewer: 'A. Buyer',
      at: AT,
    },
  };
  const s3 = dispatch(s2, correction, ctx);

  it('step 4: a correction creates new versions of the findings that record feeds', () => {
    expect(s3.audit.at(-1)).toMatchObject({ status: 'ok' });
    expect(s3.audit.at(-1)!.changedFindings).toEqual(['FR:WLF-1008:price-decision', 'FR:spend-total']);
    expect(rec(cur(s3, 'FR:spend-total').finding.value)).toEqual({ totalEURCents: 11_654_684 - 10 * 5016 });
    const corrected = s3.effective.find((r) => r.id === 'FR-LATEST-0002')!;
    expect(corrected.origins.qty).toBe('buyer_correction');
    expect(s3.ledger.records.find((r) => r.id === 'FR-LATEST-0002')!.qty).toBe(174);
  });

  const s4 = dispatch(s3, approveCmd(s3, 'FR:spend-total', 'B. Reviewer'), ctx);

  it('step 4: approving the corrected version succeeds and pins it', () => {
    expect(s4.audit.at(-1)).toMatchObject({ status: 'ok' });
    expect(approvalStatus(s4.approvals.at(-1)!, s4.history)).toBe('current');
  });

  it('step 5: replaying the FR event and the correction changes nothing', () => {
    const s5 = dispatch(dispatch(s4, frUpdate, ctx), correction, ctx);
    expect(s5.audit.slice(-2).map((e) => e.status)).toEqual(['duplicate', 'duplicate']);
    expect(s5.ledger.stateHash).toBe(s4.ledger.stateHash);
    expect(cur(s5, 'FR:spend-total').versionId).toBe(cur(s4, 'FR:spend-total').versionId);
  });

  it('step 5: the full command log replays to the identical workspace', () => {
    const cmds: Command[] = [
      ...baseline(),
      approveCmd(s0, 'FR:spend-total'),
      approveCmd(s1, 'FR:WLF-1001:price-decision'),
      frUpdate,
      correction,
      approveCmd(s3, 'FR:spend-total', 'B. Reviewer'),
    ];
    const a = run(cmds);
    const b = run([...cmds, ...cmds]);
    expect(b.ledger.stateHash).toBe(a.ledger.stateHash);
    expect([...b.history.keys()].map((k) => cur(b, k).versionId)).toEqual([...a.history.keys()].map((k) => cur(a, k).versionId));
    expect(b.approvals).toEqual(a.approvals);
  });
});

describe('HU: the new supplier wins where its price is stable and cheaper', () => {
  const s0 = run(baseline());
  const s1 = dispatch(s0, update(s0, 'HU'), ctx);

  it('v1: only 3M, unstable prices → abstain on every HU product', () => {
    for (const p of ['WLF-1001', 'WLF-1002', 'WLF-1003']) {
      expect(cur(s0, `HU:${p}:price-decision`).finding.value.status).toBe('abstain');
    }
  });

  it('after UPD-HU-002: Würth recommended; 3M listed as unstable, not silently dropped', () => {
    const f = cur(s1, 'HU:WLF-1001:price-decision');
    expect(rec(f.finding.value)).toEqual({ supplierId: 'sup-orbit', avgUnitPriceEURCents: 3277, singleSource: false });
    if (f.finding.facts.kind !== 'price_decision') throw new Error('kind');
    expect(f.finding.facts.candidates.map((c) => [c.supplierId, c.status])).toEqual([
      ['sup-aster', 'unstable_price'],
      ['sup-orbit', 'eligible'],
    ]);
  });
});

describe('the approval boundary refuses what it cannot defend', () => {
  const s0 = run(baseline());

  it('no approval of an abstaining finding', () => {
    const s = dispatch(s0, approveCmd(s0, 'FR:WLF-1008:price-decision'), ctx);
    expect(s.audit.at(-1)!.detail).toMatch(/^not_approvable/);
  });

  it('no approval without a reviewer', () => {
    const s = dispatch(s0, approveCmd(s0, 'FR:spend-total', '  '), ctx);
    expect(s.audit.at(-1)).toMatchObject({ status: 'rejected' });
    expect(s.approvals).toHaveLength(0);
  });

  it('no approval of an unknown finding', () => {
    const s = dispatch(s0, { type: 'approve', input: { findingKey: 'FR:nope', versionId: 'x', reviewer: 'A. Buyer', at: AT } }, ctx);
    expect(s.audit.at(-1)).toMatchObject({ status: 'rejected' });
  });
});

describe('corrections are pinned to the record version the buyer saw', () => {
  const s0 = run(baseline());
  const old = s0.effective.find((r) => r.id === 'FR-PREVIOUS-0002')!;
  const fix: Command = {
    type: 'correct',
    input: {
      recordId: old.id,
      recordContentId: old.contentId,
      field: 'unitPriceEURCents',
      to: 5016,
      reason: 'Contract price per agreement AG-12',
      reviewer: 'A. Buyer',
      at: AT,
    },
  };

  it('a correction on a record later replaced by the source becomes stale, not silently applied', () => {
    const s1 = dispatch(s0, fix, ctx);
    expect(s1.audit.at(-1)).toMatchObject({ status: 'ok' });
    const s2 = dispatch(s1, update(s1, 'FR'), ctx);
    expect(s2.staleCorrections).toHaveLength(1);
    expect(s2.staleCorrections[0].detail).toMatch(/no longer exists/);
  });

  it('a correction against an outdated view of the record is refused', () => {
    const s = dispatch(s0, { ...fix, input: { ...fix.input, recordContentId: 'deadbeef' } } as Command, ctx);
    expect(s.audit.at(-1)!.detail).toMatch(/^stale_version/);
  });

  it('invalid values are refused: flipping a credit note positive, unknown supplier, no reason', () => {
    const s = run(baseline());
    const target = s.effective.find((r) => r.kind === 'credit_note') ?? s.effective[0];
    const bad = [
      { field: 'qty' as const, to: target.qty > 0 ? -1 : 1 },
      { field: 'supplierId' as const, to: 'sup-ghost' },
      { field: 'unitPriceEURCents' as const, to: -5 },
    ];
    for (const b of bad) {
      const out = dispatch(
        s,
        { type: 'correct', input: { recordId: target.id, recordContentId: target.contentId, ...b, reason: 'test reason', reviewer: 'A. Buyer', at: AT } },
        ctx
      );
      expect(out.audit.at(-1)).toMatchObject({ status: 'rejected' });
    }
    const noReason = dispatch(
      s,
      { type: 'correct', input: { recordId: target.id, recordContentId: target.contentId, field: 'qty', to: target.qty, reason: '', reviewer: 'A. Buyer', at: AT } },
      ctx
    );
    expect(noReason.audit.at(-1)!.detail).toMatch(/reason/);
  });

  it('applyCorrections is pure', () => {
    const s = run(baseline());
    const before = JSON.stringify(s.ledger.records);
    applyCorrections(s.ledger.records, [], R);
    expect(JSON.stringify(s.ledger.records)).toBe(before);
    expect(computeFindings(s.effective, ctx.referencePrices)).toEqual(computeFindings(s.effective, ctx.referencePrices));
  });
});
