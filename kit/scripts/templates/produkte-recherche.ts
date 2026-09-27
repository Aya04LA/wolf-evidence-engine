export type TechFact = {
    text: string;
    source: 'web' | 'rfi';
    url?: string;
};
export type DossierEntry = {
    supplier: string;
    product: string;
    facts: TechFact[];
};
export type Dossier = {
    code: string;
    title: string;
    intro: string;
    introEn: string;
    entries: DossierEntry[];
};
