import type { StateDto, ReplayDto, CommandResultDto, FindingDetailDto } from '../api/dto';

import { it, expect, describe, beforeEach } from 'vitest';

import { __resetForTests } from '../api/service';
import { GET as getState } from '../../app/api/evidence/state/route';
import { POST as postReset } from '../../app/api/evidence/reset/route';
import { POST as postEvent } from '../../app/api/evidence/events/route';
import { POST as postReplay } from '../../app/api/evidence/replay/route';
import { POST as postApproval } from '../../app/api/evidence/approvals/route';
import { GET as getFinding } from '../../app/api/evidence/findings/[key]/route';
import { POST as postCorrection } from '../../app/api/evidence/corrections/route';

const HOST = 'localhost:8084';

function post(body: unknown, headers: Record<string, string> = {}): Request {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request(`http://${HOST}/api/evidence/x`, {
    method: 'POST',
    headers: { host: HOST, origin: `http://${HOST}`, 'content-type': 'application/json', ...headers },
    body: text,
  });
}
const get = () => new Request(`http://${HOST}/api/evidence/x`, { headers: { host: HOST } });
const finding = (key: string) => getFinding(get(), { params: Promise.resolve({ key: encodeURIComponent(key) }) });
const state = async () => (await (await getState(get(), undefined)).json()) as StateDto;
const byKey = (s: StateDto, key: string) => s.findings.find((f) => f.key === key)!;

beforeEach(() => __resetForTests());

describe('happy path over HTTP (the demo)', () => {
  it('baseline: four lineage events pending, findings computed', async () => {
    const s = await state();
    expect(s.mode).toBe('in-memory-demo');
    expect(s.lineage.map((l) => [l.id, l.status])).toEqual([
      ['UPD-XK-002', 'pending'],
      ['UPD-IT-002', 'pending'],
      ['UPD-HU-002', 'pending'],
      ['UPD-FR-002', 'pending'],
    ]);
    expect(byKey(s, 'FR:spend-total').headline).toBe('€171,941.83 net spend · 24 rows');
  });

  it('approve → FR arrives → stale → old version refused → new approved → replay identical', async () => {
    const s0 = await state();
    const v1 = byKey(s0, 'FR:spend-total').versionId;

    const a = await postApproval(post({ findingKey: 'FR:spend-total', versionId: v1, reviewer: 'A. Buyer' }), undefined);
    expect(a.status).toBe(200);

    const e = await postEvent(post({ lineageId: 'UPD-FR-002' }), undefined);
    const ev = (await e.json()) as CommandResultDto;
    expect(e.status).toBe(200);
    expect(ev.result.changedFindings).toEqual(['FR:WLF-1008:price-decision', 'FR:WLF-1018:price-decision', 'FR:spend-total']);
    const spend = byKey(ev.state, 'FR:spend-total');
    expect(spend.approvals[0].status).toBe('stale');
    expect(spend.headline).toBe('€116,546.84 net spend · 24 rows');
    expect(byKey(ev.state, 'FR:WLF-1008:price-decision').headline).toBe('3M at €50.16/pc (single source)');

    const stale = await postApproval(post({ findingKey: 'FR:spend-total', versionId: v1, reviewer: 'A. Buyer' }), undefined);
    expect(stale.status).toBe(422);
    expect(((await stale.json()) as CommandResultDto).result.detail).toMatch(/^stale_version/);

    const ok = await postApproval(post({ findingKey: 'FR:spend-total', versionId: spend.versionId, reviewer: 'B. Reviewer' }), undefined);
    expect(ok.status).toBe(200);

    const dup = await postEvent(post({ lineageId: 'UPD-FR-002' }), undefined);
    expect(((await dup.json()) as CommandResultDto).result.status).toBe('duplicate');

    const r = (await (await postReplay(post({}), undefined)).json()) as ReplayDto;
    expect(r.identical).toBe(true);
    expect(r.findingVersionsIdentical).toBe(true);
  });

  it('finding detail: contributing rows carry source refs; diff against superseded version', async () => {
    await postEvent(post({ lineageId: 'UPD-FR-002' }), undefined);
    const res = await finding('FR:spend-total');
    expect(res.status).toBe(200);
    const d = (await res.json()) as FindingDetailDto;
    expect(d.versions).toHaveLength(2);
    expect(d.records).toHaveLength(24);
    expect(d.records.find((r) => r.id === 'FR-LATEST-0001')!.source).toMatchObject({ file: 'input-sheets/FR-v2--Sheet1.csv', row: 2 });
    expect(d.diff).toMatchObject({ unchangedRecords: 8 });
    expect(d.diff.addedRecords).toHaveLength(16);
  });

  it('correction over HTTP creates a new version; buyer and time are recorded server-side', async () => {
    await postEvent(post({ lineageId: 'UPD-FR-002' }), undefined);
    const d = (await (await finding('FR:spend-total')).json()) as FindingDetailDto;
    const r = d.records.find((x) => x.id === 'FR-LATEST-0002')!;
    const res = await postCorrection(
      post({ recordId: r.id, recordContentId: r.contentId, field: 'qty', to: 164, reason: 'Delivery note DN-4471', reviewer: 'A. Buyer' }),
      undefined
    );
    const out = (await res.json()) as CommandResultDto;
    expect(res.status).toBe(200);
    expect(byKey(out.state, 'FR:spend-total').versionCount).toBe(3);
    const after = (await (await finding('FR:spend-total')).json()) as FindingDetailDto;
    expect(after.records.find((x) => x.id === 'FR-LATEST-0002')).toMatchObject({ qty: 164, corrected: true });
  });
});

