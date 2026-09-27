export type ValueSource = 'nullmessung' | 'listenpreis_web' | 'hersteller_sop' | 'annahme';
export type PriceBasis = 'AT' | 'PT';
export type SystemStep = {
    grit: string;
    product: string;
    articleNo: string;
    consumption: number;
    unit: string;
    priceEUR: Record<PriceBasis, number>;
    priceSource: Record<PriceBasis, ValueSource>;
    timeMin: number;
};
export type SupplierSystem = {
    supplier: string;
    systemName: string;
    chainSource: ValueSource;
    prozessQuelle: string;
    setupMin: number;
    status: {
        anleitung: 'received' | 'promised' | 'requested';
        produkte: 'received' | 'promised' | 'requested';
        test: string;
    };
    steps: SystemStep[];
    note?: string;
};
export type RepairCase = {
    id: string;
    title: string;
    subtitle: string;
    defaultVolume: number;
    volumeMax: number;
    volumeNote: string;
    systems: SupplierSystem[];
};
export type SystemCosts = {
    materialEUR: number;
    timeMin: number;
    laborEUR: number;
    totalEUR: number;
};
