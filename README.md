# Wolf Materials Lab — Track 1: Procurement Evidence Engine

> A late source file arrives. The system identifies exactly which records it affects, recomputes
> the finding, marks any approval that relied on the old data as **stale**, lets a buyer inspect
> the evidence, correct a record and approve the new version, and proves that replaying the
> file does not double count.

Built on the supplied starter kit (Next.js/MUI frontend and synthetic dataset), extended rather
than rebuilt. The starter's own README follows [below](#wolf-materials-lab-starter-kit).

## Run it

Requires Node.js 24 and npm. Python and model credentials are not needed.

```bash
cd frontend
npm ci
npm test
npm run dev
```

Open <http://127.0.0.1:8084/dashboard/evidenz/> (**Evidence** in the sidebar, under *Tender 2026*).

Other checks: `npm run typecheck`, `npm run lint`, and `npm run build` followed by `npm start`.

## Demo script (about 3 minutes)

1. **Baseline.** All four markets are loaded at v1. In **Findings**, open *FR · net spend* (€171,941.83) and approve it.
2. **Late file.** In **Incoming source files**, click *Deliver file* on `UPD-FR-002`. Three findings get new versions, a red banner reports that the approval is stale, and *FR · WLF-1008* goes from "abstains" to "3M at €50.16/pc". The *FR · WLF-1001* approval would stay current, because that finding was not affected.
3. **Evidence.** Click *Review evidence*. The panel shows why the finding changed, 16 rows replaced and 8 unchanged, the superseded version, and every contributing row with its sheet and row number.
4. **Correct and approve.** Click *Correct* on `FR-LATEST-0002` and set quantity 164 with a reason. That creates v3 (€116,045.24). Approve v3 as a second reviewer.
5. **Replay.** Click *Replay file* on FR. It is logged as a duplicate and nothing changes. *Prove replay* rebuilds every command once and twice, and the three state hashes match.
6. **Refusal.** Click *Mislabel* on HU and choose *replace_market*. It is rejected because it would silently delete supplier 3M in HU, and the reason is shown on the card.

*Reset demo* returns to v1 (development server only).

## What was built

| Layer | Location | Responsibility |
| --- | --- | --- |
| Domain | `frontend/src/evidence/domain/` | Types, the `Outcome` type (ok / abstain / conflict / rejected), content hashing, integer-cent money |
| Ingestion | `…/evidence/ingest/` | Positional parsers for the raw FR, HU, XK and IT sheets, with per-line reconciliation checks and field-origin labels |
| Merge | `…/evidence/merge/` | One pure function per lineage mode, with scope guards |
| Provenance | `…/evidence/provenance/` | Versioned findings, contributing-record edges, record-level diffs |
| Findings | `…/evidence/findings/` | Net spend per market; supplier price decision per product (abstains on weak evidence) |
| Approval | `…/evidence/approval/` | Version-pinned approvals, stale check, reviewed-version-pinned corrections |
| Store | `…/evidence/store/` | Append-only event log and workspace as a pure fold; replay is idempotent by construction |
| Explanation | `…/evidence/explain/` | "What changed and why" built by code; an optional model may only reword it |
| API | `frontend/src/app/api/evidence/`, `…/evidence/api/` | Thin routes, strict validation, host allowlist, streamed body cap |
| UI | `frontend/src/sections/evidenz/`, `src/data/evidence.ts` | Evidence screen in the existing dashboard |

The full design, phase log and decisions are in [IMPLEMENTATION.md](IMPLEMENTATION.md).

**Results from the raw sheets** (they match `ingestion-versions.json` → `current`):

| Market | Mode | Result |
| --- | --- | --- |
| FR | `replace_supplier_subset` (sup-aster) | 24 rows · €116,546.84 |
| HU | `add_supplier` (sup-orbit) | 48 rows · €389,114.61 |
| XK | `replace_market` | 24 rows · €161,363.98 |
| IT | `replace_market` (two sheets) | 24 rows · €204,983.76 |

Delivering FR with the wrong label is rejected, never merged: labelled `add_supplier` it would have
given 40 rows / €262,851.11, and labelled `replace_market` it would have given 16 rows / €90,909.28.

**Evidence of correctness:** 121 deterministic tests (`npm test`) on the real fixtures. They cover
the parsers, merges, wrong-scope refusals, replay, staleness, corrections, the HTTP API, security
and explanations. Key guards were mutation-tested (disable the guard and check that a test fails).

## Assumptions

- **Decision rule.** The recommended supplier is the cheapest one with ≥ 3 invoice lines and ≤ 25% price spread. Credit notes count toward spend but not price. The thresholds are hashed into every version id, so changing them makes earlier approvals stale.
- **Money.** Amounts are integer cents. HUF → EUR at `fx-rates.json` (394), converted per unit and rounded once (half-even); this reproduces the expected records exactly.
- **Price concepts.** FR uses line net, never the repeated invoice header total. XK uses total excl. VAT. IT uses net position with the purchasing price, never the sales price. Each is checked arithmetically per line.
- **v1** exists only as fixture records (there are no raw v1 sheets), so those fields are labelled `baseline_fixture`.

## Known gaps and failure cases

- **XK and IT have no supplier column.** The supplier is carried from the previous version when a product had exactly one supplier, labelled `derived`; otherwise the engine abstains. *A real delivery that switches a product's supplier would be misattributed.* This needs a supplier column or a human label.
- **Dates.** The raw FR and XK sheets print dates that differ from the fixture's transaction dates, and HU and IT carry none. The engine keeps the source date or `null`, never invents one. No finding depends on dates.
- **Explanations** only catch invented numbers written as digits. This matters only if a model is configured.
- See [IMPLEMENTATION.md §10](IMPLEMENTATION.md) for the full list, and §7 for the adversarial-case matrix.

