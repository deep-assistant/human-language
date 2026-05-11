# Known components / libraries / data sources

Catalogue of components, libraries, and data sources that already solve a slice of what each mode needs. Inclusion in this list is not the same as a dependency declaration — most are referenced for future iteration, not bundled into this PR.

## Alphabet mode

| Component | What it provides | Used in this PR? |
|---|---|---|
| Wikidata Q-ids for letters (`Q9711 … Q9747` for A–Z) | Canonical entity per letter; link-out to entity browser | Yes |
| In-page IPA table for the English letter names | Offline pronunciation values | Yes (embedded) |
| [`alphabet-iso` npm](https://www.npmjs.com/package/alphabet-iso) | Hard-coded 26-letter array | No (trivial) |
| [`nato-phonetic-alphabet` npm](https://www.npmjs.com/package/nato-phonetic-alphabet) | NATO spelling alphabet | No (future) |
| Wiktionary `/api/rest_v1/page/definition/A` | Live IPA + part-of-speech for the letter | Adapter present, called on demand |
| [Unicode UCD `DerivedName.txt`](https://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedName.txt) | Letter names for any script | No (future extension to non-Latin alphabets) |

## Dictionary mode

| Component | What it provides | Used in this PR? |
|---|---|---|
| [Free Dictionary API](https://dictionaryapi.dev/) | Definitions, phonetics (IPA), example sentences, audio. CORS-enabled. | Yes (primary backend) |
| [Wiktionary REST API](https://en.wiktionary.org/api/rest_v1/) | Definitions, parts of speech, multilingual translations. CORS-enabled. | Yes (secondary backend) |
| Wikidata `wbgetentities` (already in use in `wikidata-api-browser.js`) | Multilingual labels, descriptions, aliases. | Yes (label resolver) |
| [DBnary](http://kaiko.getalp.org/) | RDF dump of Wiktionary across many languages; SPARQL queryable. | No (adapter is straightforward to add later) |
| [Linguee public scrape](https://www.linguee.com/) | Bilingual examples. | No (no public API, scraping out of scope) |

The dictionary mode is structured around a tiny adapter shape:

```js
{
  name: 'wiktionary',
  fetch: async (word, lang) => [{ word, pos, definitions, ipa, examples, source }]
}
```

Adding a third backend is a single import + array-push change.

## Ontology browser

| Component | What it provides | Used in this PR? |
|---|---|---|
| Wikidata SPARQL endpoint (`https://query.wikidata.org/sparql`) | Cheap one-shot queries for subclasses of any Q-id | Yes — used to expand a node lazily |
| `wikidata-api-browser.js` `WikidataAPIClient.fetchEntity` | Labels + claims for a Q-id | Yes — used to render node titles in the active language |
| [`d3-hierarchy`](https://github.com/d3/d3-hierarchy) | Layout algorithms (tree, tidy-tree, cluster) | No — first cut uses plain `<details>` for collapsible expand/collapse |
| [Wikidata Graph Builder](https://angryloki.github.io/wikidata-graph-builder/) | Reference UI for the same concept | No, but used as inspiration |
| [`vega-lite`](https://vega.github.io/vega-lite/) | Declarative visualisation | No (overkill for the MVP) |

## Entity / property browsers (with IPA display mode)

| Component | What it provides | Used in this PR? |
|---|---|---|
| `statements.jsx` (existing) | Renders Wikidata claims, resolves Q/P links | Yes — reused as-is |
| `wikidata-api-browser.js` `fetchEntity` / `fetchProperty` (existing) | Entity / property loader with cache | Yes — reused as-is |
| Wikidata `P898` (IPA transcription) | Direct IPA when the item has it | Yes |
| Wiktionary REST API (per-token IPA) | Fallback when `P898` is absent | Yes (adapter shared with dictionary mode) |
| In-page placeholder `[?]` for missing IPA | Avoids fake transliteration | Yes |

## Transformer / formalizer

| Component | What it provides | Used in this PR? |
|---|---|---|
| `transformation/text-to-qp-transformer.js` (existing) | Whole algorithm | Yes — reused as-is |
| Inline test button driving the existing `text-transformer-test.js` | Smoke test from within the mode | Yes — embedded inline |

## CI/CD

| Component | What it provides | Used in this PR? |
|---|---|---|
| [`lycheeverse/lychee-action`](https://github.com/lycheeverse/lychee-action) | Markdown / HTML link checker | Yes — `links.yml` |
| Wayback Machine availability API | Fallback for dead-but-archived links | Yes — `scripts/check-web-archive.mjs` |
| [`actions/configure-pages`](https://github.com/actions/configure-pages) | Configures the Pages build | Yes — `pages.yml` |
| [`actions/upload-pages-artifact`](https://github.com/actions/upload-pages-artifact) | Uploads the site artefact | Yes — `pages.yml` |
| [`actions/deploy-pages`](https://github.com/actions/deploy-pages) | Promotes the artefact to the live site | Yes — `pages.yml` |
| [`oven-sh/setup-bun`](https://github.com/oven-sh/setup-bun) | Bun runtime in CI | Yes — `test.yml` |

## Shared utilities

| Component | What it provides | Used in this PR? |
|---|---|---|
| `settings.js` (existing) | Theme + language persistence, locale-quote map, flag map | Yes — reused as-is |
| `loading.jsx` (existing) | Full-screen loading overlay | Yes — reused as-is |
| `statements.jsx` (existing) | Statement rendering | Yes — reused as-is |
| `unified-cache-browser.js` (existing) | IndexedDB / memory fallback | Yes — already in the API client |
