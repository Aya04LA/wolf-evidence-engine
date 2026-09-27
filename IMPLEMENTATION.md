# Implementation plan — Track 1: Procurement Evidence Engine

Goal: a late source file changes a purchasing decision. The system identifies the affected
records, recomputes the finding, marks approvals that relied on the old version as stale, lets a
buyer inspect evidence, record a correction and approve the new version, and proves that replaying
the event does not double count.

Status legend: **[core]** must be correct and tested · **[func]** functional, less polished · **[mock]** explicitly simulated.

---

## 0. Ground truth (from `kit/dataset/ingestion-versions.json`)

These numbers are the acceptance tests. The engine is only "correct" when it reproduces them by
parsing the raw v2 sheets. Copying `current` from the fixture does not count.

| Case | Mode | Scope | v1 | Incoming (raw sheet) | Expected current |
| --- | --- | --- | --- | --- | --- |
| FR **[core]** | `replace_supplier_subset` | `sup-aster` | 24 rows · €171,941.83 | 16 rows · €90,909.28 | 24 rows · €116,546.84 |
| HU [func] | `add_supplier` | `sup-orbit` | 24 · €196,890.50 | 24 · €192,224.11 (HUF prices) | 48 · €389,114.61 |
| XK [func] | `replace_market` | — | 24 · €178,923.32 | 24 · €161,363.98 (grouped, gross/VAT/net) | 24 · €161,363.98 |
| IT [func] | `replace_market` | — | 24 · €164,986.75 | 24 · €204,983.76 (two sheets) | 24 · €204,983.76 |

Wrong-scope failures to prove against. The FR event treated as `add_supplier` gives 40 rows /
€262,851.11. Treated as `replace_market`, it gives 16 rows / €90,909.28. Both must be rejected.

---

## 1. Module layout

The engine lives in `frontend/src/evidence/`. It is framework-free TypeScript: it has no React,
Next or MUI imports, so it can be unit tested and later moved into its own package or service.

```
frontend/src/evidence/
  domain/
    types.ts              SourceEvent, CanonicalRecord, MergeMode, Finding, FindingVersion,
                          ApprovalRecord, Correction, Outcome<T> (ok | abstain | conflict | rejected)
    hash.ts               canonicalJson() + sha256 → content ids (deterministic, key-sorted)
    money.ts              integer-cent arithmetic, FX normalisation (fx-rates.json), rounding rule
  ingest/                 LAYER 1 — reads raw files, knows nothing about approvals/UI
    csv.ts                RFC-4180 reader returning row-major matrices (NO header→object keying)
    parse-fr.ts           34 cols, duplicate headers by POSITION, credit notes, repeated invoice total
    parse-hu.ts           HUF unit price → EUR via fx, supplier code → sup-orbit
    parse-xk.ts           header row 4, product group rows, Excel serial dates, uses NET column
    parse-it.ts           2 header rows, 2 sheets, duplicate "Order type", Net position column
    load-event.ts         lineage entry + parsed rows → SourceEvent (content-hashed)
  merge/                  LAYER 2 — pure (previous, incoming, scope) → Outcome<CanonicalRecord[]>
    replace-market.ts
    add-supplier.ts
    replace-supplier-subset.ts
    index.ts              dispatch by mode + scope guards (the "wrong replacement scope" defence)
  provenance/             LAYER 3 — explicit dependency graph
    graph.ts              findingKey → FindingVersion → contributing record ids + source line refs
    diff.ts               FindingDiff(old, new): added / removed / changed contributing rows
  findings/
    compute.ts            deterministic findings from canonical records
  approval/               LAYER 4
    staleness.ts          isStale(approval, currentVersion) — pure comparison
    approve.ts            guards: reviewer present, version current, no open abstention
  store/
    event-log.ts          append-only in-memory event log + projection (replay = fold)   [mock persistence]
    repository.ts         interface so Supabase/Postgres can replace it without touching layers 1-4
  explain/
    narrate.ts            DeepSeek edge: FindingDiff in → text out, number-checked   (see §7)
  __tests__/              vitest, fixture-driven (see §8)

frontend/src/evidence/api/                LAYER 5a — adapter (server-only except dto.ts)
  dto.ts                  wire types (types only; the one engine module the UI may import)
  schemas.ts              strict zod request schemas (unknown keys rejected, bounded strings)
  http.ts                 same-origin check, JSON content type, 16 KB cap, error shaping
  route-guard.ts          503 when the dataset is missing, opaque 500 otherwise
  service.ts              in-memory workspace + command log, DTO projection   [mock persistence]

frontend/src/app/api/evidence/            LAYER 5b — thin route handlers (all trailing-slash URLs)
  state/                  GET  findings, lineage queue, approvals, audit trail
  events/                 POST {lineageId, asMode?}: a late file arrives (asMode = wrong-scope test)
  findings/[key]/         GET  versions, contributing rows with source refs, diff
  approvals/              POST {findingKey, versionId, reviewer, note?}
  corrections/            POST {recordId, recordContentId, field, to, reason, reviewer}
  replay/                 POST {}: rebuild from the command log once and twice, compare hashes
  reset/                  POST {}: back to baseline (dev only unless WOLF_DEMO_RESET=1)

The server sets timestamps, never the client. Refused commands return 409/422 with the audit
entry, so the UI can show the reason.

frontend/src/data/evidence.ts             typed client adapter — the only UI entry point
frontend/src/sections/evidenz/            LAYER 6 — UI (see §6)
```

