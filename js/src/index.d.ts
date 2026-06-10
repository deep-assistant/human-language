// Hand-written TypeScript declarations for the `human-language` package.
//
// The source is plain JavaScript with JSDoc; these declarations are
// kept narrow on purpose. Each surface mirrors the runtime shape that
// `js/src/index.js` actually re-exports. Generated declarations may
// replace this file in a follow-up issue once we adopt `tsc --emit
// declarations` in CI.

/** Resolved configuration shape from `resolveConfig`. */
export interface HumanLanguageConfig {
  port: number;
  host: string;
  cacheDir: string;
  cacheType: 'auto' | 'file' | 'indexeddb' | 'none' | string;
  userAgent: string;
  wikidataApiBase: string;
  _: string[];
}

export interface ResolveConfigOptions {
  argv?: string[];
  env?: Record<string, string | undefined>;
  defaults?: Partial<Omit<HumanLanguageConfig, '_'>>;
}

export function resolveConfig(opts?: ResolveConfigOptions): HumanLanguageConfig;
export const CONFIG_DEFAULTS: Readonly<Omit<HumanLanguageConfig, '_'>>;

export const name: string;
export const version: string;

// ---------------------------------------------------------------------------
// Transformer
// ---------------------------------------------------------------------------

export interface TransformOptions {
  maxCandidates?: number;
  includeLabels?: boolean;
  searchLimit?: number;
  preferProperties?: boolean;
  maxNgramSize?: number;
}

export interface TransformResult {
  original: string;
  tokens: string[];
  sequence: Array<string | { type: string; alternatives: Array<{ id: string; description?: string }> }>;
  formatted: string;
  alternatives: unknown[];
}

export class TextToQPTransformer {
  constructor();
  transform(text: string, options?: TransformOptions): Promise<TransformResult>;
  transformWithContext(
    text: string,
    context?: Record<string, string>,
    options?: TransformOptions,
  ): Promise<TransformResult>;
}

export function formatSequenceAsLino(sequence: TransformResult['sequence']): string;
export function formatTransformResultAsLino(result: TransformResult): string;

// ---------------------------------------------------------------------------
// Wikidata API
// ---------------------------------------------------------------------------

export class WikidataAPIClient {
  constructor(cacheType?: string, cacheOptions?: Record<string, unknown>);
  fetchEntity(id: string, languages?: string): Promise<unknown>;
  fetchEntities(ids: string | string[], props?: string, languages?: string): Promise<unknown>;
  fetchProperty(id: string, languages?: string): Promise<unknown>;
  fetchLabels(ids: string[], languages?: string): Promise<unknown>;
  searchExactMatch(query: string, languages?: string, limit?: number, type?: string): Promise<unknown>;
  searchFuzzy(query: string, languages?: string, limit?: number, type?: string): Promise<unknown>;
  setCacheType(cacheType: string, cacheOptions?: Record<string, unknown>): void;
}

export class WikidataSearchUtility {
  constructor(client: WikidataAPIClient, cache: unknown, processor: unknown);
  disambiguateSearch(query: string, languages?: string, limit?: number, type?: string): Promise<unknown>;
}

export class WikidataDataProcessor { constructor(); }
export class WikidataLabelManager { constructor(client: WikidataAPIClient, cache: unknown, processor: unknown); }
export class WikidataCacheManager { constructor(); }

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

export class CacheInterface { constructor(); }
export class IndexedDBCacheAdapter { constructor(dbName?: string, version?: number); }
export class NoCacheAdapter { constructor(); }
export class BrowserCacheFactory {
  static create(type: string, options?: Record<string, unknown>): CacheInterface;
}

// ---------------------------------------------------------------------------
// Settings / locale helpers
// ---------------------------------------------------------------------------

export const STORAGE_KEYS: Record<string, string>;
export const localeQuotes: Record<string, { open: string; close: string }>;
export const flagMap: Record<string, string>;

export function saveToLocalStorage(key: string, value: unknown): void;
export function loadFromLocalStorage<T = unknown>(key: string, fallback?: T): T;
export function getQuotesForLanguage(lang: string): { open: string; close: string };

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export const MODES: readonly string[];
export const DEFAULT_MODE: string;
export function parseHash(hash: string): { mode: string; params: Record<string, string> };
export function serializeHash(parsed: { mode: string; params?: Record<string, string> }): string;

// ---------------------------------------------------------------------------
// IPA (browser-leaning, available under Node when fetch exists)
// ---------------------------------------------------------------------------

export function toIpa(text: string, lang?: string): Promise<string>;
export function toIpaForEntity(entity: unknown, lang?: string): Promise<string>;
