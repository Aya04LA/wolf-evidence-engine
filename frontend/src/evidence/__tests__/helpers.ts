import type { ParseContext } from '../ingest/parse-fr';

import { parseCents } from '../domain/money';
import { readFixtureJson, readFixtureText, loadReferenceData } from '../ingest/fixtures';

export interface FixtureRow {
  id: string;
  iso: string;
  date: string;
  productCode: string;
  supplierId: string;
  brand: string;
  description: string;
  cluster: string;
  qty: number;
  unitPriceEUR: number;
  valueEUR: number;
  currency: string;
}
type Versions = Record<string, { v1: FixtureRow[]; v2: FixtureRow[]; current: FixtureRow[] }>;

export const versions = () => {
  const v = readFixtureJson<Versions>('ingestion-versions.json');
  if (!v) throw new Error('ingestion-versions.json missing — set WOLF_KIT_DIR');
  return v;
};

export const ref = () => {
  const r = loadReferenceData();
  if (!r) throw new Error('reference data missing — set WOLF_KIT_DIR');
  return r;
};

/** Fixture floats → cents via their 2-dp string form, never `x * 100`. */
export const cents = (eur: number): number => {
  const c = parseCents(eur.toFixed(2));
  if (c === null) throw new Error(`bad amount ${eur}`);
  return c;
};

export const frCtx = (): ParseContext => ({
  file: 'input-sheets/FR-v2--Sheet1.csv',
  market: 'FR',
  scopeSupplierId: 'sup-aster',
  idPrefix: 'FR-LATEST',
  ref: ref(),
});

export const frText = (): string => {
  const t = readFixtureText('FR-v2');
  if (t === null) throw new Error('FR-v2 sheet missing');
  return t;
};
