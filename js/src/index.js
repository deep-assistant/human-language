// Public entry point for the `human-language` npm package.
//
// Re-exports the core (non-UI) modules of the project as a stable,
// versioned surface. UI modules (`*.jsx`, `app/modes/*`, `app/shell.jsx`,
// `statements.jsx`, `loading.jsx`, `app/tests-panel.jsx`) are
// intentionally not re-exported — they remain implementation details of
// the SPA at `app.html` and are still in the published tarball so the
// SPA continues to work when this package is consumed via a CDN.
//
// See docs/case-studies/issue-37/architecture.md for the full surface
// map.

export {
  WikidataAPIClient,
  WikidataSearchUtility,
  WikidataDataProcessor,
  WikidataLabelManager,
  WikidataCacheManager,
} from './wikidata-api-browser.js';

export {
  CacheInterface,
  IndexedDBCacheAdapter,
  NoCacheAdapter,
  BrowserCacheFactory,
} from './unified-cache-browser.js';

export { TextToQPTransformer } from './transformation/text-to-qp-transformer.js';

export { QPRenderer } from './generation/qp-to-text.js';

export {
  CONSTRUCTORS,
  UN6_LANGUAGES,
  LANGUAGE_NAMES,
  buildConstructor,
  validateConstructor,
  englishIndefiniteArticle,
} from './generation/constructors.js';

export {
  formatSequenceAsLino,
  formatTransformResultAsLino,
} from './transformation/lino-format.js';

export {
  STORAGE_KEYS,
  saveToLocalStorage,
  loadFromLocalStorage,
  localeQuotes,
  getQuotesForLanguage,
  flagMap,
} from './settings.js';

export {
  MODES,
  DEFAULT_MODE,
  parseHash,
  serializeHash,
} from './app/routing.js';

// Re-exports that may be useful for callers in a browser context where
// `window` is defined.
export { toIpa, toIpaForEntity } from './app/ipa.js';

export { resolveConfig, CONFIG_DEFAULTS } from './config.js';

export { version, name } from './version.js';
