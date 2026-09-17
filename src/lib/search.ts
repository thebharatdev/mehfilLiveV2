// Phonetic transliteration and search engine for Hindi / Urdu / Hinglish
import type { Poem } from './mehfil';

const INDEPENDENT_VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri', 'ॠ': 'ri',
  'अं': 'an', 'अः': 'ah', 'ऑ': 'o', 'ॲ': 'a',
};

const MATRAS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri', 'ॄ': 'ri',
  'ॅ': 'e', 'ॉ': 'o',
};

const CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh',
  'स': 's', 'ह': 'h',
  // Nuqta consonants (single and decomposed)
  'क़': 'k', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'फ़': 'f',
  'ड़': 'd', 'ढ़': 'dh',
  'क़': 'k', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'फ़': 'f',
  'ड़': 'd', 'ढ़': 'dh',
  'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy', 'श्र': 'shr',
};

// Fast in-memory caches to prevent redundant regex executions
const translitWordCache = new Map<string, string>();
const canonWordCache = new Map<string, string>();
const skelWordCache = new Map<string, string>();
const MAX_CACHE_SIZE = 4000;

function checkCacheSize(map: Map<string, string>) {
  if (map.size > MAX_CACHE_SIZE) {
    map.clear();
  }
}

/**
 * Transliterates Devanagari text to Roman phonetic alphabet with inherent schwa handling.
 * E.g. 'एक पहाड़ और गिलहरी' -> 'ek pahaad aur gilahari'
 */
export function transliterateToRoman(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length < 30 && translitWordCache.has(trimmed)) {
    return translitWordCache.get(trimmed)!;
  }

  const norm = text.normalize('NFC');
  let result = '';
  let i = 0;

  while (i < norm.length) {
    // Check 2-character conjuncts/combinations first
    const two = norm.substring(i, i + 2);
    if (CONSONANTS[two] !== undefined) {
      const cons = CONSONANTS[two];
      i += 2;
      const next = norm[i];
      if (next === '्') {
        result += cons;
        i++;
      } else if (MATRAS[next] !== undefined) {
        result += cons + MATRAS[next];
        i++;
      } else if (next === 'ं' || next === 'ँ') {
        result += cons + 'n';
        i++;
      } else {
        // Inherent 'a' if not at the end of a word
        const isEndOfWord = !norm[i] || /[\s\p{P}]/u.test(norm[i]);
        result += cons + (isEndOfWord ? '' : 'a');
      }
      continue;
    }

    const one = norm[i];
    if (CONSONANTS[one] !== undefined) {
      const cons = CONSONANTS[one];
      i++;
      const next = norm[i];
      if (next === '्') {
        result += cons;
        i++;
      } else if (MATRAS[next] !== undefined) {
        result += cons + MATRAS[next];
        i++;
      } else if (next === 'ं' || next === 'ँ') {
        result += cons + 'n';
        i++;
      } else {
        const isEndOfWord = !norm[i] || /[\s\p{P}]/u.test(norm[i]);
        result += cons + (isEndOfWord ? '' : 'a');
      }
      continue;
    }

    if (INDEPENDENT_VOWELS[one] !== undefined) {
      result += INDEPENDENT_VOWELS[one];
      i++;
      continue;
    }

    if (MATRAS[one] !== undefined) {
      result += MATRAS[one];
      i++;
      continue;
    }

    if (one === 'ं' || one === 'ँ') {
      result += 'n';
      i++;
      continue;
    }

    if (one === 'ः') {
      result += 'h';
      i++;
      continue;
    }

    if (one === '्' || one === '़') {
      i++;
      continue;
    }

    result += one;
    i++;
  }

  const out = result.toLowerCase();
  if (trimmed.length < 30) {
    checkCacheSize(translitWordCache);
    translitWordCache.set(trimmed, out);
  }
  return out;
}

/**
 * Normalizes text to a canonical phonetic key for Hindi / Urdu / Hinglish search.
 * Equates variations such as 'ek pahad' <-> 'ek phad' <-> 'ek pahaad' <-> 'ek pahar' <-> 'एक पहाड़'.
 */
