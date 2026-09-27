import 'server-only';

import path from 'node:path';
import { readFileSync } from 'node:fs';

/**
 * The only way the engine touches the filesystem. Files are addressed by a fixed allowlist, so
 * no caller-supplied string ever becomes a path (no traversal surface).
 */
const ALLOWED = {
  'ingestion-versions.json': 'ingestion-versions.json',
  'update-lineage.json': 'update-lineage.json',
  'fx-rates.json': 'fx-rates.json',
  'products.json': 'products.json',
  'suppliers.json': 'suppliers.json',
  'FR-v2': 'input-sheets/FR-v2--Sheet1.csv',
  'HU-v2': 'input-sheets/HU-v2--Sheet1.csv',
  'XK-v2': 'input-sheets/XK-v2--Report.csv',
  'IT-v2:MA CARR': 'input-sheets/IT-v2--MA CARR.csv',
  'IT-v2:MA VERN': 'input-sheets/IT-v2--MA VERN.csv',
} as const;

export type FixtureKey = keyof typeof ALLOWED;

/** `WOLF_KIT_DIR` overrides the default `<repo>/kit/dataset` (the server runs from `frontend/`). */
function kitDir(): string {
  return process.env.WOLF_KIT_DIR ?? path.resolve(process.cwd(), '..', 'kit', 'dataset');
}

export const fixturePath = (key: FixtureKey): string => ALLOWED[key];

export function readFixtureText(key: FixtureKey): string | null {
  try {
    return readFileSync(path.join(kitDir(), ALLOWED[key]), 'utf8');
  } catch {
    return null; // caller turns this into abstain('missing_source')
  }
}

export function readFixtureJson<T>(key: FixtureKey): T | null {
  const text = readFixtureText(key);
  return text === null ? null : (JSON.parse(text) as T);
}

// ---------------------------------------------------------------------------------------------
// Reference data

export interface ProductRef {
  code: string;
  name: string;
  cluster: string;
  unit: string;
}
export interface SupplierRef {
  id: string;
  name: string;
}
export interface ReferenceData {
  products: ReadonlyMap<string, ProductRef>;
  suppliers: ReadonlyMap<string, SupplierRef>;
  /** Units of local currency per 1 EUR, as decimal strings kept exact. */
  fx: Readonly<Record<string, number>>;
}

export function loadReferenceData(): ReferenceData | null {
  const products = readFixtureJson<ProductRef[]>('products.json');
  const suppliers = readFixtureJson<SupplierRef[]>('suppliers.json');
  const fx = readFixtureJson<Record<string, number>>('fx-rates.json');
  if (!products || !suppliers || !fx) return null;
  return {
    products: new Map(products.map((p) => [p.code, p])),
    suppliers: new Map(suppliers.map((s) => [s.id, s])),
    fx,
  };
}
