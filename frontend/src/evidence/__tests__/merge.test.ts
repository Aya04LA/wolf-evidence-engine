import type { FixtureRecord } from '../ingest/load-event';
import type { SourceEvent, LineageEntry } from '../domain/types';

import { it, expect, describe } from 'vitest';

import { merge } from '../merge';
import { sumCents } from '../domain/money';
import { ref, cents, versions } from './helpers';
import { apply, replay } from '../store/event-log';
import { readFixtureJson } from '../ingest/fixtures';
import { loadFrEvent, fixtureEvent, baselineLineage } from '../ingest/load-event';

// ---------------------------------------------------------------------------------------------
// Fixture plumbing

const lineages = readFixtureJson<LineageEntry[]>('update-lineage.json')!;
const lineage = (market: string) => lineages.find((l) => l.market === market)!;

const unwrap = <T>(o: { status: string; value?: T; detail?: string }): T => {
  if (o.status !== 'ok') throw new Error(`${o.status}: ${o.detail}`);
  return o.value as T;
};

const MARKETS = ['FR', 'HU', 'XK', 'IT'] as const;
const v = versions() as unknown as Record<string, Record<'v1' | 'v2' | 'current', FixtureRecord[]>>;

const baselineEvents = (): SourceEvent[] =>
  MARKETS.map((m) => unwrap(fixtureEvent(baselineLineage(m), v[m].v1, `${m}.v1`)));

const frEvent = (overrides = {}) => unwrap(loadFrEvent(lineage('FR'), ref(), overrides));

const marketTotal = (records: readonly { iso: string; valueEURCents: number }[], iso: string) =>
  sumCents(records.filter((r) => r.iso === iso).map((r) => r.valueEURCents));

const expectedTotal = (m: string) => sumCents(v[m].current.map((r) => cents(r.valueEUR)));

// ---------------------------------------------------------------------------------------------

describe('baseline', () => {
  it('loads the v1 state of all four markets (96 rows)', () => {
    const s = replay(baselineEvents());
    expect(s.records).toHaveLength(96);
    expect(s.log.every((e) => e.status === 'applied')).toBe(true);
    expect(marketTotal(s.records, 'FR')).toBe(17_194_183);
  });
});

describe('FR — replace_supplier_subset (flagship)', () => {
  const s = apply(replay(baselineEvents()), frEvent());
  const fr = s.records.filter((r) => r.iso === 'FR');

  it('produces 24 rows / €116,546.84, matching expected-current', () => {
    expect(s.log.at(-1)!.status).toBe('applied');
    expect(fr).toHaveLength(24);
    expect(marketTotal(s.records, 'FR')).toBe(11_654_684);
    expect(marketTotal(s.records, 'FR')).toBe(expectedTotal('FR'));
    expect(fr.map((r) => r.id).sort()).toEqual(v.FR.current.map((r) => r.id).sort());
  });

  it('leaves the unrelated supplier byte-identical and other markets untouched', () => {
    const before = replay(baselineEvents());
    const novex = (recs: typeof fr) => recs.filter((r) => r.supplierId === 'sup-novex');
    expect(novex(fr).map((r) => r.contentId)).toEqual(
      novex(before.records.filter((r) => r.iso === 'FR')).map((r) => r.contentId)
    );
    for (const m of ['HU', 'XK', 'IT']) {
      expect(marketTotal(s.records, m)).toBe(marketTotal(before.records, m));
    }
  });

  it('reports exactly what changed: 16 out, 16 in, 80 untouched', () => {
    const c = s.log.at(-1)!.changes!;
    expect(c.removed).toHaveLength(16);
    expect(c.removed.every((id) => id.startsWith('FR-PREVIOUS-'))).toBe(true);
    expect(c.added).toHaveLength(16);
    expect(c.added.every((id) => id.startsWith('FR-LATEST-'))).toBe(true);
    expect(c.changed).toEqual([]);
    expect(c.unchanged).toBe(80);
  });
});

