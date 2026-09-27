import standardsortiment from 'src/data/standardsortiment.json';

// ----------------------------------------------------------------------


// umlaut-/diakritika-normalisiert (Muster: lernplattform ConsultationTracker).


export interface TranscriptLine {
  role: 'ai' | 'user';
  text: string;
}

export interface StructuredItem {
  cluster: string;
  item: string;
  qty: string;
  nr?: number;
  note?: string;
}

export interface StructuredResult {
  items: StructuredItem[];
  painPoints: string[];
}

interface KatalogArtikel {
  nr: number;
  cluster: string;
  kategorie: string;
  artikel: string;
  spezifikation: string;
  einheit: string;
  prioritaet: number;
  anmerkung: string;
  marken: string;
}

const KATALOG = standardsortiment as KatalogArtikel[];

// ----------------------------------------------------------------------


function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-/g, '')
    .replace(/[.,;:!?()'"/–—·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



const SPANISH_SYNONYMS: Array<[RegExp, string]> = [
  [/\bmixing cups?\b/g, 'mixing cup'],
  [/\bsanding discs?\b/g, 'sanding discs'],
  [/\bfine line tape\b/g, 'fineline tape'],
];

function applySynonyms(normText: string): string {
  let out = normText;
  for (const [pattern, replacement] of SPANISH_SYNONYMS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// ----------------------------------------------------------------------


const TOKEN_STOPWORDS = new Set([
  'for', 'with', 'from', 'and', 'into', 'standard', 'universal',
  'fine', 'coarse', 'medium', 'intermediate', 'electric', 'random',
  'based', 'system', 'compressed', 'air', 'paint', 'painting',
]);

function entryTokens(artikel: string): string[] {
  return normalize(artikel)
    .split(' ')
    .filter((t) => t.length >= 4 && !/^\d/.test(t) && !TOKEN_STOPWORDS.has(t));
}

interface Matcher {
  entry: KatalogArtikel;
  tokens: string[];
  normSpez: string;
  normArtikel: string;
}

const MATCHERS: Matcher[] = KATALOG.map((entry) => ({
  entry,
  tokens: entryTokens(entry.artikel),
  normSpez: normalize(entry.spezifikation),
  normArtikel: normalize(entry.artikel),
}));


function tokenMatches(normSentence: string, token: string): boolean {
  const esc = escapeRegExp(token);
  if (token.length >= 5) {
    return new RegExp(`(^|\\s)${esc}`).test(normSentence);
  }
  return new RegExp(`(^|\\s)${esc}(\\s|$)`).test(normSentence);
}

// ----------------------------------------------------------------------
// Mengen: Zahl + Einheitswort (VE/Stk/Rollen/Paar …)

const UNIT_MAP: Record<string, string> = {
  pack: 'packs', packs: 'packs', piece: 'pieces', pieces: 'pieces',
  roll: 'rolls', rolls: 'rolls', pair: 'pairs', pairs: 'pairs',
  box: 'boxes', boxes: 'boxes', set: 'sets', sets: 'sets',
  carton: 'cartons', cartons: 'cartons', bottle: 'bottles', bottles: 'bottles',
  can: 'cans', cans: 'cans', tube: 'tubes', tubes: 'tubes', unit: 'units', units: 'units',
};


const UNIT_ALTERNATION = Object.keys(UNIT_MAP)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join('|');

const QTY_RE = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${UNIT_ALTERNATION})(?=\\s|$)`);

function extractQty(normSentence: string): string | undefined {
  const m = QTY_RE.exec(normSentence);
  if (!m) return undefined;
  return `${m[1]} ${UNIT_MAP[m[2]]}`;
}

// ----------------------------------------------------------------------


function extractDetails(normSentence: string, normArtikel: string): string[] {
  const details: string[] = [];
  const grit = /(^|\s)p\s?(\d{2,4})(\s|$)/.exec(normSentence);
  if (grit && !normArtikel.includes(`p${grit[2]}`)) details.push(`P${grit[2]}`);
  const ml = /(\d+(?:[.,]\d+)?)\s*(?:ml|milliliter)(?=\s|$)/.exec(normSentence);
  if (ml && !normArtikel.includes(`${ml[1]} ml`)) details.push(`${ml[1]} ml`);
  const mm = /(\d+(?:[.,]\d+)?)\s*(?:mm|millimeter)(?=\s|$)/.exec(normSentence);
  if (mm && !normArtikel.includes(`${mm[1]} mm`)) details.push(`${mm[1]} mm`);
  return details;
}

// ----------------------------------------------------------------------
// Pain-Point-Heuristik: Lieferzeit / Wochen / Import / Marken-Wildwuchs

const PAIN_PATTERNS: RegExp[] = [
  /lead time/, /two ?week/, /import/, /distributor/,
  /no standard/, /different brands/, /parallel brands/, /delivery delay/,
];
const WISH_PATTERNS: RegExp[] = [/ideal/, /would like/, /we wish/, /would be/];

function isPainPoint(normSentence: string): boolean {
  if (WISH_PATTERNS.some((p) => p.test(normSentence))) return false;
  return PAIN_PATTERNS.some((p) => p.test(normSentence));
}

// ----------------------------------------------------------------------

function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]?/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}


function matchEntry(normSentence: string): Matcher | undefined {
  let best: Matcher | undefined;
  let bestScore = 0;
  const grit = /(^|\s)p\s?(\d{2,4})(\s|$)/.exec(normSentence);

  for (const matcher of MATCHERS) {
    let score = 0;
    for (const token of matcher.tokens) {
      if (tokenMatches(normSentence, token)) score += 1;
    }
    if (score === 0) continue;
    
    if (grit && matcher.normSpez.includes(`p${grit[2]}`)) score += 2;
    const better =
      score > bestScore ||
      (score === bestScore &&
        best !== undefined &&
        (matcher.entry.prioritaet > best.entry.prioritaet ||
          (matcher.entry.prioritaet === best.entry.prioritaet && matcher.entry.nr < best.entry.nr)));
    if (better) {
      best = matcher;
      bestScore = score;
    }
  }
  return best;
}


export function structureTranscript(lines: TranscriptLine[]): StructuredResult {
  const itemByNr = new Map<number, StructuredItem>();
  const items: StructuredItem[] = [];
  const painPoints: string[] = [];
  const seenPain = new Set<string>();

  for (const line of lines) {
    if (line.role !== 'user') continue;

    for (const sentence of splitSentences(line.text)) {
      const normSentence = applySynonyms(normalize(sentence));

      // Herausforderungen
      if (isPainPoint(normSentence) && !seenPain.has(normSentence)) {
        seenPain.add(normSentence);
        painPoints.push(sentence.replace(/[.!?]$/, ''));
      }

      // Positionen
      const match = matchEntry(normSentence);
      if (!match) continue;

      const qty = extractQty(normSentence);
      const details = extractDetails(normSentence, match.normArtikel);
      const label =
        details.length > 0 ? `${match.entry.artikel} (${details.join(', ')})` : match.entry.artikel;

      const existing = itemByNr.get(match.entry.nr);
      if (existing) {
        if (qty) existing.qty = qty;
        if (details.length > 0) existing.item = label;
      } else {
        const item: StructuredItem = {
          nr: match.entry.nr,
          cluster: match.entry.cluster,
          item: label,
          qty: qty ?? `– ${match.entry.einheit}`,
        };
        itemByNr.set(match.entry.nr, item);
        items.push(item);
      }
    }
  }

  return { items, painPoints };
}
