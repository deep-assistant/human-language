# Architecture of the unified SPA

This document describes the architecture of `app.html` — the single-page application that consolidates every user-facing demo behind a mode switcher. The corresponding solution plans live in `solution-plans.md`; the requirements drive in `requirements.md`.

## File layout

```
app.html               ← the SPA entry point
app.css                ← shared CSS tokens + layout primitives
app/                   ← SPA modules (loaded as <script type="text/babel"> for JSX, type="module" for plain JS)
├── shell.jsx          ← mode tab bar, theme toggle, language switcher, layout shell
├── routing.js         ← hash-route parser/serialiser (#mode=…&…)
├── ipa.js             ← IPA conversion service (P898 + Wiktionary + Free Dictionary backends)
├── modes/
│   ├── alphabet.jsx
│   ├── dictionary.jsx
│   ├── ontology.jsx
│   ├── entity.jsx       ← thin wrapper around the existing entities flow + IPA mode + tests panel
│   ├── property.jsx     ← thin wrapper around the existing properties flow + IPA mode + tests panel
│   └── transformer.jsx  ← thin wrapper around text-to-qp-transformer.js + tests panel
└── tests-panel.jsx    ← inline test runner used by entity/property/transformer modes

index.html             ← landing page (now just a hero that links into app.html)
entities.html          ← preserved; sets location.replace('app.html#mode=entity&id=…')
properties.html        ← preserved; sets location.replace('app.html#mode=property&id=…')
transformation/index.html ← preserved; sets location.replace('app.html#mode=transformer&text=…')
```

The pre-existing pages are kept as **redirect shells** so deep links from the wild (and from the README) continue to work; on load they read their hash, compose the equivalent `app.html` URL and `location.replace` to it.

## URL contract

A single hash drives the SPA:

```
#mode=<alphabet|dictionary|ontology|entity|property|transformer>
&<mode-specific keys>
```

Per-mode keys:

| Mode | Keys |
|---|---|
| `alphabet` | `letter` (A–Z, default `A`), `case` (`upper` or `lower`, default both shown) |
| `dictionary` | `word`, `lang` (definition language), `ipa` (`1` or `0`) |
| `ontology` | `root` (Q-id, default `Q35120`) |
| `entity` | `id` (Q-id), `ipa` (`1` or `0`) |
| `property` | `id` (P-id), `ipa` (`1` or `0`) |
| `transformer` | `text` (encoded), `ngram` (1–5) |

`routing.js` exports two pure helpers: `parseHash(hashString)` and `serializeHash({ mode, params })`. Both are tested against round-trip fixtures.

## Shared services

### Theme service

Implemented once in `shell.jsx`. Sequence:

1. Read `localStorage[STORAGE_KEYS.THEME]`.
2. If absent, read `window.matchMedia('(prefers-color-scheme: dark)').matches`.
3. Apply to `<html data-theme="…">` so the CSS custom-property cascade switches instantly.
4. Persist on toggle.

This is the *same* sequence `entities.html` uses today, lifted into the shell so every mode benefits.

### Language service

1. Read `localStorage[STORAGE_KEYS.LANGUAGE]`.
2. If absent, take `navigator.languages` (split on `-`) and pick the first one we recognise; otherwise fall back to `'en'`.
3. Expose `selectedLanguage`, `setSelectedLanguage(lang)`, `preferredLanguages` to every mode through a React context.

### Wikidata client

Single instance of `WikidataAPIClient` from `wikidata-api-browser.js`. Shared across all modes through a React context. Cache type is fixed to `'auto'` (IndexedDB with memory fallback) — i.e. the same configuration the entity browser uses today.

### IPA service

Implemented in `app/ipa.js`. Public API:

```js
ipa.toIpa(text, lang, { entityId? })
  → Promise<string>   // returns "/aɪ/ /ˈpiː/ /eɪ/ …" or the original text with [?]
ipa.toIpaForEntity(entity, lang)
  → Promise<string>   // shortcut that checks P898 first
```

