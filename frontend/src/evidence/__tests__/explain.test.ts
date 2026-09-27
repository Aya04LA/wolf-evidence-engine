import type { LineageEntry } from '../domain/types';
import type { FixtureRecord } from '../ingest/load-event';
import type { Command, Workspace } from '../store/workspace';

import { it, vi, expect, describe, afterEach } from 'vitest';

import { ref, versions } from './helpers';
import { explainChange } from '../explain/narrate';
import { diffVersions } from '../provenance/graph';
import { dispatch, replayCommands } from '../store/workspace';
import { readFixtureJson, referencePrices } from '../ingest/fixtures';
import { polish, numbersIn, usesOnlyTemplateNumbers } from '../explain/polish';
import { fixtureEvent, baselineLineage, loadLineageEvent } from '../ingest/load-event';

// ---------------------------------------------------------------------------------------------

const R = ref();
const ctx = { ref: R, referencePrices: referencePrices(R) };
const lineages = readFixtureJson<LineageEntry[]>('update-lineage.json')!;
const v = versions() as unknown as Record<string, Record<'v1', FixtureRecord[]>>;
const name = (id: string) => R.suppliers.get(id)?.name ?? id;

const unwrap = <T>(o: { status: string; value?: T; detail?: string }): T => {
  if (o.status !== 'ok') throw new Error(`${o.status}: ${o.detail}`);
  return o.value as T;
};
const base = () =>
  replayCommands(
    ['FR', 'HU', 'XK', 'IT'].map(
      (m): Command => ({ type: 'ingest', event: unwrap(fixtureEvent(baselineLineage(m), v[m].v1, `${m}.v1`)) })
    ),
    ctx
  );
const deliver = (ws: Workspace, market: string) =>
  dispatch(
    ws,
    { type: 'ingest', event: unwrap(loadLineageEvent(lineages.find((l) => l.market === market)!, R, ws.ledger.records)) },
    ctx
  );
const explain = (ws: Workspace, key: string) => {
  const vs = ws.history.get(key)!;
  const [prev, cur] = [vs.at(-2), vs.at(-1)!];
  return explainChange(prev, cur, diffVersions(prev, cur), name);
};

// ---------------------------------------------------------------------------------------------

describe('template explanations are built from computed facts', () => {
  const fr = deliver(base(), 'FR');

  it('first version', () => {
    expect(explain(base(), 'FR:spend-total')).toBe('First version: €171,941.83 net spend over 24 rows.');
  });

  it('FR spend after the repaired subset', () => {
    expect(explain(fr, 'FR:spend-total')).toBe(
      'FR net spend fell to €116,546.84 from €171,941.83 (−€55,394.99) because 16 rows were replaced.'
    );
  });

  it('FR paint cup: abstention becomes a recommendation', () => {
    expect(explain(fr, 'FR:WLF-1008:price-decision')).toBe(
      'FR WLF-1008: a recommendation is now possible — 3M at €50.16 per piece (single source). Previously there was none (price_inconsistent) because 8 rows were replaced.'
    );
  });

  it('HU: the added supplier becomes the recommendation', () => {
    expect(explain(deliver(base(), 'HU'), 'HU:WLF-1001:price-decision')).toBe(
      'HU WLF-1001: a recommendation is now possible — Würth at €32.77 per piece. Previously there was none (price_inconsistent) because 8 rows were added.'
    );
  });

  it('a buyer correction names the changed record', () => {
    const r = fr.effective.find((x) => x.id === 'FR-LATEST-0002')!;
    const corrected = dispatch(
      fr,
      {
        type: 'correct',
        input: { recordId: r.id, recordContentId: r.contentId, field: 'qty', to: 164, reason: 'Delivery note DN-4471', reviewer: 'A. Buyer', at: 't' },
      },
      ctx
    );
    expect(explain(corrected, 'FR:spend-total')).toBe(
      'FR net spend fell to €116,045.24 from €116,546.84 (−€501.60) because 1 row changed (FR-LATEST-0002).'
    );
  });

  it('every number in every explanation is present in the computed facts', () => {
    for (const [key] of fr.history) {
      const text = explain(fr, key);
      const vs = fr.history.get(key)!;
      const facts = JSON.stringify(vs.map((x) => [x.finding, x.contributing.length])) + key;
      const factNumbers = new Set(numbersIn(facts));
      // A change amount is derived by code as the difference of two fact totals: allow exactly those.
      const totals = vs.flatMap((x) => (x.finding.facts.kind === 'spend_total' ? [x.finding.facts.totalEURCents] : []));
      for (const a of totals) for (const b of totals) factNumbers.add(String(Math.abs(a - b)));
      const money = (n: string) => (n.includes('.') ? n.replace('.', '') : n); // €116,546.84 ↔ 11654684 cents
      for (const n of numbersIn(text)) {
        const ok = factNumbers.has(n) || factNumbers.has(money(n)) || /^\d{1,2}$/.test(n);
        expect(ok, `${key}: "${n}" in "${text}"`).toBe(true);
      }
    }
  });
});

