# Frontend map

The existing Next.js/MUI design system is retained. The workshop copy changes identity, data, credentials and demo boundaries; it does not introduce a new visual language.

| Reuse | Location | Start here |
| --- | --- | --- |
| Palette, fonts and component overrides | `frontend/src/theme/` | `theme-config.ts`, `core/typography.ts`, `core/components/` |
| Dashboard shell and navigation | `frontend/src/layouts/` | `dashboard/layout.tsx`, `nav-config-dashboard.tsx` |
| Common controls | `frontend/src/components/` | `label`, `iconify`, `custom-dialog`, `table`, `scrollbar`, `chart` |
| Component examples | `/dashboard/components` | Approval state, evidence table, threshold slider, labels and actions |
| Global overview and map | `src/sections/uebersicht/` | Summary cards, map selection, market drawer and simulated feed |
| Intake | `src/sections/erhebung/` | Channel cards, scripted voice session and deterministic text structurer |
| Baseline and detail | `src/sections/nullmessung/`, `tiefenanalyse/` | Country tables, product-price comparison, raw row explorer and quality notes |
| Product comparison | `src/sections/produkte/`, `systemvergleich/` | Specification catalogue and process-cost calculator |
| Routes and scenarios | `src/sections/lieferlinie/` | Hub network, coverage matrix and landed-cost controls |
| Tender and decision | `src/sections/ausschreibung/`, `vertraege/`, `entscheidung/` | Supplier matching, contract stages, score cards and presentation views |
| Maturity and learning | `src/sections/reifegrad/`, `academy/` | Heatmap, training catalogue and roleplay |

Paths beginning with `src/` above are relative to `frontend/`. The component catalogue is a small working example, not a separate package or Storybook build.

## Data and API boundaries

The domain screens consume exports in `frontend/src/data/`. Their TypeScript interfaces preserve the template's public data shapes. The generator emits synthetic records into those adapters. `frontend/public/data/nullmessung-lines.json` feeds the row explorer.

`POST /api/analyse` accepts `{ "messages": [{ "role": "user", "text": "..." }] }` and returns plain text. It returns a clearly labelled fixed data summary in demo mode. If the host configures both `WOLF_MODEL_BASE_URL` and `WOLF_MODEL_NAME`, it calls `/chat/completions` server-side. Optional endpoint authentication is supplied by the host through `WOLF_MODEL_TOKEN`. The UI never receives that value. This adapter has no tool-execution authority.

`GET /api/voice/signed-url` returns `{ "demo": true }`. `POST /api/erhebung/structure` returns an explicit demo response so the client uses its local keyword parser. Neither is a live speech or document-understanding service.

## Extension pattern

Keep the page layout and reuse existing table, drawer and label controls. Add an adapter behind the typed data boundary, then show the input version, evidence reference, exception state and human decision in the screen. Never represent a simulated import as a successful write to a real system.

Authentication, persistence, tenant separation, background jobs, document upload, permission enforcement and production observability are delivery work. The workshop server binds to localhost by default.
