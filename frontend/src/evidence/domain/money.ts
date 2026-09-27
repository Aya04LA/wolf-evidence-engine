/**
 * Money is held as integer cents. Parsing goes straight from the decimal string to cents, so
 * "8727.84" never passes through a binary float. Rounding happens only in `divRoundHalfEven`.
 */

const DECIMAL = /^(-)?(\d+)(?:\.(\d{1,2}))?$/;

/** Parses a plain decimal string ("-11336.16", "953.04", "12") into cents. Null if malformed. */
export function parseCents(raw: string): number | null {
  const m = DECIMAL.exec(raw.trim());
  if (!m) return null;
  const [, sign, whole, frac = ''] = m;
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) return null;
  return sign ? -cents : cents;
}

/** Integer division with banker's rounding (half to even). Sign-safe. */
export function divRoundHalfEven(numerator: number, denominator: number): number {
  if (denominator === 0) throw new RangeError('divRoundHalfEven: division by zero');
  const sign = Math.sign(numerator) * Math.sign(denominator);
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  const q = Math.floor(n / d);
  const r = n - q * d;
  const twice = r * 2;
  const rounded = twice > d || (twice === d && q % 2 === 1) ? q + 1 : q;
  return sign * rounded;
}

/**
 * Local-currency cents → EUR cents at `rate` local units per EUR (fx-rates.json convention).
 * The rate is scaled to an integer (4 dp) so the division is exact before the single rounding.
 */
export function localToEURCents(localCents: number, rate: number): number | null {
  const m = /^(\d+)(?:\.(\d{1,4}))?$/.exec(String(rate));
  if (!m || rate <= 0) return null;
  const scaledRate = Number(m[1]) * 10_000 + Number((m[2] ?? '').padEnd(4, '0'));
  return divRoundHalfEven(localCents * 10_000, scaledRate);
}

export const sumCents = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

export const formatEUR = (cents: number): string =>
  (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: 'EUR' });