export function canonicalizePhonetic(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length < 30 && canonWordCache.has(trimmed)) {
    return canonWordCache.get(trimmed)!;
  }

  let s = text.toLowerCase();
  if (/[\u0900-\u097F]/.test(s)) {
    s = transliterateToRoman(s);
  }

  const out = s
    // Specific high-frequency Hinglish variations
    .replace(/\bp[aeiou]*h[aeiou]*d\b/g, 'pahad') // pahad, phad, pahaad
    .replace(/\bpa*haa+[dr]\b/g, 'pahad') // pahaad, pahaar
    .replace(/\br[aeiou]*h[aeiou]*t\b/g, 'rahat') // rahat, rhat
    .replace(/\ba+y+a+n+\b/g, 'ayan') // ayan, ayaan
    .replace(/\bi+q+b+a+l+\b/g, 'iqbal') // iqbal, ikbal
    .replace(/\bg+i+l+a*h+a*r+i+\b/g, 'gilhari') // gilhari, gilahari, gilehri
    .replace(/\bm+a*k+a*d+[aeiou]*\b/g, 'makda') // makda, makada
    // Standardize double/long vowels
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/ou/g, 'au')
    .replace(/ai/g, 'e')
    .replace(/ay/g, 'e')
    // Sound equivalences in Romanized Indic text
    .replace(/ph/g, 'f')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/bh/g, 'b')
    .replace(/ch/g, 'c')
    .replace(/jh/g, 'j')
    .replace(/sh/g, 's')
    .replace(/v/g, 'w')
    .replace(/z/g, 'j')
    .replace(/q/g, 'k')
    // Unstressed vowel before 'h' (e.g. bahar -> bhar, kahani -> khani)
    .replace(/([bcdfghjklmnpqrstvwxyz])[aeiou]+h/g, '$1h')
    // Deduplicate repeated consecutive consonants
    .replace(/([a-z])\1+/g, '$1')
    // Strip non-alphanumeric except whitespace
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  if (trimmed.length < 30) {
    checkCacheSize(canonWordCache);
    canonWordCache.set(trimmed, out);
  }
  return out;
}

/**
 * Returns consonant skeleton of a normalized string for schwa-free comparison.
 */
export function toConsonantSkeleton(str: string): string {
  if (!str) return '';
  if (str.length < 30 && skelWordCache.has(str)) {
    return skelWordCache.get(str)!;
  }
  const norm = canonicalizePhonetic(str);
  const out = norm.replace(/[aeiou\s]/g, '');
  if (str.length < 30) {
    checkCacheSize(skelWordCache);
    skelWordCache.set(str, out);
  }
  return out;
}

export interface ParsedWord {
  raw: string;
  norm: string;
  skel: string;
}

/**
 * Parses and tokenizes text into words with normalized and skeleton representations.
 */
export function parseSearchWords(text: string, maxWords = 100): ParsedWord[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const limit = Math.min(words.length, maxWords);
  const list: ParsedWord[] = [];

  for (let i = 0; i < limit; i++) {
    const raw = words[i].toLowerCase();
    const norm = canonicalizePhonetic(raw);
    const skel = toConsonantSkeleton(norm);
    list.push({ raw, norm, skel });
  }

  return list;
}

export interface IndexedPoem {
  poem: Poem;
  rawTitle: string;
  romanTitle: string;
  normTitle: string;
  parsedTitle: ParsedWord[];
  parsedAuthor: ParsedWord[];
  parsedTags: ParsedWord[];
  parsedBody: ParsedWord[];
  categoryNorm: string;
}

/**
 * Pre-indexes a poem once so searches run in under 1ms.
 */
export function indexPoem(p: Poem): IndexedPoem {
  const rawTitle = (p.title || '').toLowerCase();
  const romanTitle = transliterateToRoman(rawTitle);
  const normTitle = canonicalizePhonetic(rawTitle);

  const authorName = `${p.author?.firstName || ''} ${p.author?.lastName || ''}`.trim();
  const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : p.tags || '';

  return {
    poem: p,
    rawTitle,
    romanTitle,
    normTitle,
    parsedTitle: parseSearchWords(p.title || '', 30),
    parsedAuthor: parseSearchWords(authorName, 10),
    parsedTags: parseSearchWords(`${tagsStr} ${p.category || ''}`, 20),
    parsedBody: parseSearchWords(p.body || '', 80),
    categoryNorm: (p.category || '').toLowerCase().trim(),
  };
}