Rule: dependencies point downward only (UI → adapter → API → approval/provenance → merge → ingest → domain).
An ESLint `import/no-restricted-paths` zone enforces it: `src/evidence/**` may not import
`src/sections`, `src/app`, `react` or `next`.

---

## 2. Types first (`domain/types.ts`)

```ts
export type MergeMode = 'replace_market' | 'add_supplier' | 'replace_supplier_subset';

export type Iso = string & { readonly __brand: 'Iso' };
export type ContentId = string & { readonly __brand: 'ContentId' }; // sha256 hex

/** Pointer back to the exact source cell range. Every record carries one. */
export interface SourceRef {
  file: string;            // e.g. 'input-sheets/FR-v2--Sheet1.csv'
  sheet?: string;          // IT: 'MA CARR' | 'MA VERN'
  row: number;             // 1-based physical row in the source file
  columns: number[];       // column positions read (positional, not header names)
}

export interface CanonicalRecord {
  id: string;                        // stable business id (FR-LATEST-0001)
  contentId: ContentId;              // hash of the normalized fields below
  iso: Iso;
  supplierId: string;
  productCode: string;
  date: string;                      // ISO date
  qty: number;                       // signed: credits are negative
  unit: 'piece';                     // anything else → abstain, never coerce
  unitPriceEURCents: number;
  valueEURCents: number;             // line net, never the repeated invoice header total
  currency: string;
  valueLocalCents: number;
  kind: 'invoice' | 'credit_note';
  invoiceRef?: string;
  source: SourceRef;
  eventId: ContentId;                // which SourceEvent introduced this record
}

export interface SourceEvent {
  id: ContentId;                     // sha256(lineageId + mode + scope + sorted record contentIds)
  lineageId: string;                 // UPD-FR-002
  market: Iso;
  mode: MergeMode;
  scopeSupplierId: string | null;
  previousVersion: string;           // FR-v1
  incomingVersion: string;           // FR-v2
  effectiveDate: string;
  records: CanonicalRecord[];
  checks: IngestCheck[];             // e.g. invoice header total == Σ line net, per invoice
}

export interface Correction {        // a buyer correction is itself an event, so replay includes it
  id: ContentId; recordId: string; field: 'unitPriceEURCents' | 'qty' | 'supplierId';
  from: unknown; to: unknown; reason: string; reviewer: string; at: string;
}

export type Outcome<T> =
  | { status: 'ok'; value: T }
  | { status: 'abstain'; reason: AbstainReason; detail: string; evidence: SourceRef[] }
  | { status: 'conflict'; reason: ConflictReason; detail: string; evidence: SourceRef[] }
  | { status: 'rejected'; reason: RejectReason; detail: string };

export type AbstainReason  = 'insufficient_rows' | 'unit_unverified' | 'missing_source' | 'unknown_currency';
export type ConflictReason = 'reconciliation_failed' | 'currency_mismatch' | 'duplicate_record_id';
export type RejectReason   = 'wrong_scope' | 'market_mismatch' | 'unknown_lineage' | 'malformed_input';

export interface FindingVersion {
  versionId: ContentId;              // sha256(findingKey + value + sorted contributing contentIds)
  findingKey: string;                // 'FR:WLF-1008:preferred-supplier'
  value: Outcome<FindingValue>;      // abstention is a legitimate finding value
  contributing: string[];            // record ids → the dependency graph edge set
  producedBy: ContentId[];           // event ids folded to produce it
  supersedes: ContentId | null;
}

export interface ApprovalRecord {
  id: ContentId; findingKey: string; versionId: ContentId;
  reviewer: string; decidedAt: string; decision: 'approved' | 'rejected'; note?: string;
}
```

