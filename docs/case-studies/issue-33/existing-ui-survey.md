# Existing UI survey

Inventory of every UI page, component, and shared module currently in the repository, with the patterns each one introduces. This survey is the basis for the consolidation work planned in `solution-plans.md`.

## Pages (HTML)

| File | Purpose | Theme handling | Language handling | Layout / styling | Reuses |
|---|---|---|---|---|---|
| `index.html` | Demo gallery / landing page | Pure CSS `prefers-color-scheme`, no JS toggle | None | Custom palette (`--bg`, `--card`, `--accent`); cards grid | none |
| `entities.html` | Wikidata entity viewer | `localStorage` + JS toggle, `data-theme` attribute, custom CSS vars (`--background`, `--neon`, `--neon-selected`, `--neon-shadow`) | `navigator.languages` + `localStorage`; flag-emoji switcher pinned at bottom | Orbitron font; neon dark palette / magenta light palette; max-width 800px wrapper | `settings.js`, `wikidata-api-browser.js`, `statements.jsx`, `loading.jsx` |
| `properties.html` | Wikidata property viewer | Same as `entities.html` | Same as `entities.html` | Same as `entities.html`; watermark says "property" | Same as `entities.html` |
| `transformation/index.html` | Text → Q/P transformer | None (no toggle) | None | Cards grid, blue/orange/red badges, custom `--primary-color` palette | `text-to-qp-transformer.js` |
| `transformation/test-ngram.html` | N-gram test page | None | None | Light-grey card list | `text-to-qp-transformer.js` |
| `search-demo.html` | Wikidata search demo | None | None | Blue gradient header, neutral palette | `wikidata-api-browser.js` |
| `cache-demo.html` | Cache layer demo | None | None | Blue buttons, light grey background | `wikidata-api-browser.js`, `unified-cache-browser.js` |
| `browser-cache-test.html` | IndexedDB stress test | None | None | Monospace test harness | `wikidata-api-browser.js`, `unified-cache-browser.js` |
| `run-tests.html` | Browser test runner | None | None | Terminal-style green-on-black | `transformation/text-transformer-test.js` |

**Observation:** Only `entities.html` and `properties.html` carry the project's "real" visual identity (Orbitron + neon). Every other demo invents its own palette. The unified SPA adopts the entities/properties palette and theme system across all modes.

## React / JSX components

| File | Exported globals | Theme-aware? | Notes |
|---|---|---|---|
| `statements.jsx` | `window.StatementComponents.{Statement, StatementsList, StatementsSection}` | Yes (uses `--neon`) | Renders Wikidata claims; recursively links Q/P ids; uses locale-specific quotes from `window.getQuotesForLanguage` (set by `settings.js`) |
| `loading.jsx` | `window.LoadingComponents.LoadingComponent` | Yes (uses `--background`, `--neon`, `--neon-shadow`) | Full-screen overlay with pulse animation |

Both files do `if (typeof React === 'undefined') console.error(...)`. Both are loaded via `<script type="text/babel" src="…">` *after* the React imports have been written to `window`.

## Shared modules (JS)

### `settings.js` — exports

- `STORAGE_KEYS = { THEME, LANGUAGE }`
- `saveToLocalStorage(key, value)`, `loadFromLocalStorage(key, defaultValue)`
- `localeQuotes = { en: { open: '"', close: '"' }, de: …, fr: …, … }` plus `default`
- `getQuotesForLanguage(langCode)` — drops region suffix, falls back to default
- `flagMap` — ≈250 BCP-47-ish codes → flag emoji

The unified SPA uses this module directly; no re-implementation.

### `wikidata-api-browser.js` — exports

- `WikidataAPIClient` class — `fetchEntity`, `fetchEntities`, `fetchLabels`, `fetchProperty`
- `WikidataSearchUtility` — `searchExactMatch`, `searchFuzzy`, `disambiguateSearch`, `searchWithContext`
- Singletons re-exported: `client`, `cache`, `processor`, `labelManager`, `searchUtility`
- `BrowserCacheFactory.create(type, opts)` — `'indexeddb'` or `'none'`, used inside the client.

The Node-only counterpart (`wikidata-api.js`) is excluded from GitHub Pages — see `_config.yml` and `docs/case-studies/issue-31` for the regression that motivated that exclusion.

### `unified-cache-browser.js`

`BrowserCacheFactory` — wraps IndexedDB with an in-memory fallback. All cache reads/writes go through this module.

### `transformation/text-to-qp-transformer.js` — exports

- `TextToQPTransformer` class — `transform(text, options)`
  - Options: `maxCandidates`, `includeLabels`, `searchLimit`, `preferProperties`, `maxNgramSize`
  - Returns `{ original, tokens, sequence, formatted, alternatives, … }`
- Dynamically imports either `wikidata-api.js` or `wikidata-api-browser.js` based on `typeof window`.

## Theme tokens currently in use

```css
:root {
  --background: #121212;
  --text: #E0E0E0;
  --neon: #00FF00;
  --neon-selected: #00FFFF;
  --header-bg: #222;
  --description-text: #A0A0A0;
  --watermark-color: #E0E0E0;
  --neon-shadow: rgba(0, 255, 0, 0.4);
  --neon-shadow-intense: rgba(0, 255, 0, 0.6);
}
[data-theme="light"] {
  --background: #FFFFFF;
  --text: #333333;
  --neon: #FF00FF;
  --neon-selected: #FF007F;
  --header-bg: #F0F0F0;
  --description-text: #666666;
  --watermark-color: #333333;
  --neon-shadow: rgba(255, 0, 255, 0.4);
  --neon-shadow-intense: rgba(255, 0, 255, 0.6);
}
```

The unified SPA promotes these tokens to a single shared stylesheet (`app.css`) and adds a few new ones:

- `--accent-bg` — translucent neon background (used by IPA toggles, mode tabs)
- `--rule` — border colour for separators
- `--badge-entity`, `--badge-property`, `--badge-ambiguous` — replace the inline blue/orange/red literals in `transformation/index.html`
- `--mode-tab-bg`, `--mode-tab-bg-active` — for the mode switcher

## Patterns that survive into the unified SPA

1. **CSS custom-property theming** (from `entities.html`).
2. **Hash-based routing** (from `entities.html`'s `hashchange` listener) — generalised to `#mode=…&…` so that all six modes can share one URL space.
3. **`navigator.languages` → preferred language list → flag-emoji switcher** (from `entities.html`).
4. **Babel-standalone JSX with React 19 via esm.sh** (consistent across `entities.html` / `properties.html`).
5. **Cache-first Wikidata fetches** (from `entities.html`'s `cacheManager.getFromCache` / `isCachedDataComplete` pattern).
6. **Locale-specific quotes** (from `settings.js`).

## Patterns that are removed in the unified SPA

- Per-demo bespoke palettes (search-demo's blue gradient, cache-demo's blue buttons, run-tests' terminal green).
- Duplicate "load React → write to window" boilerplate in every HTML page (collapses to one bootstrap in `app.html`).
- The "page reload" mode switching of today's separate `entities.html` / `properties.html` / `search-demo.html` (now hash-routed within `app.html`).