export function indexPoems(poems: Poem[]): IndexedPoem[] {
  return poems.map(indexPoem);
}

/**
 * Checks if target word matches query token.
 */
function wordMatchesToken(
  wRaw: string,
  wNorm: string,
  wSkel: string,
  tRaw: string,
  tNorm: string,
  tSkel: string
): boolean {
  // 1. Exact or prefix match on raw text
  if (wRaw === tRaw || (tRaw.length >= 3 && wRaw.startsWith(tRaw))) return true;

  // 2. Exact or prefix match on normalized phonetic key
  if (wNorm === tNorm || (tNorm.length >= 3 && wNorm.startsWith(tNorm))) return true;

  // 3. Substring match on normalized key if token is 4+ chars
  if (tNorm.length >= 4 && wNorm.includes(tNorm)) return true;

  // 4. Consonant skeleton match (e.g. 'gilhari' (glhr) vs 'gilahari' (glhr))
  if (tSkel.length >= 2 && wSkel.length >= 2) {
    if (wSkel === tSkel) return true;
    if (tSkel.length >= 3 && wSkel.startsWith(tSkel)) return true;
  }

  return false;
}

/**
 * Lightning-fast search across pre-indexed poems (<1ms for 400+ poems).
 */
export function searchIndexedPoems(
  index: IndexedPoem[],
  query: string
): { poem: Poem; score: number }[] {
  const q = query.trim();
  if (!q) {
    return index.map((item) => ({ poem: item.poem, score: 1 }));
  }

  const rawTokens = q.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) {
    return index.map((item) => ({ poem: item.poem, score: 1 }));
  }

  const parsedTokens: ParsedWord[] = rawTokens.map((t) => {
    const raw = t.toLowerCase();
    const norm = canonicalizePhonetic(raw);
    const skel = toConsonantSkeleton(norm);
    return { raw, norm, skel };
  });

  const qLower = q.toLowerCase();
  const qNorm = canonicalizePhonetic(q);

  const scoredResults: { poem: Poem; score: number }[] = [];

  for (let i = 0; i < index.length; i++) {
    const item = index[i];
    let totalScore = 0;
    let matchesAllTokens = true;

    for (let j = 0; j < parsedTokens.length; j++) {
      const t = parsedTokens[j];
      let tokenScore = 0;

      // 1. Title match (highest weight)
      for (let k = 0; k < item.parsedTitle.length; k++) {
        const pw = item.parsedTitle[k];
        if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
          tokenScore = Math.max(tokenScore, 100);
          break;
        }
      }

      // 2. Author match
      if (tokenScore < 100) {
        for (let k = 0; k < item.parsedAuthor.length; k++) {
          const pw = item.parsedAuthor[k];
          if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
            tokenScore = Math.max(tokenScore, 70);
            break;
          }
        }
      }

      // 3. Tags / Category match
      if (tokenScore < 70) {
        for (let k = 0; k < item.parsedTags.length; k++) {
          const pw = item.parsedTags[k];
          if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
            tokenScore = Math.max(tokenScore, 50);
            break;
          }
        }
      }

      // 4. Body match
      if (tokenScore < 50 && (t.raw.length >= 3 || t.norm.length >= 3)) {
        for (let k = 0; k < item.parsedBody.length; k++) {
          const pw = item.parsedBody[k];
          if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
            tokenScore = Math.max(tokenScore, 20);
            break;
          }
        }
      }

      if (tokenScore === 0) {
        matchesAllTokens = false;
        break;
      }

      totalScore += tokenScore;
    }

    if (!matchesAllTokens) {
      continue;
    }

    // Exact or phrase substring bonus
    if (
      item.rawTitle.includes(qLower) ||
      item.romanTitle.includes(qLower) ||
      (qNorm && item.normTitle.includes(qNorm))
    ) {
      totalScore += 150;
    }

    scoredResults.push({ poem: item.poem, score: totalScore });
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults;
}