---

## 3. Merge functions (one per mode, pure)

Signature: `(previous: CanonicalRecord[], event: SourceEvent) => Outcome<CanonicalRecord[]>`.

```ts
/** XK (UPD-XK-002) and IT (UPD-IT-002): the incoming delivery supersedes the whole market.
 *  Guard: every incoming record has iso === event.market, otherwise rejected('market_mismatch').
 *  Result: previous rows of other markets + incoming rows. */
export function replaceMarket(previous, event) {}

/** HU (UPD-HU-002): appends one supplier and never deletes existing suppliers.
 *  Guard: all incoming rows belong to scopeSupplierId. If that supplier already has rows
 *  in the market, return rejected('wrong_scope'), because an "add" that overlaps is really a replace. */
export function addSupplier(previous, event) {}

/** FR (UPD-FR-002): the hardest case. Replace ONLY scopeSupplierId's rows in that market and
 *  keep unrelated suppliers byte-identical (FR-UNCHANGED-*).
 *  Guards: every incoming row has supplierId === scope, else rejected('wrong_scope');
 *  scope must be non-null; per-invoice Σ line net must equal the repeated header total,
 *  else conflict('reconciliation_failed'). Credit notes stay as signed lines and are never dropped. */
export function replaceSupplierSubset(previous, event) {}
```

Idempotency comes from the construction itself. The projection is
`fold(events deduped by event.id, in effective order)`. Re-appending an event whose `id` already
exists changes nothing and is logged as `duplicate_event` so the UI can show it. Because every id
is a content hash, a *changed* re-delivery gets a new id. It is then treated as a new event, never
silently merged.

---

## 4. Dependency graph (`provenance/graph.ts`)

```ts
interface DependencyGraph {
  findings: Map<string, FindingVersion[]>;         // findingKey → version history (append-only)
  recordToFindings: Map<string, Set<string>>;      // reverse edge: recordId → findingKeys
  records: Map<string, CanonicalRecord>;           // each record carries its SourceRef
}
affectedFindings(graph, changedRecordIds): string[]     // "what does this event touch?"
```

Findings computed in `findings/compute.ts` (deterministic, integer cents):
1. `{iso}:spend-total`: net spend per market, credits netted.
2. `{iso}:{product}:price-decision`: the lowest volume-weighted unit price among *eligible*
   suppliers. A supplier is eligible with ≥ 3 invoice lines and a price spread of ≤ 25%. If no
   supplier is eligible, the finding abstains (`price_inconsistent` or `insufficient_rows`). An
   exact tie is a `price_tie` conflict for a buyer to resolve. Credit lines are excluded from the
   price average but included in spend. The policy (3 lines, 25%) is hashed into every version
   id, so changing a threshold produces new versions and makes earlier approvals stale.

This gives the demo its "decision changes" moment. In every v1 delivery a supplier's price for
one product swings wildly (FR 3M paint cup: €10.49–€79.08), so v1 price decisions abstain. The
repaired v2 prices are consistent: FR WLF-1008 becomes "3M at €50.16". For HU, Würth becomes the
recommended supplier for WLF-1001 (€32.77); 3M stays listed as `unstable_price`.

Approvals (`approval/approve.ts`) pin a version id. Corrections (`approval/corrections.ts`) pin
the record content id the buyer reviewed. A correction whose record a later source delivery
changed or removed is reported as stale instead of being applied. `store/workspace.ts` folds
the three commands (`ingest`, `correct`, `approve`) into one workspace, so the full command log
replays to an identical state.

---

## 5. Staleness (`approval/staleness.ts`)

```ts
export const isStale = (a: ApprovalRecord, current: FindingVersion): boolean =>
  a.findingKey === current.findingKey && a.versionId !== current.versionId;
```