Backends are tried in order:

1. `entityId` provided and Wikidata returns a `P898` (IPA transcription) claim → use the claim value.
2. Free Dictionary API has an entry for the word → use its `phonetic` / `phonetics[i].text` field.
3. Wiktionary REST has a `/page/definition/<word>` response with an IPA value → use it.
4. Fall through to the original text wrapped in `/.../` with `[?]` suffix.

Each backend response is cached in the same IndexedDB store used by the Wikidata client (under a `ipa:` prefix), so subsequent toggles are instant.

## Layout primitives

All modes use the same outer shell:

```jsx
<AppShell>
  <ModeTabBar />          {/* fixed top-left under the theme toggle */}
  <ThemeToggle />         {/* fixed top-right */}
  <ModeViewport>          {/* max-width 1080px on landscape, full-width on mobile */}
    <ActiveMode />        {/* one of the six modes */}
  </ModeViewport>
  <LanguageSwitcher />    {/* fixed bottom; same component used by entities.html today */}
</AppShell>
```

The shell owns:

- The CSS theme tokens.
- The mode tab bar (six buttons that change the hash).
- The theme toggle.
- The language switcher.
- The Wikidata client + IPA service (via React context).

Each mode receives `props = { params, navigate(toMode, toParams) }` so it can deep-link into another mode without knowing how the URL is serialised.

## Alphabet mode specifics

- Renders a single letter (upper + lower) so each glyph takes 50 % of the viewport — implemented as a CSS grid `grid-template-rows: 1fr 1fr` with each letter set to `clamp(40vh, 50vmin, 80vh)` `font-size` so the glyph fills its row on phones, tablets and large monitors.
- Below the glyphs: the letter name, the IPA value, the position in the alphabet, a link to the Wikidata entity for the letter.
- Prev / next navigation buttons; left/right arrow keys also bound.

## Dictionary mode specifics

- Search box at the top; hitting enter triggers a parallel lookup of all configured backends; results are merged by part of speech.
- Definition list with collapsible POS sections.
- Toggle "show in IPA": iterates the rendered text nodes inside the result panel and replaces each token through `ipa.toIpa`; the headword is left alone.
- Language switcher controls the explanation language, not the headword.

## Ontology browser specifics

- Renders a single root node (default `Q35120 — entity`) with its direct subclasses (`P279`) as children.
- Each child node is a `<details>` element so the user can expand it on demand; expansion fetches the next layer.
- Cycle detection: a `Set<Q-id>` is propagated through the recursion; if a child has already been visited on the current path, the badge "↺ already shown" is shown in place of the expandable node.
- Clicking the title of a node navigates to `#mode=entity&id=<Q-id>`.

## Entity / property mode specifics

- Exactly the rendering today's `entities.html` / `properties.html` produce, lifted into a JSX module.
- Adds an "IPA" toggle in the toolbar. When on, the IPA service is asked for every label, description and statement value; the original text is replaced inline.
- Adds a "Run tests" disclosure: when expanded, shows the existing browser test runner output in a panel below the entity content.

## Transformer mode specifics

- Renders the transformer UI from `transformation/index.html` in the unified styling.
- Adds a "Run tests" disclosure that drives `text-transformer-test.js` and prints the result inline.

## Backward compatibility

- `entities.html`, `properties.html`, `transformation/index.html` all continue to exist and remain link-targets for external content; they perform a `location.replace` to `app.html#mode=…` on load.
- `search-demo.html`, `cache-demo.html`, `browser-cache-test.html`, `run-tests.html`, `transformation/test-ngram.html` continue to exist (they're documented in `README.md` for contributors) but are removed from the landing page card grid per R10.
- All existing Wikidata cache keys (under `WikidataCache.entities` / `.properties` IndexedDB stores) continue to be honoured — the new modes use the same client that wrote them.
