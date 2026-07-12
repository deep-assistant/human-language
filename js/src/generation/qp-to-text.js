// Q/P → Text renderer (reverse generation).
//
// This is the missing counterpart of the Text → Q/P transformer. The
// transformer does *analysis* (text → meaning); this does *generation*
// (meaning → text), closing the round-trip the README vision depends on
// ("Zero-Cost Translation", "Language of Meaning"). It mirrors Abstract
// Wikipedia's renderers: a typed constructor goes in, a sentence in any of
// the six official UN languages comes out.
//
// The renderer is deliberately small and grammar-light — one templatic
// renderer per constructor-per-language, plus English a/an phonotactics as
// the first grammatical feature. It grows by adding constructors and
// templates, exactly the way Abstract Wikipedia grew its grammar.

import {
  CONSTRUCTORS,
  UN6_LANGUAGES,
  LANGUAGE_NAMES,
  validateConstructor,
  fillTemplate,
} from './constructors.js';

// Pick the right Wikidata API at runtime: the browser version avoids Node's
// `fs`/`path` imports that the file-cache backend pulls in. Mirrors the
// runtime selection in `transformation/text-to-qp-transformer.js`.
let WikidataAPIClient;
async function loadApiClient() {
  if (WikidataAPIClient) return WikidataAPIClient;
  if (typeof window !== 'undefined') {
    ({ WikidataAPIClient } = await import('../wikidata-api-browser.js'));
  } else {
    ({ WikidataAPIClient } = await import('../wikidata-api.js'));
  }
  return WikidataAPIClient;
}

/**
 * Renders typed Q/P constructors into natural-language sentences.
 */
class QPRenderer {
  /**
   * @param {Object} [options]
   * @param {Function} [options.labelProvider] - async `(ids, lang) => { id: label }`.
   *   When supplied, the renderer never touches the network — ideal for
   *   tests and offline use.
   * @param {Object} [options.apiClient] - A pre-built Wikidata client with a
   *   `getLabels(ids, lang)` method. Defaults to lazily constructing one.
   */
  constructor(options = {}) {
    this.labelProvider = options.labelProvider || null;
    this.apiClient = options.apiClient || null;
  }

  /** Languages this renderer can currently target. */
  get languages() {
    return [...UN6_LANGUAGES];
  }

  /** Constructor types this renderer knows how to render. */
  get constructorTypes() {
    return Object.keys(CONSTRUCTORS);
  }

  async _client() {
    if (this.apiClient) return this.apiClient;
    const Client = await loadApiClient();
    this.apiClient = new Client();
    return this.apiClient;
  }

  async _resolveLabels(ids, lang) {
    if (this.labelProvider) {
      return await this.labelProvider(ids, lang);
    }
    const client = await this._client();
    return await client.getLabels(ids, lang);
  }

  /**
   * Render a constructor into text from an already-resolved `{ id: label }`
   * map. Pure and synchronous — no network. Use this when you have labels
   * in hand (e.g. tests, batch pipelines).
   *
   * @param {Object} constructor - Typed constructor
   * @param {Object} labels - Map of `{ id: label }`
   * @param {string} [lang='en'] - Target language code
   * @returns {string}
   */
  renderWithLabels(constructor, labels, lang = 'en') {
    validateConstructor(constructor);
    const spec = CONSTRUCTORS[constructor.type];
    const template = spec.templates[lang];
    if (!template) {
      throw new Error(`No "${lang}" renderer for constructor "${constructor.type}"`);
    }
    return fillTemplate(spec, template, constructor, labels || {});
  }

  /**
   * Render a constructor into text in one language, resolving labels via
   * the label provider / Wikidata client as needed.
   *
   * @param {Object} constructor - Typed constructor
   * @param {string} [lang='en'] - Target language code
   * @returns {Promise<string>}
   */
  async render(constructor, lang = 'en') {
    validateConstructor(constructor);
    const spec = CONSTRUCTORS[constructor.type];
    const ids = spec.roles
      .map((role) => constructor[role])
      .filter((value) => typeof value === 'string' && /^[QPL]\d+$/.test(value));
    const labels = ids.length ? await this._resolveLabels(ids, lang) : {};
    return this.renderWithLabels(constructor, labels, lang);
  }

  /**
   * Render a constructor across multiple languages. Labels are fetched
   * per-language (Wikidata labels differ by language), which is exactly the
   * multi-language render Abstract Wikipedia demonstrates with the UN 6 set.
   *
   * @param {Object} constructor - Typed constructor
   * @param {Array<string>} [langs] - Languages to render (default: UN 6)
   * @returns {Promise<Object>} - Map of `{ lang: sentence }`
   */
  async renderAll(constructor, langs = UN6_LANGUAGES) {
    const out = {};
    for (const lang of langs) {
      out[lang] = await this.render(constructor, lang);
    }
    return out;
  }
}

export { QPRenderer, UN6_LANGUAGES, LANGUAGE_NAMES, CONSTRUCTORS };
export default QPRenderer;