`approve()` returns `rejected` when the version is not current (the "stale approval rejected"
criterion), when the reviewer is empty, or when the finding value is an abstention or conflict.

---

## 6. Frontend integration (files from `COMPONENTS.md`)

| Piece | File | Change |
| --- | --- | --- |
| Route | `frontend/src/app/dashboard/evidenz/page.tsx` | Same pattern as `tiefenanalyse/page.tsx` |
| Path + nav | `src/routes/paths.ts`, `src/layouts/nav-config-dashboard.tsx` | `Evidence` under "Tender 2026" with a `Track 1` label |
| Screen | `src/sections/evidenz/view.tsx` | Stale-approval banner, command result notice, replay proof, audit trail |
| Event queue | `src/sections/evidenz/event-queue.tsx` | Deliver or replay each lineage file; a "Mislabel" menu for the wrong-scope test |
| Findings | `src/sections/evidenz/findings-table.tsx` | Per-market tabs, version tag, approval state; rows changed by the last command are highlighted |
| Evidence drawer | `src/sections/evidenz/finding-drawer.tsx` | Explanation (with source refs) when a finding abstains, facts and candidates, diff, version history, contributing rows with origin labels |
| Decisions | `src/sections/evidenz/decision-dialogs.tsx` | Approve (pins the version) and correct (reason required; euro amounts parsed without floats) |
| Data hook | `src/hooks/use-evidence.ts` | Simulated push: polls `state/` every 5 s while the tab is visible; one funnel for command results |
| Adapter | `src/data/evidence.ts` | The only UI entry point to the API |

The screens reuse the starter's `DashboardContent`, `Label`, `Iconify`, theme tokens and card
title style. The `table` and `custom-dialog` folders named in `COMPONENTS.md` are not in the kit,
so MUI `Table` and `Dialog` are used directly. Checked in the browser at desktop and 375 px
widths, and every control is reachable by keyboard.

The ingestion fixtures stay out of the dashboard ledger, as `DATASET.md` requires.

---

## 7. Security and good practice

Implemented in Phase 7 (tests: `security.test.ts`, `api.test.ts`):

| Control | Where | What it stops |
| --- | --- | --- |
| Layer boundaries as lint errors | `eslint.config.mjs` → `evidenceLayerRules()` | Engine importing React/Next/MUI/UI, lower layers importing upward, UI importing engine code (only `import type` of `api/dto` allowed) |
| `server-only` guard | `ingest/fixtures.ts`, `api/*` | Engine or dataset code being bundled for the browser |
| Host allowlist (421) | `api/http.ts` `checkHost`, applied in `route-guard.ts` | DNS rebinding: a hostile page rebinding its domain to 127.0.0.1 would pass a plain same-origin check. Deployments extend it with `WOLF_ALLOWED_HOSTS` |
| Same-origin + JSON-only POST (403/415) | `api/http.ts` `readCommand` | CSRF from other sites: cross-site form posts cannot send `application/json` without a CORS preflight, which is not granted |
| Streamed 16 KB body cap (413) | `api/http.ts` `readLimited` | Memory exhaustion via large or chunked bodies: reading stops at the limit |
| Strict zod schemas (400) | `api/schemas.ts` | Unknown keys (incl. `__proto__`), client-supplied timestamps/ids, path-like or script-like identifiers, non-integer money |
| Fixed file allowlist | `ingest/fixtures.ts` | Path traversal: no request value ever becomes a filesystem path |
| Bounded in-memory log (429) | `api/service.ts` `MAX_AUDIT_ENTRIES` | Unbounded growth of state and replay cost |
| Opaque errors (500/503) | `api/route-guard.ts` | Leaking stack traces or file paths |
| Security headers | `next.config.ts` `headers()` | Framing (`frame-ancestors 'none'`, `X-Frame-Options`), MIME sniffing, referrer leakage, plugin content; `X-Powered-By` removed |
| Source text is data | parsers use catalogue names; the model sees only computed diffs (Phase 8) | Prompt injection embedded in supplier files: tested with an "IGNORE ALL PREVIOUS INSTRUCTIONS…" payload in FR, HU and XK sheets |
| Human boundary | `approval/*` | Approvals pin a version; corrections need a reason and pin the reviewed record; nothing is sent or purchased |
| Integer-cent money | `domain/money.ts` | Float drift; rounding happens once (half-even) and is documented |
| Dependency audit | `npm audit fix` (in-range) | Critical Next.js advisories (incl. RCE) and high axios/lodash/form-data/sharp advisories. Next 15.5.20 → 15.5.26 |

