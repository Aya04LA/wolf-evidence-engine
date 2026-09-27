export interface CompanyKennzahl {
    id: string;
    label: string;
    prev: number;
    curr: number;
    fmt: (v: number) => string;
}
