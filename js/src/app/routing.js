// Hash-route parser / serialiser for the unified Human Language SPA.
//
// The hash carries a `mode` key and any number of mode-specific keys, e.g.:
//   #mode=entity&id=Q35120
//   #mode=alphabet&letter=A
//   #mode=dictionary&word=cat&lang=en&ipa=1
//
// The pure helpers `parseHash` and `serializeHash` are imported by app.html
// and by the redirect shells (entities.html, properties.html,
// transformation/index.html) so that all parsing lives in one place.

export const MODES = [
  'alphabet',
  'dictionary',
  'ontology',
  'entity',
  'property',
  'transformer',
  'generation',
];

export const DEFAULT_MODE = 'entity';

/**
 * Parse a hash string (with or without leading `#`) into a `{ mode, params }`.
 *
 * Handles both the new `#mode=…&…` form and legacy hashes:
 *   - `#Q35120`        → { mode: 'entity',   params: { id: 'Q35120' } }
 *   - `#P31`           → { mode: 'property', params: { id: 'P31'    } }
 *
 * Unknown modes fall back to DEFAULT_MODE with an empty params object.
 *
 * @param {string} hash - The hash string, e.g. window.location.hash.
 * @returns {{ mode: string, params: Record<string, string> }}
 */
export function parseHash(hash) {
  if (!hash) return { mode: DEFAULT_MODE, params: {} };
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!cleaned) return { mode: DEFAULT_MODE, params: {} };

  // Legacy: bare Q-id or P-id.
  if (/^Q\d+$/i.test(cleaned)) return { mode: 'entity', params: { id: cleaned.toUpperCase() } };
  if (/^P\d+$/i.test(cleaned)) return { mode: 'property', params: { id: cleaned.toUpperCase() } };

  const params = {};
  for (const pair of cleaned.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const key = eq === -1 ? pair : pair.slice(0, eq);
    const value = eq === -1 ? '' : decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
    if (!key) continue;
    params[decodeURIComponent(key)] = value;
  }
  const mode = MODES.includes(params.mode) ? params.mode : DEFAULT_MODE;
  delete params.mode;
  return { mode, params };
}

/**
 * Serialise a `{ mode, params }` object back into a `#mode=…&…` hash.
 *
 * The output always begins with `#`. Params with empty / nullish values are
 * omitted so the URL stays clean.
 *
 * @param {{ mode: string, params?: Record<string, string|number|boolean> }} input
 * @returns {string} - the hash string, starting with `#`.
 */
export function serializeHash({ mode, params = {} }) {
  const pieces = [`mode=${encodeURIComponent(mode)}`];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    pieces.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return `#${pieces.join('&')}`;
}

/**
 * Subscribe to hash changes. The listener is called immediately with the
 * current hash and again every time `hashchange` fires.
 *
 * @param {(parsed: { mode: string, params: Record<string,string> }) => void} listener
 * @returns {() => void} - unsubscribe
 */
export function subscribeToHash(listener) {
  const fire = () => listener(parseHash(window.location.hash));
  fire();
  window.addEventListener('hashchange', fire);
  return () => window.removeEventListener('hashchange', fire);
}

/**
 * Navigate to a new mode/params combination by mutating window.location.hash.
 */
export function navigate(mode, params = {}) {
  const newHash = serializeHash({ mode, params });
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
}
