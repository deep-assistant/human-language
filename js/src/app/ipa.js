// IPA conversion service for the unified Human Language SPA.
//
// Resolves IPA (International Phonetic Alphabet) values for arbitrary text,
// layering multiple backends so the page can render *any* string in IPA:
//
//   1. P898 statement on the Wikidata entity (when an entityId is supplied).
//   2. Free Dictionary API per token (https://dictionaryapi.dev/).
//   3. Wiktionary REST API per token (en.wiktionary.org / <lang>.wiktionary.org).
//
// Successful lookups are cached in-memory (per page session) under a small
// LRU-ish map so flipping the toggle on and off is instant.

const memoryCache = new Map(); // key -> string | null
const CACHE_LIMIT = 2000;

function cacheGet(key) {
  if (!memoryCache.has(key)) return undefined;
  const value = memoryCache.get(key);
  // Refresh recency.
  memoryCache.delete(key);
  memoryCache.set(key, value);
  return value;
}

function cacheSet(key, value) {
  if (memoryCache.has(key)) memoryCache.delete(key);
  memoryCache.set(key, value);
  while (memoryCache.size > CACHE_LIMIT) {
    const oldest = memoryCache.keys().next().value;
    memoryCache.delete(oldest);
  }
}

/**
 * Fetch JSON with a small timeout so a slow backend cannot block the page.
 */
async function fetchJson(url, { timeoutMs = 5000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: ctrl.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract an IPA value from a Wiktionary REST API response.
 * Returns the first `phonetics[*].text` field that looks like /…/ or [...].
 */
function pickPhoneticFromFreeDict(json) {
  if (!Array.isArray(json) || !json.length) return null;
  for (const entry of json) {
    if (entry?.phonetic && /^[/\[].+[/\]]$/.test(entry.phonetic)) return entry.phonetic;
    if (Array.isArray(entry?.phonetics)) {
      for (const ph of entry.phonetics) {
        if (ph?.text && /^[/\[].+[/\]]$/.test(ph.text)) return ph.text;
      }
    }
  }
  return null;
}

/**
 * Scan a Wiktionary REST definition response for the first /.../ token.
 */
function pickPhoneticFromWiktionary(json) {
  if (!json || typeof json !== 'object') return null;
  const match = JSON.stringify(json).match(/\/[^/\s]{1,40}\//);
  return match ? match[0] : null;
}

async function ipaFromFreeDict(token, lang) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(lang || 'en')}/${encodeURIComponent(token)}`;
  return pickPhoneticFromFreeDict(await fetchJson(url));
}

async function ipaFromWiktionary(token, lang) {
  const host = `${encodeURIComponent(lang || 'en')}.wiktionary.org`;
  const url = `https://${host}/api/rest_v1/page/definition/${encodeURIComponent(token)}`;
  return pickPhoneticFromWiktionary(await fetchJson(url));
}

/**
 * Try every backend in order and return the first non-null result.
 */
async function ipaForToken(token, lang) {
  const cacheKey = `tok:${(lang || 'en').toLowerCase()}:${token.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return cached;

  let ipa = await ipaFromFreeDict(token, lang);
  if (!ipa) ipa = await ipaFromWiktionary(token, lang);
  cacheSet(cacheKey, ipa);
  return ipa;
}

/**
 * Convert an arbitrary string to IPA token-by-token.
 *
 * Non-word characters (whitespace, punctuation) are preserved verbatim so the
 * output remains readable. Tokens for which no IPA is found are wrapped in
 * `[?]` so the caller can see the gap.
 *
 * @param {string} text - The input text.
 * @param {string} [lang='en'] - BCP-47 base language.
 * @returns {Promise<string>} - The IPA rendering.
 */
export async function toIpa(text, lang = 'en') {
  if (!text || typeof text !== 'string') return '';
  const tokens = text.split(/(\s+|[^\p{L}\p{N}'-]+)/u);
  const out = [];
  for (const piece of tokens) {
    if (!piece) continue;
    // Whitespace or punctuation passes through.
    if (!/[\p{L}\p{N}]/u.test(piece)) {
      out.push(piece);
      continue;
    }
    const ipa = await ipaForToken(piece, lang);
    out.push(ipa || `[?]${piece}`);
  }
  return out.join('');
}

/**
 * Convert a Wikidata entity to IPA, preferring its P898 (IPA transcription)
 * claim if present, falling back to per-token translation of the label.
 *
 * @param {object} entity - A full Wikidata entity object as returned by `wbgetentities`.
 * @param {string} lang - Display language.
 * @returns {Promise<string>}
 */
export async function toIpaForEntity(entity, lang = 'en') {
  const p898 = entity?.claims?.P898;
  if (Array.isArray(p898)) {
    for (const claim of p898) {
      const value = claim?.mainsnak?.datavalue?.value?.text || claim?.mainsnak?.datavalue?.value;
      if (typeof value === 'string' && value) return value.startsWith('/') ? value : `/${value}/`;
    }
  }
  const label = entity?.labels?.[lang]?.value || entity?.labels?.en?.value || '';
  return label ? toIpa(label, lang) : '';
}

export default { toIpa, toIpaForEntity };
