export type ValueSource = 'synthetic_email' | 'rfi_protokoll' | 'nullmessung' | 'annahme';
export type Iso2 = string;
export type DomesticWarehouse = {
    country: Iso2;
    countryName: string;
    domesticOnly: true;
    source: ValueSource;
    note: string;
};
export type Hub = {
    id: 'HUB-N' | 'HUB-S';
    name: string;
    country: Iso2;
    countryName: string;
    deliversTo: Iso2[];
    surchargeByTarget: Record<string, number>;
    surchargeFlat?: number;
    source: ValueSource;
    note: string;
};
export type RangeParam = {
    min: number;
    max: number;
    default: number;
    rangeSource: ValueSource;
    defaultSource: ValueSource;
    label: string;
    note: string;
};
export type InCountryParams = {
    logistikpauschale: RangeParam;
    grosshandelsmarge: RangeParam;
};
export type SupplierG2M = {
    supplier: string;
    date: string;
    directMarkets: Iso2[];
    viaWarehouse: Iso2[];
    viaDistributor: Iso2[];
    logisticsContractOption: string;
    source: ValueSource;
    notes: string;
};
export type ReferenceArticle = {
    code: string;
    name: string;
    unit: string;
    prices: Record<Iso2, number>;
    bestSourceCountry: Iso2;
    priceSource: ValueSource;
};
export type PainPointHighlight = {
    title: string;
    detail: string;
    source: string;
};
