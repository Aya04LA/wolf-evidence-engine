# Wolf Materials Lab: twenty-minute briefing

Participant-safe facilitator script. The customer, commercial records and values are fictional. Supplier names and technical part descriptions are retained as reference content; the exercise does not represent actual supplier offers or relationships. This script uses the existing [challenge](CHALLENGE.md), [dataset guide](DATASET.md) and [starter guide](README.md). The host announces confirmed access and interview appointments separately.

Prepare the local frontend and open the dataset guide before starting. Use only the supplied synthetic fixtures on screen. Where the starter does not implement a workflow, show the expected records and describe the behavior candidates will build. The timings include the demonstration and participant setup actions.

## 0:00-3:00: the buyer's problem

Say:

“You are building for a buyer in a fictional automotive service network. The buyer needs to compare materials across suppliers and markets. The available files disagree about names, units and prices. Some arrive late. Some replace an earlier file, while others add only one supplier.

“The buyer's question is: what can I decide now, and which evidence makes that decision defensible? A useful answer must survive a corrected file. It must tell the buyer what changed, show the affected records and ask for a new approval when the evidence behind the old one is no longer current.

“Your assignment is to build one difficult slice of that workflow through the supplied frontend. A narrow path that works and explains its failures is enough. Choose the decision you can demonstrate, then make the source update matter.”

On screen, identify the starting dashboard and a relevant review or comparison screen. Point to the synthetic-data notice. Ask participants to write one sentence naming their buyer decision.

## 3:00-6:00: understand the new input

Say:

“The kit has two separate exercises. The clean transaction ledger drives the current dashboard. The smaller versioned import fixtures contain an old delivery, an incoming delivery and the expected current records. They are not already connected to the dashboard. Do not add the fixture totals to the dashboard ledger.

“The later delivery contains four types of change. A market export is replaced. Another market is replaced across two sheets. A supplier is added while the other suppliers stay. One supplier's subset is repaired without deleting unrelated records.

“Your importer must know the scope of a replacement. It must distinguish an invoice total repeated on every row from each line's amount. It must preserve cancellations and keep the original source reference. A repeated event must produce the same result.”

Open `kit/dataset/ingestion-versions.json`, `update-lineage.json` and the matching raw matrix in `input-sheets.json`. Locate one replacement scope and one addition. Use the file's actual identifiers and values; do not improvise amounts. Explain that spreadsheet layouts are supplied as matrices/CSV, while invoice fixtures are text/structured records rather than scanned PDFs.

## 6:00-11:00: demonstrate the intended workflow

Say:

“We will follow one source update all the way to a decision. Some parts are currently fixtures or interface demonstrations. Your code will connect and enforce the part you choose.”

Spend the five minutes on this sequence:

| Time | Show | Explain |
| --- | --- | --- |
| 6:00-7:00 | Old input and its expected records. | “This is the evidence available before the update. Record its version before calculating.” |
| 7:00-8:00 | Incoming replacement or correction and its declared scope. | “This event affects these records. Unrelated suppliers remain.” |
| 8:00-9:00 | Expected-current fixture and affected finding. | “The new result must come from the changed records. Keep the earlier version available for inspection.” |
| 9:00-10:00 | Relevant review screen or proposed approval state. | “A buyer must inspect the source and correct a record. Approval belongs to a specific version. The starter does not yet enforce that rule.” |
| 10:00-11:00 | Duplicate event and a deliberately unresolved field. | “Replaying the event must not double count. Missing evidence becomes an exception, not an invented value.” |

If no completed importer is available, compare the supplied old/incoming/expected records directly and label this as the target behavior. Do not suggest that the starter already performs ingestion, authentication, persistent approvals or autonomous procurement. Its live feed, voice and default analyst response are simulations described in the starter guide.

## 11:00-16:00: choose a slice and define proof

Say:

“You can work on import and evidence, invoice reconstruction, product identity, constrained procurement planning, a measured model experiment or an evidence-based decision brief. The challenge document defines these options. Some require you to create additional fictional fixtures, such as scanned invoices, product near-matches or route capacities.

“For any slice, show a checked record or decision, its source and version, a meaningful update, one failure case and a reproducible baseline. Keep arithmetic and constraints independently checkable. Show where a human must review the result.

“The proposed scoring is 30 points for data correctness, 20 for provenance and uncertainty, 20 for the event-driven workflow, 15 for the technical experiment and 15 for the buyer experience. Record evidence for your claims. Hardware use by itself earns no points.

“The kit includes expected answers so you can debug. Report that honestly as open-fixture evaluation. If you build a model experiment, separate training and evaluation by whole layouts or product families where relevant. Do not call repeated versions of a training example a held-out test.”

Allow two minutes within this segment for each participant to note their chosen workflow, baseline and failure case. Confirm the announced individual or collaboration rules. Anyone working together should record their own contribution for the conversation.

## 16:00-20:00: access, handoff and review

Say:

“The baseline access plan is a host-provided DeepSeek API. Use the access details and allowance announced by the technical host. Do not put provider keys into frontend code or your submission. The starter also runs in demo mode; a demo response is not a model benchmark.

“H100 experiments require a request. Explain what you need to measure, the model and memory requirement, the time needed and the result you will export. Allocation depends on the confirmed shared capacity. You can build and evaluate a strong solution with the API baseline and deterministic checks.

“At handoff, provide runnable code, the exact start command, input cases, evaluation output, your baseline comparison and the known limitations. Identify simulations and unimplemented boundaries. Any external message, purchase or contract action stays a draft or mock.

“The final review is a ten-minute one-to-one fireside conversation. Expect to show your working path, inspect a failure or repeated event, explain your design choices and describe your next fix. A short recording can help if the live demo fails. Keep the submitted version available for inspection.”

Use the remaining time to announce the confirmed local schedule, submission route, build/collaboration rule, API access route, GPU request process and interview appointment process. Do not announce unconfirmed rooms, people or hardware availability. Take installation blockers and direct them to the technical host.

Next action for each participant: open the starter, name one buyer decision and save a baseline case that currently fails.
