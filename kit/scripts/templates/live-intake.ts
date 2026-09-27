export interface LiveIntakeItem {
    cluster: string;
    item: string;
    qty: string;
}
export interface LiveIntakeEntry {
    id: string;
    iso: string;
    site: string;
    channel: 'Voice' | 'Photo' | 'Delivery note' | 'Voice + Photo';
    language: string;
    items: LiveIntakeItem[];
    delayMs: number;
}
