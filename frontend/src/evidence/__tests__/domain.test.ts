import { it, expect, describe } from 'vitest';

import { contentId, canonicalJson } from '../domain/hash';
import { parseCsv, excelSerialToIso } from '../ingest/csv';
import { parseCents, divRoundHalfEven } from '../domain/money';

describe('money', () => {
  it('parses decimal strings to exact cents', () => {
    expect(parseCents('8727.84')).toBe(872784);
    expect(parseCents('-11336.16')).toBe(-1133616);
    expect(parseCents('10036.4')).toBe(1003640);
    expect(parseCents('12')).toBe(1200);
  });

  it('rejects anything that is not a plain decimal', () => {
    for (const bad of ['', '1,5', '1.234', '1e3', 'NaN', '€5', '--1']) expect(parseCents(bad)).toBeNull();
  });

  it('rounds half to even, sign-safe', () => {
    expect(divRoundHalfEven(5, 2)).toBe(2);
    expect(divRoundHalfEven(7, 2)).toBe(4);
    expect(divRoundHalfEven(-5, 2)).toBe(-2);
    expect(divRoundHalfEven(10, 3)).toBe(3);
    expect(() => divRoundHalfEven(1, 0)).toThrow();
  });
});

describe('hash', () => {
  it('is independent of key order', () => {
    expect(contentId({ a: 1, b: [1, { d: 2, c: 3 }] })).toBe(contentId({ b: [1, { c: 3, d: 2 }], a: 1 }));
  });

  it('refuses values JSON would silently corrupt', () => {
    expect(() => canonicalJson(Number.NaN)).toThrow();
    expect(() => canonicalJson({ f: () => 1 })).toThrow();
  });
});

describe('csv', () => {
  it('keeps duplicate headers as positions and handles quotes and CRLF', () => {
    expect(parseCsv('Invoice,Item,Invoice\r\n"a,b","say ""hi""",3\r\n')).toEqual([
      ['Invoice', 'Item', 'Invoice'],
      ['a,b', 'say "hi"', '3'],
    ]);
  });

  it('converts Excel serial dates', () => {
    expect(excelSerialToIso(46270)).toBe('2026-09-05');
    expect(excelSerialToIso(46023)).toBe('2026-01-01');
    expect(excelSerialToIso(1.5)).toBeNull();
  });
});