export interface SearchableFields {
  title?: string;
  body?: string;
  author?: string;
  category?: string;
  tags?: string[] | string;
}

/**
 * Scores how well a poem/record matches the search query.
 * Fallback for unindexed records.
 */
export function scoreSearchMatch(query: string, fields: SearchableFields): number {
  const q = query.trim();
  if (!q) return 1;

  const rawTokens = q.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return 1;

  const parsedTokens = rawTokens.map((t) => {
    const raw = t.toLowerCase();
    const norm = canonicalizePhonetic(raw);
    const skel = toConsonantSkeleton(norm);
    return { raw, norm, skel };
  });

  const parsedTitle = parseSearchWords(fields.title || '', 30);
  const parsedAuthor = parseSearchWords(fields.author || '', 10);
  const tagsStr = Array.isArray(fields.tags) ? fields.tags.join(' ') : fields.tags || '';
  const parsedTags = parseSearchWords(`${tagsStr} ${fields.category || ''}`, 20);
  const parsedBody = parseSearchWords(fields.body || '', 60);

  let totalScore = 0;

  for (const t of parsedTokens) {
    let tokenScore = 0;

    for (const pw of parsedTitle) {
      if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
        tokenScore = Math.max(tokenScore, 100);
        break;
      }
    }

    if (tokenScore < 100) {
      for (const pw of parsedAuthor) {
        if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
          tokenScore = Math.max(tokenScore, 70);
          break;
        }
      }
    }

    if (tokenScore < 70) {
      for (const pw of parsedTags) {
        if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
          tokenScore = Math.max(tokenScore, 50);
          break;
        }
      }
    }

    if (tokenScore < 50 && (t.raw.length >= 3 || t.norm.length >= 3)) {
      for (const pw of parsedBody) {
        if (wordMatchesToken(pw.raw, pw.norm, pw.skel, t.raw, t.norm, t.skel)) {
          tokenScore = Math.max(tokenScore, 20);
          break;
        }
      }
    }

    if (tokenScore === 0) {
      return 0;
    }

    totalScore += tokenScore;
  }

  const rawTitle = (fields.title || '').toLowerCase();
  const romanTitle = transliterateToRoman(rawTitle);
  const normTitle = canonicalizePhonetic(rawTitle);
  const normQuery = canonicalizePhonetic(q);
  const lowerQuery = q.toLowerCase();

  if (rawTitle.includes(lowerQuery) || romanTitle.includes(lowerQuery) || normTitle.includes(normQuery)) {
    totalScore += 150;
  }

  return totalScore;
}

/**
 * Checks if search query matches any target fields with phonetic and transliteration tolerance.
 */
export function matchesSearch(query: string, ...fields: string[]): boolean {
  const q = query.trim();
  if (!q) return true;

  const rawTokens = q.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return true;

  const combined = fields.filter(Boolean).join(' ');
  if (!combined.trim()) return false;

  const targetLower = combined.toLowerCase();
  const targetRoman = transliterateToRoman(combined);
  const targetNorm = canonicalizePhonetic(combined);

  // Quick phrase check
  const qLower = q.toLowerCase();
  const qNorm = canonicalizePhonetic(q);
  if (
    targetLower.includes(qLower) ||
    targetRoman.includes(qLower) ||
    (qNorm && targetNorm.includes(qNorm))
  ) {
    return true;
  }

  const targetWords = parseSearchWords(combined, 100);

  return rawTokens.every((token) => {
    const tRaw = token.toLowerCase();
    const tNorm = canonicalizePhonetic(tRaw);
    const tSkel = toConsonantSkeleton(tNorm);

    // Check direct substring
    if (targetLower.includes(tRaw) || targetRoman.includes(tRaw) || (tNorm && targetNorm.includes(tNorm))) {
      return true;
    }

    for (const w of targetWords) {
      if (wordMatchesToken(w.raw, w.norm, w.skel, tRaw, tNorm, tSkel)) {
        return true;
      }
    }

    return false;
  });
}

