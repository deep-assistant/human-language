# Architecture — Generation service (Q/P → text)

This note explains how the reverse-generation service is put together and
how each piece maps onto an Abstract Wikipedia concept. It mirrors the
existing transformer so the two directions are symmetric.

## Layers

```
                    ┌─────────────────────────────────────────────┐
                    │  app.html (unified SPA)                      │
                    │   app/modes/generation.jsx  ── UI mode       │
                    └───────────────┬─────────────────────────────┘
                                    │ window.HumanLanguageApp.QPRenderer
                                    ▼
   js/src/generation/qp-to-text.js  ── QPRenderer (orchestration)
                                    │
              ┌─────────────────────┴───────────────────────┐
              ▼                                              ▼
 js/src/generation/constructors.js              js/src/wikidata-api*.js
   • CONSTRUCTORS catalogue                        • getLabels(ids, lang)  (batch)
   • templates per constructor-per-language        • searchLexemes(term, lang)
   • fillTemplate / validateConstructor
   • englishIndefiniteArticle (a/an)
```

### `constructors.js` — the pure data layer

Dependency-free and synchronous, so it unit-tests offline with no Wikidata
round-trip. It holds:

- **`CONSTRUCTORS`** — the typed catalogue. Each entry has `roles` (named
  argument slots), a `description`, and `templates` keyed by language with
  a `positive` and (where the language differs) a `negative` pattern. This
  is the direct analogue of an Abstract Wikipedia *constructor* plus its
  per-language *templatic renderers*.
- **`buildConstructor` / `validateConstructor`** — construct and check an
  instance against the catalogue (unknown type / missing role throw).
- **`fillTemplate`** — substitute `{subject}`/`{predicate}`/`{object}` and
  the `{article}` phonotactics token, collapsing the whitespace an empty
  article leaves behind.
- **`englishIndefiniteArticle`** — the first grammatical feature (`a`/`an`).

### `qp-to-text.js` — the renderer

`QPRenderer` is a thin orchestration layer:

- `renderWithLabels(constructor, labels, lang)` — pure/synchronous; use
  when labels are already in hand (tests, batch pipelines).
- `render(constructor, lang)` — resolves only the *id-shaped* roles
  (`/^[QPL]\d+$/`) via the label provider, then calls `renderWithLabels`.
  Plain-text roles pass through unchanged, so the service demonstrates
  end-to-end with zero network.
- `renderAll(constructor, langs = UN6_LANGUAGES)` — renders the same
  meaning across the six official UN languages, the multi-language render
  Abstract Wikipedia demonstrates.

**Label resolution is pluggable.** The constructor accepts either a
`labelProvider` (`async (ids, lang) => { id: label }`) or an `apiClient`.
Tests inject a dictionary provider; production lazily constructs the right
Wikidata client (browser vs Node) exactly like the transformer does.

### Transformer → constructor bridge

`text-to-qp-transformer.js` gained `transformToConstructor(text)`, which
runs the normal analysis and then folds the flat Q/P sequence into a typed
constructor: first Q → `subject`, first P → `predicate`, next Q →
`object`. It also extracts **modifiers** — `negated` (via `not`/`n't`/
`never`) and `tense` (`present`/`past`/`future`, handling `-ed` and a set
of irregular past forms). This is what makes the round-trip
`text → Q/P → text` possible.

## Why this shape

- **Offline-first** keeps the gating CI suite network-free — the sandbox
  blocks outbound requests, and live-API suites are informational only.
- **Pure data layer + thin renderer** matches how Abstract Wikipedia
  separates the constructor catalogue from the rendering functions, and
  lets the grammar grow by *adding data*, not rewriting code.
- **Symmetry with the transformer** (runtime client selection, SPA mode,
  redirect shell, package exports, type declarations) means the new
  service is discoverable and maintainable by anyone who already knows the
  transformer.

## Extending it

To add a constructor: add an entry to `CONSTRUCTORS` with its `roles` and
per-language `templates`. To add a language: add its code to
`UN6_LANGUAGES`/`LANGUAGE_NAMES` and a template under each constructor. No
renderer code changes are required — the grammar is data.
