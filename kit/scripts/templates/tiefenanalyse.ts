export type BasketRow = {
    iso: string;
    name: string;
    totalEUR: number;
    matchedEUR: number;
    matchedLines: number;
    sharePct: number;
};
export type ParetoRow = {
    iso: string;
    name: string;
    nCodes: number;
    n80: number;
    top10Pct: number;
};
export type RouteRow = {
    iso: string;
    name: string;
    totalEUR: number;
    directEUR: number;
    directPct: number;
    directBrands: string[];
    topDistributors: {
        name: string;
        valueEUR: number;
    }[];
};
export type MonthPoint = {
    month: string;
    valueEUR: number;
};
export type MonthRow = {
    iso: string;
    name: string;
    points: MonthPoint[];
    medianEUR: number;
    peakMonth: string;
    peakFactor: number;
};
export type Kernzahl = {
    value: string;
    label: string;
    note: string;
};
export type Regel = {
    wenn: string;
    dann: string;
    kind: 'lever' | 'gap';
};
export type MonitorRow = {
    alarm: string;
    metrik: string;
    quelle: string;
    sofort: boolean;
};
export type SichtRow = {
    iso: string;
    name: string;
    suppliersVisible: number;
    files: number;
};
