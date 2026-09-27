# Build a procurement agent that can defend its decision

Wolf hackathon, day two. Participant scenario, fully fictional.

A luxury automotive group buys bodywork and paint consumables across multiple markets. Procurement has supplier spreadsheets, inconsistent product descriptions, several offer versions and incomplete article-level visibility. Late files replace some records, add others and repair a broken subset. A buyer needs a decision that survives those changes.

Your assignment: make a new source event change a purchasing decision, with an evidence trail and a human approval boundary. Use the supplied frontend as your starting point. Pick one difficult slice and make it work end to end.

## The demonstration

Load the first delivery batch. Show an initial finding. Introduce a later replacement, supplier addition or corrected file. The system must identify the affected records, recompute the finding and mark any affected approval as stale. Let a buyer inspect the original evidence, correct one record and approve the new version. Replay the event and prove that the result does not double count.

A pull assistant waits for “analyse these files.” A push agent notices a source update, determines what it affects, prepares the revised finding and requests a specific decision. Simulated polling or a local event queue is sufficient for this hackathon if you label it.

## Technical tracks

| Track | What to build | The difficult case | Convincing demo |
| --- | --- | --- | --- |
| 1. Procurement evidence engine | Incremental import, typed canonical records, provenance and a dependency graph from source lines to recommendations. | A country replacement is mistaken for an addition; an invoice header total repeats on every line; a credit reverses a prior transaction. | Replay the late batch twice. Totals stay identical. Click a changed finding and see its contributing rows and superseded version. |
| 2. Multimodal archive operator | A local invoice archive and document-selection agent, with visual extraction into a schema and arithmetic verification. | Rotated scans, split table rows, locale-specific decimals, missing units, dead archive links and repeated retrieval. | Recover a line item from a rendered invoice, show its evidence region, reconcile the total and abstain on an unreadable field. Archive and scanned-document fixtures are an extension task; the kit starts with synthetic text/structured records. |
| 3. Product identity graph | Cross-language retrieval, reranking and specification-aware matching across supplier SKUs, manufacturer IDs and neutral product families. | Similar names hide different pack sizes, grit, chemistry or process compatibility. One representative test does not prove an entire family equivalent. | Accept differently named equivalents, reject a near-identical wrong match, request a human label and improve the next match without leaking the test set. |
| 4. Procurement digital twin | Constrained allocation over supplier, market and route, with landed cost, capacities, lead time and uncertainty. | Cheapest unit price loses after pack conversion, logistics, stock limits or an unverified route assumption. | Show a feasible plan, sensitivity to an assumption and a certificate of infeasibility when a constraint cannot be met. Separate assumptions from measured inputs. |
| 5. A specialist model that beats its teacher on this task | Benchmark a general model, then improve a smaller local model using synthetic training examples, distillation or an adapter. | Training and evaluation share an invoice template or product family, making an impressive score meaningless. | Hold out complete layouts/families, compare extraction and abstention quality, and report latency, tokens, GPU memory and cost per accepted record. Training is optional; a better retrieval/validation pipeline also counts. |
| 6. Self-auditing decision brief | A structured award record, deterministic benefit calculations and a three-part management brief generated only from approved evidence. | A “saving” is actually avoided future cost; a source changes after award; a statement cites an obsolete record. | Separate recurring savings, rebates and cost avoidance. Freeze the award baseline. Replace a source and show which current claims need review without rewriting the historical award. |

These are proposed build tracks, not implemented capabilities. The dataset and UI are a starting point. Tracks 2, 3, 4 and 6 require teams to add specific challenge fixtures such as rendered scans, hard negatives, capacities or award rules. The supplied kit is in English; cross-language evaluation requires additional fixtures and is optional.

## Recommended combination

Put the strongest builders on tracks 1 and 3, connected through the existing review and comparison screens. Add track 5 if a GPU team wants a measurable model problem. The final reveal should be a late file arriving and the system explaining why yesterday's recommendation is no longer safe to approve.

The most ambitious version combines an archive operator, a multilingual product graph and a solver. Each tool returns typed records and evidence. The language model proposes actions; arithmetic and constraints are checked by code. A reviewer approves a record version, never an unversioned narrative.

## H100 experiment

Use the DeepSeek access announced by the technical host. The frontend works in explicit demo mode without credentials. It also includes a server-side adapter for a host-managed OpenAI-compatible endpoint. H100 access requires a confirmed request. No GPU has been provisioned and no model benchmark has been run for this kit.

One candidate for a document-vision baseline is `Qwen/Qwen3-VL-8B-Instruct`; its publisher provides image-text examples and a vLLM serving command. This is a candidate to evaluate, not a claim that it is the best or newest model. [Model card](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct)

vLLM supplies an OpenAI-compatible serving interface and structured-output support. Use a JSON schema for extraction, then independently check totals, units and evidence references. Schema validity is not factual correctness. [Serving documentation](https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/), [structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs/)

For a Runpod experiment, record the actual GPU configuration, model revision, container version, precision, image resolution, context limit and batch size. Persist datasets and evaluation results on an appropriate persistent volume; container storage is not a durable experiment archive. Actual GPU availability, memory fit, runtime and price remain [?] until measured on the chosen configuration. [Runpod storage](https://docs.runpod.io/pods/storage/types)

## Evaluation contract

Proposed judging weights total 100 points. They are workshop rules, not measured performance.

| Criterion | Points | Evidence |
| --- | ---: | --- |
| Data correctness | 30 | Exact totals after currency/unit normalization; correct replacement scope; reconciliation and credit handling. |
| Provenance and uncertainty | 20 | Source and row/page references, version lineage, explicit abstention when evidence is insufficient. |
| Event-driven workflow | 20 | New input triggers bounded work; idempotent replay; stale approval rejected. |
| Technical experiment | 15 | Reproducible baseline, held-out cases, measured improvement and resource use. |
| Buyer experience | 15 | A reviewer can understand, correct and approve the result through the supplied interface. |

Do not award correctness points for a polished explanation without a checked record. External sends, purchases and contract changes remain drafts or mocks. A proposed action must identify its input version and reviewer.

Adversarial cases: duplicate event; wrong replacement scope; currency mismatch; box-versus-piece confusion; unsupported product equivalence; cancellation; missing source; changed evidence after approval; instruction embedded inside an invoice; denied tool access. A failure should become a visible exception, not a fabricated answer.

## A four-hour build loop

1. First 30 minutes: choose one track, inspect the fixture schemas, define a failing case and record the baseline.
2. Next 90 minutes: implement one working path through the existing UI and a deterministic data/tool boundary.
3. Next 45 minutes: break it with held-out inputs, corrections and duplicate events. Record failures.
4. Next 45 minutes: repair the most consequential failure and capture a two-minute demo.
5. Final 30 minutes: package the run command, evaluation output, decisions, known mocks and next delivery work.

Hand over working code, reproducible evidence and the remaining failure cases. A slide describing an agent is not the deliverable.