describe('wrong replacement scope is refused, never guessed', () => {
  const base = replay(baselineEvents());

  it('FR delivered as add_supplier: rejected (would be 40 rows / €262,851.11)', () => {
    const s = apply(base, frEvent({ mode: 'add_supplier' }));
    expect(s.log.at(-1)).toMatchObject({ status: 'rejected' });
    expect(s.log.at(-1)!.detail).toMatch(/^wrong_scope/);
    expect(s.stateHash).toBe(base.stateHash);
  });

  it('FR delivered as replace_market: rejected (would delete sup-novex, 16 rows / €90,909.28)', () => {
    const s = apply(base, frEvent({ mode: 'replace_market' }));
    expect(s.log.at(-1)!.detail).toMatch(/wrong_scope.*sup-novex/);
    expect(s.stateHash).toBe(base.stateHash);
  });

  it('FR scoped to the wrong supplier: rejected', () => {
    const s = apply(base, frEvent({ scopeSupplierId: 'sup-novex' }));
    expect(s.log.at(-1)!.detail).toMatch(/^wrong_scope/);
  });

  it('subset replacement for a supplier absent from the market: rejected', () => {
    const r = merge(
      base.records.filter((x) => !(x.iso === 'FR' && x.supplierId === 'sup-aster')),
      frEvent()
    );
    expect(r).toMatchObject({ status: 'rejected', reason: 'wrong_scope' });
  });

  it('records from another market inside the event: rejected', () => {
    const ev = frEvent();
    const r = merge(base.records, { ...ev, records: [{ ...ev.records[0], iso: 'HU' }, ...ev.records.slice(1)] });
    expect(r).toMatchObject({ status: 'rejected', reason: 'market_mismatch' });
  });
});

describe('replay safety', () => {
  it('re-applying FR is a no-op: same hash, same totals, logged as duplicate', () => {
    const once = apply(replay(baselineEvents()), frEvent());
    const twice = apply(once, frEvent());
    expect(twice.stateHash).toBe(once.stateHash);
    expect(twice.records).toBe(once.records);
    expect(marketTotal(twice.records, 'FR')).toBe(11_654_684);
    expect(twice.log.at(-1)).toMatchObject({ status: 'duplicate_event', changes: null });
  });

  it('the whole log replays to the identical state, event ids are deterministic', () => {
    const events = [...baselineEvents(), frEvent(), frEvent()];
    const a = replay(events);
    const b = replay([...baselineEvents(), frEvent(), frEvent()]);
    expect(b.stateHash).toBe(a.stateHash);
    expect(events[4].id).toBe(frEvent().id);
  });

  it('a duplicated baseline is also absorbed', () => {
    const s = replay([...baselineEvents(), ...baselineEvents()]);
    expect(s.records).toHaveLength(96);
    expect(s.log.filter((e) => e.status === 'duplicate_event')).toHaveLength(4);
  });

  it('a refused event leaves no trace in state, and a corrected one still applies after', () => {
    const base = replay(baselineEvents());
    const s = apply(apply(base, frEvent({ mode: 'add_supplier' })), frEvent());
    expect(s.log.map((e) => e.status).slice(-2)).toEqual(['rejected', 'applied']);
    expect(marketTotal(s.records, 'FR')).toBe(11_654_684);
  });
});

describe('merge semantics for the other modes (fixture v2 as incoming; raw parsers in phase 3)', () => {
  const incoming = (m: string) => unwrap(fixtureEvent(lineage(m), v[m].v2, `${m}.v2`));

  it.each([
    ['HU', 48, 38_911_461],
    ['XK', 24, 16_136_398],
    ['IT', 24, 20_498_376],
  ])('%s → %i rows / %i cents, matching expected-current', (m, rows, total) => {
    const s = apply(replay(baselineEvents()), incoming(m));
    expect(s.log.at(-1)!.status).toBe('applied');
    expect(s.records.filter((r) => r.iso === m)).toHaveLength(rows);
    expect(marketTotal(s.records, m)).toBe(total);
    expect(marketTotal(s.records, m)).toBe(expectedTotal(m));
  });

  it('HU applied twice does not double count', () => {
    const once = apply(replay(baselineEvents()), incoming('HU'));
    const twice = apply(once, incoming('HU'));
    expect(marketTotal(twice.records, 'HU')).toBe(38_911_461);
    expect(twice.log.at(-1)!.status).toBe('duplicate_event');
  });

  it('HU re-delivered with changed content is refused as an addition (would double count)', () => {
    const once = apply(replay(baselineEvents()), incoming('HU'));
    const changed = v.HU.v2.map((r, i) => (i === 0 ? { ...r, qty: r.qty + 1 } : r));
    const s = apply(once, unwrap(fixtureEvent(lineage('HU'), changed, 'HU.v2b')));
    expect(s.log.at(-1)!.detail).toMatch(/^wrong_scope/);
    expect(marketTotal(s.records, 'HU')).toBe(38_911_461);
  });
});