## What is mocked or out of scope

| Area | State |
| --- | --- |
| Persistence | In-memory, per server process; resets on restart and is capped at 1,000 audit entries. `store/` is the seam for a database |
| Authentication, roles, tenants | None. The reviewer is a free-text name, labelled in the UI |
| Push agent | Simulated: a local event queue, polled every 5 s, and files are delivered by button |
| Model | Not required and not configured. Optional OpenAI-compatible rewording through the starter's `WOLF_MODEL_*` variables |
| External actions | None. Approvals are local records; nothing is sent, ordered or written to another system |
| Other tracks and the GPU experiment | Not attempted |

## Security

A host allowlist (defends against DNS rebinding), same-origin JSON-only writes, a streamed 16 KB
body cap, strict schemas, a file allowlist, a bounded log, opaque errors, security headers and
lint-enforced layer boundaries. Dependencies were patched with `npm audit fix`. The remaining
advisories need `next@16` and are documented as accepted risks. Details are in
[IMPLEMENTATION.md §7](IMPLEMENTATION.md).

---

# Wolf Materials Lab (starter kit)

A runnable frontend and synthetic dataset for day two of the Casablanca hackathon. The scenario is a fictional luxury automotive manufacturer and its service network. No client source workbook, transcript, credential, logo or deployment connection is part of this kit.

Start with [the challenge](CHALLENGE.md). Use [the component map](COMPONENTS.md) to choose a screen to extend. [The dataset guide](DATASET.md) describes the fixtures and validation commands.

The participant hub brings the demo, downloads and guides together. Locally it opens at `http://127.0.0.1:8084/`. The same bundle is prepared for hosting at [Wolf Materials Lab](https://wolf-materials-lab.vercel.app). The [twenty-minute briefing](BRIEFING.md) explains the problem and review format.

## Run

Use the full starter archive, Node.js 24, npm and Python 3. From this directory, rebuild the local download bundles first, then start the frontend:

```bash
python3 kit/scripts/package.py
cd frontend
npm ci
npm run dev
```

The packaging command creates the ZIP and document links used by the local hub. Download bundles are excluded from the starter archive to avoid recursively embedding the archive in itself. It uses only the Python standard library.

Open `http://127.0.0.1:8084/dashboard/`. No sign-in or API key is required. Use Node.js 24 and npm. Dependency versions are recorded in `frontend/package-lock.json`.

```bash
npm run typecheck
npm run build
npm start
```

The theme, navigation and procurement screens come from the existing template. Company branding and branded imagery have been removed. Plain supplier-name badges replace corporate logos. The component examples page is an addition for workshop builders.

## Dataset scope

Commercial records are independently generated, not real records with a small percentage adjustment. Real supplier names and reference part descriptions/specifications are retained. The reference catalogue contains 106 parts; 21 drive the compact transaction exercise. Prices, volumes, savings, agreements, ratings and supplier relationships are synthetic and are not claims about those suppliers.

The later-delivery scenario includes four distinct operations: replace a market export, update another market, add a supplier and repair a previously unusable subset. These are part of the exercise's versioning contract. Never sum every version together.

Any generated invoice, manual, workflow event or approval fixture is designed for the exercise. It is not evidence that a source-system integration or archive access exists. Public country names and coordinates, together with generic material taxonomy, support the original map and controls. The fictional network attributes do not represent a real company's operations.

## What works and what is simulated

| Area | State |
| --- | --- |
| Navigation, tables, charts, filters, drawers, scenario inputs and presentation views | Existing frontend components operating on synthetic fixtures. |
| Calculated dataset values | Generated by the kit; validate the totals and references before extending it. |
| Live feed | Timer-driven replay of scripted events. |
| Voice | Scripted playback, no live microphone service. |
| Training videos | Explicit empty placeholders; language controls are retained. |
| Intake structuring | Deterministic keyword parser, not a trained extraction model. |
| Analyst | Explicit fixed demo response by default; optional host-managed model adapter. |
| Authentication, persistence and approval enforcement | Not implemented. UI states are demonstrations. |
| H100, archive operator, matching engine and optimizer | Challenge work; no infrastructure has been rented or model trained. |

The UI contains a persistent synthetic-data notice. Its static narrative examples and comparison assumptions are fictional, not validated business recommendations. See `VALIDATION.md` for actual checks and limitations.

## Model access and review

The event baseline is facilitator-provided DeepSeek access. The supplied public demo runs without a live model. A technical host can configure the server-side adapter using `WOLF_MODEL_BASE_URL`, `WOLF_MODEL_NAME` and, if required, `WOLF_MODEL_TOKEN` in a local `.env.local` file. See [the component map](COMPONENTS.md) for the request contract. Keep provider credentials out of browser code and submissions. H100 capacity is available only after a facilitator confirms a request; no GPU is included in the download.

Plan for a ten-minute fireside conversation from 17:30, with individual appointments announced by the organizer. Bring runnable code, a working path, one failure case, evaluation evidence and known limitations. A short recording is a fallback, not a separate pitch requirement.

## Language
The participant interface, guides and dataset descriptions use English. Supplier brands and technical dimensions are retained. Internal route paths and typed field names remain stable for compatibility; they are not display labels. Raw spreadsheet headers are translated while column positions and duplicate-header cases are preserved.

## Distribution

Keep the supplied dependency notices and respect the existing template's licensing. This is a workshop copy; no new open-source licence or broader redistribution right is asserted. Do not copy `.env`, `.vercel`, `node_modules`, `.next`, browser state, original client material or private research into a participant archive.

Next action: select one track, define its failure case and demonstrate a source update flowing through to a reviewable decision.