describe('refusals are visible, never fabricated', () => {
  it('FR delivered as add_supplier → 422 wrong_scope, lineage shown as refused', async () => {
    const res = await postEvent(post({ lineageId: 'UPD-FR-002', asMode: 'add_supplier' }), undefined);
    const out = (await res.json()) as CommandResultDto;
    expect(res.status).toBe(422);
    expect(out.result.detail).toMatch(/^wrong_scope/);
    expect(out.state.lineage.find((l) => l.id === 'UPD-FR-002')!.status).toBe('refused');
    expect(byKey(out.state, 'FR:spend-total').headline).toBe('€171,941.83 net spend · 24 rows');
  });

  it('unknown lineage → 422', async () => {
    const res = await postEvent(post({ lineageId: 'UPD-ZZ-999' }), undefined);
    expect(res.status).toBe(422);
  });

  it('approving an abstaining finding → 422 not_approvable', async () => {
    const s = await state();
    const f = byKey(s, 'FR:WLF-1008:price-decision');
    const res = await postApproval(post({ findingKey: f.key, versionId: f.versionId, reviewer: 'A. Buyer' }), undefined);
    expect(res.status).toBe(422);
  });

  it('unknown finding → 404; malformed key → 400', async () => {
    expect((await finding('FR:nothing')).status).toBe(404);
    expect((await finding('../../etc/passwd')).status).toBe(400);
  });
});

describe('input hardening', () => {
  const valid = { lineageId: 'UPD-FR-002' };

  it('cross-origin POST → 403', async () => {
    expect((await postEvent(post(valid, { origin: 'https://evil.example' }), undefined)).status).toBe(403);
  });

  it('wrong content type → 415', async () => {
    expect((await postEvent(post(valid, { 'content-type': 'text/plain' }), undefined)).status).toBe(415);
  });

  it('oversized body → 413', async () => {
    expect((await postEvent(post({ lineageId: 'x'.repeat(20_000) }), undefined)).status).toBe(413);
  });

  it('invalid JSON → 400', async () => {
    expect((await postEvent(post('{nope'), undefined)).status).toBe(400);
  });

  it('unknown keys, bad hashes and out-of-range values → 400 with issues', async () => {
    const extra = await postEvent(post({ ...valid, admin: true }), undefined);
    expect(extra.status).toBe(400);
    const badHash = await postApproval(post({ findingKey: 'FR:spend-total', versionId: 'abc', reviewer: 'A. Buyer' }), undefined);
    expect(badHash.status).toBe(400);
    expect(((await badHash.json()) as { issues: string[] }).issues[0]).toMatch(/versionId/);
    const floatQty = await postCorrection(
      post({ recordId: 'FR-PREVIOUS-0001', recordContentId: 'a'.repeat(64), field: 'qty', to: 1.5, reason: 'typo fix', reviewer: 'A. Buyer' }),
      undefined
    );
    expect(floatQty.status).toBe(400);
  });

  it('client cannot set the approval time or forge an approval id', async () => {
    const s = await state();
    const f = byKey(s, 'FR:spend-total');
    const res = await postApproval(post({ findingKey: f.key, versionId: f.versionId, reviewer: 'A. Buyer', at: '1999-01-01' }), undefined);
    expect(res.status).toBe(400);
  });

  it('reset is unavailable in production unless explicitly enabled', async () => {
    const env = process.env as Record<string, string | undefined>;
    const prev = env.NODE_ENV;
    env.NODE_ENV = 'production';
    try {
      expect((await postReset(post({}), undefined)).status).toBe(404);
    } finally {
      env.NODE_ENV = prev;
    }
  });

  it('missing dataset → 503 without leaking paths', async () => {
    const prev = process.env.WOLF_KIT_DIR;
    process.env.WOLF_KIT_DIR = '/nonexistent-kit';
    try {
      const res = await getState(get(), undefined);
      expect(res.status).toBe(503);
      expect(await res.text()).not.toMatch(/nonexistent|\\|\//);
    } finally {
      if (prev === undefined) delete process.env.WOLF_KIT_DIR;
      else process.env.WOLF_KIT_DIR = prev;
    }
  });
});

describe('finding key decoding', () => {
  it('a malformed percent-encoding is a 400, not a 500', async () => {
    const res = await getFinding(new Request('http://localhost:8084/x', { headers: { host: 'localhost:8084' } }), {
      params: Promise.resolve({ key: '%E0%A4%A' }),
    });
    expect(res.status).toBe(400);
  });
});
