# Handover notes

Context for whoever reviews this repository. My machine failed during the hackathon, so this is
a post-event build of Track 1 on the supplied starter kit, done in phases with one commit each
(`git log --oneline` shows them in order).

## In one sentence

When a corrected supplier file arrives, the system detects exactly what changed, recomputes the
affected findings, and marks any approval that relied on the old data as stale. A person must
re-check the evidence before that decision is trusted again.

## Why it matters

Buyers approve decisions from spreadsheets delivered by many markets. Late files replace, add
to or repair that data after the fact. The dataset has four different behaviours: XK and IT
replace the market, HU adds a supplier, and FR repairs one supplier's subset. If nobody notices
a correction landed, an approval keeps looking valid while it rests on outdated numbers. That is
the failure this prevents.

## Design decisions worth discussing

1. **Every finding is versioned by content.** A version id is a hash of the inputs. So "stale" is just `approval.versionId ≠ current.versionId`, and replay is idempotent by construction, not by a "seen before" flag.
2. **One pure merge function per lineage mode, with scope guards.** A replacement mistaken for an addition, a replacement that silently drops a supplier, or a subset repair for a supplier that is not present: each is *rejected with a reason*, never merged.
3. **Abstention is a first-class result.** Every layer returns ok / abstain / conflict / rejected. On v1, most price decisions *abstain*, because supplier prices for the same part swing by 5–10×. The repaired files make a recommendation possible. That is the decision the late file changes.
4. **Corrections are pinned too.** A buyer's correction applies only while the record still has the content the buyer reviewed. A later source delivery turns it stale instead of being silently overridden.
5. **The model is at the edge, and optional.** Explanations are written by code from computed facts. A model may only reword them, and any number it adds rejects its output. No model is needed to run or demo.
6. **Architecture enforced by lint.** The engine is framework-free and cannot import UI code; the UI can only import wire types.

## What I would do next

1. Persistence (Postgres) behind the `store/` seam, plus real authentication so the reviewer is an identity, not a name.
2. A supplier column, or a human-labelling step, for the XK and IT layouts. Today their supplier is carried from the previous version, which would misattribute a real supplier switch.
3. A nonce-based script CSP, and the `next@16` upgrade that clears the remaining audit advisories.
4. A real push source (watching an upload folder or an SFTP drop) in place of the simulated queue.
5. Held-out layouts: new sheet formats per market, to test the parsers against something they were not written against.

## One failure found while building, and the fix

The first HU explanation said "Würth at €73.23" without mentioning that 3M averages €36.23. 3M is
excluded because its prices are unstable, but the sentence made the recommendation look wrong.
The explanation now names every cheaper supplier that was excluded, and why. More failures found
and fixed during the build (e.g. DNS rebinding past a same-origin check, an unbounded body read)
are listed in the commit messages and in IMPLEMENTATION.md §7.
