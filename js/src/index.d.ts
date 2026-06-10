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
  /** Collapse adjacent duplicate ids in the sequence (default true). */
  dedupe?: boolean;
}

export type QuestionType =
  | 'entity' | 'thing' | 'time' | 'place' | 'reason' | 'manner' | 'quantity' | 'polar';

export interface QuestionInfo {
  isQuestion: boolean;
  word: string | null;
  type: QuestionType | null;
}

export interface Quantity {
  value: number;
  unit: string | null;
  raw: string;
}

export interface Modifiers {
  negated: boolean;
  tense: Tense;
}

export interface TransformResult {
  original: string;
  tokens: string[];
  sequence: Array<string | { type: string; alternatives: Array<{ id: string; description?: string }> }>;
  formatted: string;
  alternatives: unknown[];
  modifiers?: Modifiers;
  question?: QuestionInfo;
  quantities?: Quantity[];
  constructor?: Constructor | null;
}

export class TextToQPTransformer {
  constructor();
  transform(text: string, options?: TransformOptions): Promise<TransformResult>;
  transformToConstructor(text: string, options?: TransformOptions): Promise<TransformResult>;
  transformWithContext(
    text: string,
    context?: Record<string, string>,
    options?: TransformOptions,
  ): Promise<TransformResult>;
  extractModifiers(text: string): Modifiers;
  detectQuestion(text: string): QuestionInfo;
  extractQuantities(text: string): Quantity[];
  dedupeSequence(sequence: TransformResult['sequence']): TransformResult['sequence'];
  toConstructor(result: TransformResult): Constructor | null;
}

export function formatSequenceAsLino(sequence: TransformResult['sequence']): string;
export function formatTransformResultAsLino(result: TransformResult): string;

// ---------------------------------------------------------------------------
// Generation (reverse: Q/P -> text)
// ---------------------------------------------------------------------------

export type Tense = 'past' | 'present' | 'future';
export type Gender = 'masculine' | 'feminine' | 'm' | 'f';

/** A typed, role-labelled constructor consumed by the renderer. */
export interface Constructor {
  type: string;
  subject?: string;
  predicate?: string | null;
  object?: string | null;
  value?: string | number | null;
  unit?: string | null;
  negated?: boolean;
  tense?: Tense;
  /** Grammatical gender of the object noun (drives Romance article agreement). */
  gender?: Gender;
  [role: string]: unknown;
}

export interface QPRendererOptions {
  labelProvider?: (ids: string[], lang: string) => Promise<Record<string, string>>;
  apiClient?: WikidataAPIClient;
}

export class QPRenderer {
  constructor(options?: QPRendererOptions);
  readonly languages: string[];
  readonly constructorTypes: string[];
  renderWithLabels(constructor: Constructor, labels: Record<string, string>, lang?: string): string;
  render(constructor: Constructor, lang?: string): Promise<string>;
  renderAll(constructor: Constructor, langs?: string[]): Promise<Record<string, string>>;
}

export const CONSTRUCTORS: Record<string, { roles: string[]; description: string; templates: Record<string, unknown> }>;
export const UN6_LANGUAGES: readonly string[];
export const LANGUAGE_NAMES: Record<string, string>;
export function buildConstructor(type: string, roles?: Record<string, unknown>, modifiers?: Record<string, unknown>): Constructor;
export function validateConstructor(constructor: Constructor): boolean;
export function englishIndefiniteArticle(word: string): 'a' | 'an';
export function romanceIndefiniteArticle(lang: string, gender?: Gender): string;

// ---------------------------------------------------------------------------
// Wikidata API
// ---------------------------------------------------------------------------

export class WikidataAPIClient {
  constructor(cacheType?: string, cacheOptions?: Record<string, unknown>);
  fetchEntity(id: string, languages?: string): Promise<unknown>;
  fetchEntities(ids: string | string[], props?: string, languages?: string): Promise<unknown>;
  fetchProperty(id: string, languages?: string): Promise<unknown>;
  fetchLabels(ids: string[], languages?: string): Promise<unknown>;
  getLabels(ids: string[] | string, language?: string): Promise<Record<string, string>>;
  searchLexemes(term: string, language?: string, limit?: number): Promise<Array<{ id: string; label: string; description: string }>>;
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