**Accepted risks (documented, not fixed):**
- The remaining `npm audit` items (postcss inside Next, yaml in build tooling) are fixed only by `next@16`, a breaking major upgrade of the starter. postcss processes only this project's own stylesheets at build time, never user input. Revisit when upgrading Next.
- The CSP does not restrict `script-src`. The template relies on inline scripts and styles, so a nonce-based CSP is delivery work.
- There is no authentication, so the reviewer name is free text. Anyone on an allowed host can approve. This is labelled in the UI and is the first piece of delivery work.
- The `/security-review` command needs a git remote (`origin/HEAD`). Until the repo is pushed, the review above was done manually over `git diff <baseline>..HEAD`. Run it again after the first push.

**Adversarial cases from the brief:**

| Case | Result | Test |
| --- | --- | --- |
| Duplicate event | `duplicate_event`, state hash unchanged | `merge.test.ts`, `workflow.test.ts`, `api.test.ts` |
| Wrong replacement scope | `rejected: wrong_scope` (add-that-overlaps, replace-that-drops, subset-of-absent) | `merge.test.ts`, browser demo step 6 |
| Currency mismatch | `conflict: currency_mismatch`; missing rate → `abstain: unknown_currency` | `fr.parse.test.ts`, `markets.test.ts` |
| Box vs piece | `abstain: unit_unverified` | `fr.parse.test.ts` |
| Unsupported product equivalence | Unknown article or group name → `abstain: unknown_product` (no fuzzy matching) | `fr.parse.test.ts`, `markets.test.ts` |
| Cancellation | Credit notes kept as signed lines, netted in spend, excluded from price | `fr.parse.test.ts`, `workflow.test.ts` |
| Missing source | `abstain: missing_source`; missing dataset → 503 | `markets.test.ts`, `api.test.ts` |
| Changed evidence after approval | Approval stale; approving the old version → `stale_version` | `workflow.test.ts`, `api.test.ts` |
| Instruction inside an invoice | Inert: identical records; in a product-name field → abstain | `security.test.ts` |
| Denied tool access | No tool execution exists; the model adapter (Phase 8) has no tool authority | n/a |

---

## 8. Tests (vitest, `npm test`)

| Test | Asserts |
| --- | --- |
| `fr.merge.test.ts` | Parse `FR-v2--Sheet1.csv` → 16 rows / €90,909.28; merge with v1 → 24 rows / €116,546.84; `FR-UNCHANGED-*` byte-identical to v1 |
| `fr.reconcile.test.ts` | Σ line net per invoice == header total (FAC-WOLF-0001 = 953.04); summing header totals per line is detected |
| `fr.scope.test.ts` | Same event as `add_supplier` or `replace_market` → `rejected('wrong_scope')` (not 40 rows / not 16 rows) |
| `hu/xk/it.merge.test.ts` | Match expected-current counts and totals in §0 |
| `replay.test.ts` | Apply FR twice → identical projection hash, totals, versions; log shows `duplicate_event` |
| `staleness.test.ts` | Approve v1 finding → ingest FR → approval stale → approving old version rejected → approving new version ok |
| `correction.test.ts` | Correction creates a new finding version; replay including the correction is stable |
| `adversarial.test.ts` | Unknown currency → abstain; unit `BOX` → abstain; missing source file → abstain; injection text inert |

---

## 9. Phases

Each phase ends in a commit, and a phase is done only when its exit check passes. Phases 1–4
are the engine and have no UI. You can stop after any phase and still have something working
and tested.

