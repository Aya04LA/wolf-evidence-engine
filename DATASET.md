# Dataset guide

Commercial records are fictional; supplier names and technical reference parts are retained. Seed `9182029`; observation period January through August 2026. Current counts and totals come from `kit/dataset/manifest.json`.

## Files and relationships

| File | Purpose |
| --- | --- |
| `transactions.json`, `transactions.csv` | 4,872 clean canonical transaction rows. Join `productCode` to products, `supplierId` to suppliers and `iso` to countries. |
| `products.json`, `suppliers.json`, `countries.json` | 21 reference parts, 10 real supplier names and 29 public geographic markets. All commercial values and relationships are synthetic. |
| `product-reference-catalog.json` | 106 reference part descriptions translated into English with technical specifications, reference units and brand labels. No commercial values or customer identifiers. |
| `fx-rates.json` | Synthetic conversion assumptions. These are not current exchange rates. |
| `offer-versions.json` | 414 offer-version records. Effective version matters when checking invoice prices. |
| `synthetic-invoices.json`, `invoice-text/`, `invoice-gold.json` | 36 invented invoice records, matching text evidence and expected outcomes. No scanned PDF or real archive data. |
| `workflow-events.json`, `quality-issues.json` | Designed event and exception cases. They are inputs for a team to implement, not proof of an existing agent. |
| `ingestion-versions.json`, `update-lineage.json` | Old, incoming and expected-current records for four distinct update operations. |
| `input-sheets.json`, `input-schema.json`, `input-sheets/` | Spreadsheet-like matrices and CSV sheets retaining header positions, grouping and duplicate-column problems. |
| `ui-exports.json` | Generated values behind the frontend adapters; useful for checking cross-screen reconciliation. |

All paths in the table are relative to `kit/dataset/`. Actual CSV sheet filenames are listed by the generator output directory. Workbook sheet structure is represented as matrices/CSV; no original XLSX files are distributed.

## Two deliberately separate exercises

The canonical transaction ledger drives the dashboard. Its market, product, month, cluster and raw-drilldown totals reconcile to the same observed-period amount.

The smaller ingestion-version fixtures are an independent exercise with expected results. They are not already connected to the dashboard and must not be added to its ledger. A team should implement the version-aware import, then wire its approved output through the existing typed adapters. This boundary is intentional and visible here; the kit is not a completed ingestion product.

The four late-delivery cases are:

1. `XK`: replace the market export, including grouped rows and subtotal-like layout.
2. `IT`: replace the market export across two sheets translated into English with several price concepts.
3. `HU`: add a supplier, preserving existing suppliers and handling local-currency unit prices.
4. `FR`: replace one supplier's subset, preserving unrelated rows, distinguishing invoice totals from line values and handling cancellation lines.

`input-sheets.json` contains row-major matrices. Do not build objects keyed by header name before resolving duplicate column names. A repeated invoice header total is not an amount to sum per line.

## Regenerate and check

These commands require the full starter kit. The dataset-only download contains data and this guide; use its files directly in your own stack, or download the full starter for the generator, validator and frontend.

From the kit root:

```bash
python3 kit/scripts/generate.py
python3 kit/scripts/validate.py --reproducible
```

Both scripts use the Python standard library and require no access to the source project. The reproducibility check regenerates the dataset and compares file hashes. Validation checks foreign keys, arithmetic, effective offer references, source-file existence, reconciliation across UI aggregates, raw sheet widths and scoped update behavior.

Generated `frontend/src/data/` files should be changed through the generator. The retained technical field `qtyYear` contains observed-period quantity for compatibility; the UI explicitly labels it as January-August quantity. Do not interpret that field name as annualization.

## Limits and evaluation splits

This is a compact structural replica of the four later update deliveries, not a row-for-row or distribution-matched copy of every source workbook. The five raw sheet layouts retain their column positions, sheet identities, duplicate-header positions, grouping and cancellation concepts. All human-readable headers and values are translated into English; supplier-specific and internal site-code labels are generic. Original column wording is therefore not retained. The HU sheet label is translated to `Sheet1`; the IT sheet codes remain identifiers. Commercial values, transaction identifiers, customer identities and row counts are synthetic. Original workbook formatting, hidden sheets, formulas, merged cells and oversized used ranges are not reproduced by CSV/JSON.

Supplier names and part terminology are allowed reference content. Supplier-country coverage, offers, product associations, ratings and agreements remain invented exercise cases. `WLF` product keys and supplier IDs are synthetic. `referenceUnit` expresses the catalogue unit in English; the compact ledger's normalized `piece` unit is an exercise convention, not a source pack conversion or a genuine quotation.

The earlier country exports, RFI questionnaires, original offer-sheet workbooks and physical testing forms are not each replicated as raw workbooks. Their procurement concepts appear in the normalized dataset and frontend. Use the kit for the stated workflow exercises; do not use it to claim production ingestion coverage or matching accuracy on the source corpus.

The fixture is intentionally smaller and more regular than a real procurement corpus. Most canonical records are clean; adversarial cases sit in the invoice and import exercises. Synthetic scores, maturity levels, savings assumptions and supplier coverage are invented. They are not evidence of model accuracy or business benefit.

The answer files are supplied for builders. For a fair competition, the facilitator must hold back additional cases and split by supplier/layout/product family rather than randomly distributing near-duplicate rows. No private holdout has been established by this kit.

Next action: pick one fixture family, write a baseline importer and run it against the expected-current or invoice-gold records before connecting a model.
