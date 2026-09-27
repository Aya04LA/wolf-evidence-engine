# Validation and delivery limits

Checked 18 September 2026. These results apply to this starter, not to a future team's agent.

| Check | Result |
| --- | --- |
| TypeScript | `npm run typecheck` passed. |
| Production build | `npm run build` passed, including type and lint checks. Two non-blocking inherited UI lint warnings remain: named-import ordering and an unused map variable. |
| Production browser routes | All 13 dashboard routes returned 200. No page exceptions, console errors, broken images or searched client/person identifiers in rendered text. |
| Visual checks | Desktop overview, data screen and component examples inspected. Mobile overview has no horizontal overflow at 390px. Print-media component view inspected. |
| Component interaction | Approve demo proposal changes to a disabled Approved locally state. This is local UI state, not durable approval enforcement. |
| API boundaries | Demo analyst returns labelled synthetic summary; empty conversation returns 400; voice returns demo; structuring returns explicit 503 fallback; access endpoint does not accept arbitrary passwords. |
| Dataset | 4,872 transactions reconcile across market, product, month, cluster and raw-drilldown totals. Foreign keys, effective offers, invoice arithmetic and evidence files pass. |
| Late versions | Four update modes validated. France replacement preserves unrelated suppliers; cancellation amounts agree with the raw sheet representation. |
| Reproducibility | Re-running the standard-library Python generator produces byte-identical existing output files. |
| Content review | Bounded identifier/private-path scan and independent adversarial review completed. Source invoices, workbooks, transcripts, credentials, logos and deployment metadata are excluded. |

Browser screenshots and machine-readable results are retained in the organizer's `evidence/` folder, outside the participant archives. A clean Vercel dependency installation and production build subsequently passed. The archives exclude dependencies, build output and historical screenshots.

The original source application was left unchanged. This starter preserves its information architecture and component implementation, with identity/media removal, synthetic adapters, explicit demo labels and the additional component examples page. It is not a byte-identical copy of a deployed build.

The model adapter has been checked in demo mode only. No live model endpoint, GPU runtime, model quality, latency or operating cost has been validated. The participant website distributes the demo and source; it does not supply a production database, real archive access, speech service or external messaging.

The invoice fixtures are text/JSON. The raw late-delivery layouts are JSON matrices and CSV sheets. The ingestion exercises are separate from the clean dashboard ledger and are a team implementation task. Training-video media is deliberately absent and shown as a placeholder.

Before delivery beyond the workshop, implement access control, persistence, real source selection, import/version semantics, approval enforcement, audit logging and operational testing. These are explicit remaining tasks, not hidden capabilities of the demo.