describe('optional model edge: may reword, may never change a number', () => {
  const TEMPLATE = 'FR net spend fell to €116,546.84 from €171,941.83 (−€55,394.99) because 16 rows were replaced.';
  const answer = (content: string, ok = true) =>
    vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: ok ? 200 : 500 }));

  afterEach(() => {
    delete process.env.WOLF_MODEL_BASE_URL;
    delete process.env.WOLF_MODEL_NAME;
  });
  const configure = () => {
    process.env.WOLF_MODEL_BASE_URL = 'http://127.0.0.1:9/v1';
    process.env.WOLF_MODEL_NAME = 'test-model';
  };

  it('without configuration the model is never called', async () => {
    const f = answer('anything');
    expect(await polish(TEMPLATE, f)).toEqual({ text: TEMPLATE, source: 'template' });
    expect(f).not.toHaveBeenCalled();
  });

  it('a faithful rewording is accepted', async () => {
    configure();
    const text = 'Replacing 16 rows lowered FR spend from €171,941.83 to €116,546.84, a drop of €55,394.99.';
    expect(await polish(TEMPLATE, answer(text))).toEqual({ text, source: 'model' });
  });

  it('a rewording that invents a number is rejected in favour of the template', async () => {
    configure();
    const out = await polish(TEMPLATE, answer('FR spend fell by about 32% to €116,546.84.'));
    expect(out).toEqual({ text: TEMPLATE, source: 'model_rejected' });
  });

  it('a rewording that alters an amount is rejected', async () => {
    configure();
    const out = await polish(TEMPLATE, answer('FR net spend fell to €116,546.00 from €171,941.83.'));
    expect(out.source).toBe('model_rejected');
  });

  it('HTTP errors, bad payloads and exceptions fall back to the template', async () => {
    configure();
    expect((await polish(TEMPLATE, answer('x', false))).source).toBe('model_unavailable');
    expect((await polish(TEMPLATE, vi.fn(async () => new Response('{}')))).source).toBe('model_unavailable');
    expect(
      (await polish(TEMPLATE, vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }))).source
    ).toBe('model_unavailable');
  });

  it('the model only ever receives the computed sentence', async () => {
    configure();
    const f = answer(TEMPLATE);
    await polish(TEMPLATE, f);
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.messages).toHaveLength(2);
    expect(JSON.parse(body.messages[1].content)).toEqual({ update: TEMPLATE });
    expect(body.tools).toBeUndefined();
  });

  it('number check normalises separators and currency', () => {
    expect(numbersIn('€116,546.84 and 16 rows.')).toEqual(['116546.84', '16']);
    expect(usesOnlyTemplateNumbers('€1,000.50 over 3 rows', 'Three rows: €1000.50')).toBe(true);
    expect(usesOnlyTemplateNumbers('€1,000.50 over 3 rows', '€1,000.50 over 4 rows')).toBe(false);
  });
});

describe('explanations do not hide a cheaper excluded supplier', () => {
  it('HU WLF-1002: Würth recommended, 3M cheaper on average but excluded for unstable prices', () => {
    expect(explain(deliver(base(), 'HU'), 'HU:WLF-1002:price-decision')).toBe(
      'HU WLF-1002: a recommendation is now possible — Würth at €73.23 per piece; 3M averages €36.23 but is excluded (unstable price). Previously there was none (price_inconsistent) because 8 rows were added.'
    );
  });
});
