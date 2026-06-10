# External research

External facts, libraries and data sources that inform the design of each new mode in the unified SPA. Where a claim is non-obvious or could be wrong, the primary source is linked.

## Alphabet mode

### Reference standards

- **The Latin alphabet** — 26 letters, A–Z (upper) and a–z (lower). Encoded as ASCII `0x41`–`0x5A` and `0x61`–`0x7A`.
- **International Phonetic Alphabet (IPA)** — official chart maintained by the [International Phonetic Association](https://www.internationalphoneticassociation.org/IPAcharts/IPA_chart_orig/IPA_charts_E.html). The IPA assigns one symbol per phoneme and is the cross-linguistic reference for sound representation.

### Per-letter "name" pronunciations

For the *English names of the letters* the canonical mapping is:

| Letter | Name | IPA |
|---|---|---|
| A | "ay" | /eɪ/ |
| B | "bee" | /biː/ |
| C | "cee" | /siː/ |
| D | "dee" | /diː/ |
| E | "e" | /iː/ |
| F | "ef" | /ɛf/ |
| G | "gee" | /dʒiː/ |
| H | "aitch" | /eɪtʃ/ |
| I | "i" | /aɪ/ |
| J | "jay" | /dʒeɪ/ |
| K | "kay" | /keɪ/ |
| L | "el" | /ɛl/ |
| M | "em" | /ɛm/ |
| N | "en" | /ɛn/ |
| O | "o" | /oʊ/ |
| P | "pee" | /piː/ |
| Q | "cue" | /kjuː/ |
| R | "ar" | /ɑːɹ/ |
| S | "ess" | /ɛs/ |
| T | "tee" | /tiː/ |
| U | "u" | /juː/ |
| V | "vee" | /viː/ |
| W | "double-u" | /ˈdʌbəl.juː/ |
| X | "ex" | /ɛks/ |
| Y | "wy" | /waɪ/ |
| Z | "zee" / "zed" | /ziː/, /zɛd/ |

These IPA values are well-attested across English orthography references and Wiktionary's letter-name entries (e.g. [`A`](https://en.wiktionary.org/wiki/A)). The alphabet-mode data table embeds them directly so the page works offline without a Wiktionary fetch on first load.

### npm packages surveyed

- `alphabet-iso` — exports `[ 'A', 'B', …, 'Z' ]`. Trivial; we don't add an npm dependency for this — the array is 26 elements.
- `nato-phonetic-alphabet` — maps `A` → `"Alpha"`, etc. Not relevant to IPA; included as a future extension if the issue evolves.
- `unicode-properties` / `unicode-letters` — useful only if we want to extend to non-Latin scripts later. The unified SPA exposes a `script` prop on the alphabet mode so this is straightforward to add.

### Wikidata link-out

Every letter in the alphabet mode links to its Wikidata Q-id (e.g. `Q9711` for the letter A) so a user can jump straight into the entity browser for the deepest data we have.

## Dictionary mode

### Public APIs surveyed

- **Wiktionary REST API** — `https://en.wiktionary.org/api/rest_v1/page/definition/{word}` — returns JSON with parts of speech, definitions, and example sentences. CORS-enabled. **Used as the primary backend.**
- **Free Dictionary API** — `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` — returns definitions, phonetics (often IPA), and audio links. CORS-enabled. **Used as the secondary backend.**
- **Wikidata `wbgetentities`** — already in use; surfaces labels, descriptions, and aliases per language. **Used as the cross-language headword resolver.**
- **DBnary** — RDF dump of Wiktionary, queried via SPARQL. Powerful but heavyweight; deferred as a follow-up.

The dictionary mode is built with a small adapter pattern: each backend is a `{ name, fetch(word, lang) → DictionaryEntry[] }` shape. Today we ship the Wiktionary REST and Free Dictionary adapters; adding DBnary later is a single-file change.

### Full IPA mode

When the user toggles "Translate the page to IPA", every text node inside the dictionary result panel is processed through a transliteration step. The first cut uses the IPA values returned by the Free Dictionary API where available, and falls back to the IPA value Wiktionary attaches to the headword. Words for which no IPA is available are left in their original orthography with a `[?]` annotation so the gap is visible.

This is intentionally a *display layer* — it does not modify the underlying definitions data, so toggling back to "show in language" is instant.

### Locale-aware default behaviour

By design, the *headword* stays in its original orthography even when the explanation language is switched. This matches the issue text:

> "the original word itself stays in its original language, but we explain it in other languages."

## Ontology browser

### Backbone

Wikidata's class hierarchy is rooted at [`Q35120` — entity](https://www.wikidata.org/wiki/Q35120). Its children include:

- `Q488383` — object
- `Q151885` — concept
- `Q7184903` — abstract entity
- `Q223557` — physical object

The ontology browser walks `subclass of` (`P279`) edges by default and `instance of` (`P31`) as a secondary layer.

### Cycle handling

Wikidata's class graph is technically a DAG in practice but contains loops in the wild (some items declare themselves as their own super-class through long chains). The browser tracks `visited` Q-ids and renders a "↺ already shown above" badge when a cycle is detected, instead of expanding the same node twice. This satisfies the issue's "loops allowed" constraint without producing an infinite rendering.

### Existing tools for inspiration

- `vega` / `vega-lite` — overkill for an MVP tree view.
- `d3-hierarchy` — pure-data structure that pairs well with SVG; included as a future enhancement if a richer visualisation is wanted.
- The Wikidata Graph Builder web tool ([angryloki.github.io/wikidata-graph-builder](https://angryloki.github.io/wikidata-graph-builder/)) is the prior art that proves the concept works in a static page. The unified SPA's ontology mode is a simpler, embedded version of the same idea.

The first cut in this PR is HTML + CSS only — nested `<details>` for expand/collapse, no SVG dependency.

## Entity / property browser — IPA display mode

Wikidata returns labels and descriptions as plain text per language. There is no built-in `monolingualtext` IPA value for the great majority of items. The IPA display mode therefore composes two strategies, layered:

1. **Direct lookup of `P898` (IPA transcription).** When the entity is a word, a sound, or a phoneme, Wikidata frequently has a `P898` statement that contains the IPA value directly. Use it.
2. **Wiktionary fallback for individual tokens.** When the entity is anything else, the label is split into tokens, each token is fetched from Wiktionary, and the IPA values are joined with `‿` (the IPA "tie" symbol) between syllable boundaries.

When neither source has data, the original text is shown surrounded by `/.../` IPA-bracket markers but with a `[?]` annotation, so users can tell the difference between "shown in IPA" and "no IPA available".

## Transformer / formalizer mode

The transformer already exists (`transformation/text-to-qp-transformer.js`); no external research is needed for the algorithm. The unified styling and "tests button" are pure presentational changes.

## SPA architecture references

- **Hash routing in plain React** — `useState` for the route + `useEffect` for the `hashchange` listener is sufficient and is exactly the pattern `entities.html` already uses. We extend the hash payload from `#Q35120` to `#mode=entity&id=Q35120` so we can multiplex six modes through one URL space. The first segment of `#mode=…` is parsed; everything else is mode-specific.
- **React 19 via `esm.sh`** — matches the existing convention; no build step.
- **Babel-standalone for JSX** — matches the existing convention.

## Prior art for the case-study structure

The structure used here mirrors the layout that proved useful for previous case studies:

- `docs/case-studies/issue-29/` — Pages publishing pipeline regression.
- `docs/case-studies/issue-31/` — Demo links 404 after demo-gallery PR.

Each case study contains: raw issue payload, requirements, root causes / approach, solution plans, external research. This case study follows the same shape but replaces "root-causes.md" with "architecture.md" because issue #33 is an *enhancement* rather than a bug — there is no defect to root-cause; the equivalent analysis is the architecture for the new SPA.
