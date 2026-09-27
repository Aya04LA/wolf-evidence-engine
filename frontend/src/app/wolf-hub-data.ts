/**
 * Public hub source register.
 * Dataset: kit/dataset/manifest.json, generated 2026-09-18; synthetic fixture counts.
 * Event: facilitator briefing supplied for 2026-09-18; public logistics only.
 * Track acceptance criteria below are recommendations, not implemented capabilities.
 */
export const wolfEvent = {
  date: "Friday, 18 September 2026",
  location: "Casablanca",
  briefingMinutes: 20,
  firesideStart: "17:30",
  firesideMinutes: 10,
  proposedComputeWindow: "13:00 to 17:00",
} as const;

export const wolfDataset = {
  transactions: 4872,
  markets: 29,
  products: 21,
  suppliers: 10,
  invoices: 36,
  source: "kit/dataset/manifest.json",
  generatedAsOf: "18 September 2026",
} as const;

export const wolfTracks = [
  {
    number: "01",
    title: "Make every update traceable.",
    label: "Evidence & import events",
    problem:
      "Country inputs arrive in different formats. A late update can replace a quote, introduce a conflict or leave a record incomplete.",
    build:
      "Import one input, preserve its source and version, and show what changed. Route ambiguous records to human review.",
    prove:
      "Replay a duplicate and a late update. Show the accepted version, the rejected or pending record, and the evidence behind the decision.",
    files: "input-sheets.json · update-lineage.json · workflow-events.json",
  },
  {
    number: "02",
    title: "Match on evidence.",
    label: "Specification matching",
    problem:
      "Similar product names can hide different technical properties. The cheapest offer may not meet the requirement.",
    build:
      "Compare a requirement with candidate products. Cite the fields that support a match and explicitly flag missing or conflicting specifications.",
    prove:
      "Show a supported match and a counterexample. Explain where a person must decide, including when the evidence is insufficient.",
    files: "products.json · offer-versions.json · quality-issues.json",
  },
  {
    number: "03",
    title: "Make constraints visible.",
    label: "Constraint optimization",
    problem:
      "Supplier selection has to balance cost with technical fit, coverage and supply constraints.",
    build:
      "Recommend a feasible allocation for a small product or market slice. State your objective, assumptions and hard constraints.",
    prove:
      "Compare against a simple baseline. Include an infeasible case and explain which constraint prevents a recommendation.",
    files: "transactions.json · suppliers.json · products.json",
  },
] as const;

export const wolfResources = [
  {
    number: "01",
    title: "Challenge brief",
    description:
      "The scenario, recommended tracks and what to bring to the review.",
    href: "/resources/brief",
    action: "Read the brief",
  },
  {
    number: "02",
    title: "Dataset guide",
    description:
      "Schemas, synthetic fixtures, known caveats and update exercises.",
    href: "/resources/dataset",
    action: "Explore the data",
  },
  {
    number: "03",
    title: "Local setup",
    description:
      "Start the application, find the data and configure your own environment.",
    href: "/resources/setup",
    action: "Set up locally",
  },
  {
    number: "04",
    title: "Component map",
    description: "Find the existing screens and the places you can extend.",
    href: "/resources/components",
    action: "Find a starting point",
  },
] as const;

export function formatCount(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