| # | Phase | Delivers | Exit check |
| --- | --- | --- | --- |
| 0 | Baseline | Git repo, `npm ci`, vitest, pristine starter committed | `npm run typecheck` + `npm run build` pass on the untouched starter |
| 1 | Domain and FR ingestion | `domain/` (types, hash, money), `ingest/csv.ts`, `parse-fr.ts` | FR sheet → 16 rows / €90,909.28; every invoice reconciles to its header total |
| 2 | Merge and replay | 3 merge functions, scope guards, event log + projection | FR → 24 / €116,546.84; wrong-scope rejected; replay twice gives the same hash |
| 3 | Other markets | `parse-hu.ts`, `parse-xk.ts`, `parse-it.ts` | HU / XK / IT match §0 |
| 4 | Findings, graph, approvals | `findings/`, `provenance/`, `approval/`, corrections | Staleness, approval and correction tests green; FR recommendation changes v1 → v2 |
| 5 | API layer | `/api/evidence/*` routes with zod, `src/data/evidence.ts` | Route tests: invalid input → 400, unknown lineage → rejected, replay endpoint stable |
| 6 | Buyer UI | Evidence screen, drawer, approve/correct dialog, simulated push feed | Full demo script (§11) runs by hand in the browser |
| 7 | Security hardening | Headers, layer lint rule, injection + adversarial tests, `/security-review` | Review findings fixed or documented |
| 8 | Model edge (optional) | `explain/narrate.ts` with the number check | Works in demo mode with no key; a fabricated number is rejected |
| 9 | Handover | README, known failures, run command, final commit | Fresh clone → `npm ci && npm test && npm run dev` works |

Phases 1–2 carry most of the scoring: correctness, replay and scope. The UI waits until the
numbers are proven.

## 10. What is mocked or out of scope (stated, not skipped)

- **Persistence**: in-memory event log, reset on server restart. The `repository.ts` interface is the seam for Postgres/Supabase.
- **Auth and tenant separation**: none. `reviewer` is a free-text field and is **not** an authenticated identity.
- **Push agent**: simulated polling over a local event queue, labelled in the UI.
- **Sources**: only the four synthetic lineage fixtures. No upload, archive, or real ERP writes.
- **Model**: optional. The engine is fully correct without it. Narration is phrasing only.
- **Tracks 2–6 and the GPU experiment**: not attempted.

### Known fixture gaps (found in Phase 1)

- **FR dates.** The raw FR sheet prints invoice dates of 5–10 Sept 2026 (Excel serial 46270–46275), but the expected records carry transaction dates of Jan–Aug 2026. The engine stores the date it can prove (the sheet's) and does not copy the fixture's. The findings group by product and supplier, not month, so totals are unaffected.
- **FR supplier.** The FR sheet has no supplier column. `supplierId` comes from the event scope and `brand` from `suppliers.json`, and each record's `origins` field says so.

### Known fixture gaps (found in Phase 3)

- **XK and IT have no supplier column.** The supplier is carried forward from the previous version of the same market: a product that had exactly one supplier keeps it (`origins.supplierId = 'derived'`). If a product had zero or several suppliers, the engine abstains with `unresolved_supplier`. A real delivery that switches supplier for a product would be misattributed by this rule. **This is the case the approach cannot resolve alone. It needs a supplier column or a human label.**
- **Dates.** HU and IT carry no date (`date: null`). XK prints Excel serials for 1–24 Jan 2026, while the expected records spread across Jan–Aug. No finding depends on dates.
- **IT unit.** There is no unit column. The unit comes from the product catalogue (`origins.unit = 'reference'`), and a non-piece catalogue unit causes an abstention.
- **HU conversion rule.** The unit price is HUF → EUR at 394 (rounded once, half-even), then multiplied by quantity. This reproduces the expected records exactly. Converting the line total instead would differ by cents.
- **Price concepts.** XK uses *Total excl. VAT*, never gross. IT uses *Net position* with the *Purchasing price*, never the *Sales price*. Both are checked per line (gross − VAT = net and VAT = net × rate; PA × quantity = net).

## 11. Demo script (the Phase 6 exit check)

1. Load v1 for all four markets and show the FR preferred-supplier finding. The buyer approves it.
2. The simulated feed delivers `UPD-FR-002`. The system lists the affected records and findings, recomputes, and shows the approval as **stale**.
3. Open the finding to see the contributing rows with sheet/row refs, the superseded version and the diff.
4. Correct one record (with a reason), which creates a new version. Approve that version.
5. Replay `UPD-FR-002`. The log shows `duplicate_event` and the totals and version ids are unchanged.
6. Deliver the FR file as `add_supplier` instead. It is rejected with `wrong_scope`, which is visible and not fabricated.
