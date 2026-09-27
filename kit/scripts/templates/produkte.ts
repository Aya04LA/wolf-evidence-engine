export type DemandRow = {
    iso: string;
    qty: number;
    valueEUR: number;
};
export type Equivalent = {
    supplier: string;
    product: string;
    pricePerPiece: number | null;
    basis: string;
    filled: boolean;
};
export type ProduktSpec = {
    code: string;
    neutral: string;
    kategorie: string;
    chips: string[];
    brandName: string;
    demand: DemandRow[];
    totalQty: number;
    totalEUR: number;
    nCountries: number;
    nEquivalents: number;
    bestPiece: Equivalent | null;
    equivalents: Equivalent[];
};
export type Kategorie = {
    name: string;
    specs: string[];
    totalQty: number;
    totalEUR: number;
};
