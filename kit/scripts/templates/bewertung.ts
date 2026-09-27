export type MatrixCell = {
    supplier: string;
    route: 'direct' | 'indirect' | 'none';
    verbatim: string;
    current: string;
};
export type MatrixRow = {
    iso: string;
    name: string;
    cells: MatrixCell[];
};
export type ScoreRow = {
    name: string;
    legalName: string;
    warehouses: string;
    categoriesPct: number;
    categoriesN: number;
    coveragePct: number;
    coverageN: number;
    directPct: number;
    directN: number;
    pricePct: number;
    priceN: number;
    priceTotal: number;
    avgPct: number;
    caveatsN: number;
    plus: string[];
    minus: string[];
};
