export type QualityRating = 'clean' | 'raw' | 'poor' | 'unusable' | 'rejected' | 'demand_only';
export type NullmessungCountry = {
    iso: string;
    name: string;
    directVendors: string[];
    brandsBought: {
        name: string;
        valueEUR: number;
    }[];
    totalEUR: number;
    rows: number;
    files: number;
    currency: string;
    language: string;
    granularity: string;
    quality: QualityRating;
    topBrands: {
        name: string;
        valueEUR: number;
    }[];
    caveats: string[];
};
export type RefProductPoint = {
    iso: string;
    priceEUR: number;
    basis: string;
    note?: string;
};
export type RefProduct = {
    code: string;
    name: string;
    points: RefProductPoint[];
};
export type RfiGtmEntry = {
    iso: string;
    market: string;
    current: string;
    possible: string;
};
export type RfiSupplier = {
    name: string;
    legalName: string;
    hq: string;
    categories: string[];
    directPossible: string[];
    gtm: RfiGtmEntry[];
};
export type Insight = {
    de: string;
    en: string;
    kind: 'finding' | 'gap' | 'risk';
};
export type FeedEvent = {
    ts: string;
    channel: 'teams' | 'email' | 'dashboard';
    kind: 'new-data' | 'anomaly' | 'quality' | 'decision';
    de: string;
    en: string;
    action?: string;
};
export type DeltaRow = {
    label: string;
    code: string;
    qtyYear?: number;
    worstEUR: number;
    worstIso: string;
    bestEUR: number;
    bestIso: string;
    potentialEUR?: number;
    note?: string;
};
export type BonusRow = {
    iso: string;
    name: string;
    ratePct: number;
    spendEUR: number;
    bonusEUR: number;
};
export type RawSample = {
    iso: string;
    raw: string;
    brand: string;
    readAs: string;
    valueEUR: number;
    currency: string;
    valueLocal: number;
};
export type NullmessungMeta = {
    files: number;
    countries: number;
    rows: number;
    languages: string[];
    currencies: string[];
    totalEUR: number;
    fxNote: string;
    generated: string;
};
export type MonthlyPoint = {
    month: string;
    iso: string;
    valueEUR: number;
};
export type MonthlyCoverage = {
    iso: string;
    name: string;
    mode: 'monthly' | 'partial' | 'annual_only';
    note: string;
};
export type PriceIndexRow = {
    iso: string;
    name: string;
    factor: number;
    articles: number;
};
export type PriceStatement = {
    de: string;
    en: string;
    valueEUR?: number;
};
