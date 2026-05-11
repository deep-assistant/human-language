# Solution plans

For each requirement (R1–R13 in `requirements.md`) we list the chosen solution, the alternatives we considered, and the existing components / libraries that informed the choice (see `known-components.md` for the catalogue).

## Solution for R1 — Unified SPA with mode switching

### Chosen approach

Build `app.html` as a single React 19 + Babel-standalone single-page application with hash-based routing. The hash carries both the mode and its parameters (`#mode=entity&id=Q35120`). Six modes are mounted: alphabet, dictionary, ontology, entity, property, transformer.

The pre-existing pages (`entities.html`, `properties.html`, `transformation/index.html`) are converted to thin redirect shells that translate their old hash into the new one and call `location.replace` — so all external deep links keep resolving.

### Alternatives considered

1. **Path-based routing with a service worker.** Adds a service worker for nothing; GitHub Pages does not honour `History.pushState` URLs anyway (deep links would 404). Rejected.
2. **Multiple HTML files sharing a common include.** Keeps the existing file split but would require a templating step (Jekyll partials). Rejected to keep the "no build step" promise.
3. **A full SPA framework (Next, Vite, …).** Rejected for the same reason — the project's stated value is *zero* build step.

## Solution for R2 — Reuse best practices

### Chosen approach

The unified SPA imports `settings.js`, `wikidata-api-browser.js`, `statements.jsx`, `loading.jsx`, and `transformation/text-to-qp-transformer.js` verbatim. Theme CSS tokens are lifted from `entities.html` into a shared `app.css`.

`settings.js` is extended only in a non-breaking way (new export `MODE_KEYS` etc.); the existing exports keep their semantics so other pages keep working.

### Alternatives considered

1. **Move everything inline into `app.html`.** Loses the separation that already proved valuable in the issue-31 case study. Rejected.
2. **Migrate the JSX components to plain JS (no Babel).** Mechanical change; gains nothing because Babel-standalone is cached aggressively by browsers via esm.sh. Rejected.

## Solution for R3 — Automatic language and theme detection

### Chosen approach

`shell.jsx` owns both detection paths once. Sequence (theme): `localStorage` → `prefers-color-scheme` → `'dark'`. Sequence (language): `localStorage` → `navigator.languages` → `'en'`. Both are exposed to every mode through a React context.

Theme is applied via `document.documentElement.setAttribute('data-theme', …)` so the CSS custom-property cascade flips instantly.

## Solution for R4 — Alphabet mode

### Chosen approach

A new mode `app/modes/alphabet.jsx` with:

- An embedded 26-row table containing letter name + IPA value for the English letter names (sourced from authoritative references — see `external-research.md`).
- A `clamp(40vh, 50vmin, 80vh)` font-size on both glyphs so each takes ≥ 50 % of the viewport on every screen size.
- Previous/next buttons and left/right arrow-key bindings.
- A "View on Wikidata" link to the letter's Q-id; clicking opens the entity browser mode for it.
- A "Wiktionary lookup" button that fetches richer IPA data on demand for the current letter (via the IPA service).

### Alternatives considered

1. **Pull alphabet data from an `npm` package.** Adds a dependency for a 26-element array. Rejected; data is embedded.
2. **Scrape Wiktionary on first load.** Adds a 200 ms delay before the first frame for content we can ship inline. Rejected as the default; remains available behind the "Wiktionary lookup" button.

## Solution for R5 — Dictionary mode

### Chosen approach

A new mode `app/modes/dictionary.jsx` with a tiny adapter pattern. Adapters in this PR: Wiktionary REST + Free Dictionary API. Both are CORS-enabled (no proxy needed). Results from each backend are merged by part of speech with the source attributed in a small badge.

A "Show in IPA" toggle re-renders the text inside the result panel through the IPA service; the headword stays in its original orthography per the issue text.

A "Definition language" picker lets the user pick the explanation language; the picker reuses the same `flagMap` from `settings.js` that powers the existing entity browser.

### Alternatives considered

1. **Bundle a pre-fetched dictionary corpus.** Tens of megabytes; bad fit for a static site. Rejected.
2. **Use a single backend.** Loses the "merge data from publicly accessible dictionaries" intent of the issue. Rejected.

## Solution for R6 — Ontology browser

### Chosen approach

A new mode `app/modes/ontology.jsx` rooted at `Q35120 — entity`. Each node is a `<details>` element; expansion lazily queries the Wikidata SPARQL endpoint for direct subclasses (`P279`). Visited nodes are tracked through a `Set<Q-id>` propagated through recursion so cycles render a "↺ already shown" badge and do not expand further.

Clicking a node title navigates to `#mode=entity&id=<Q-id>`.

### Alternatives considered

1. **SVG tree with `d3-hierarchy`.** Adds a JS dependency and a build consideration. The `<details>` approach is keyboard-accessible by default and zero-dependency.
2. **Fetch the entire ontology on first load.** Tens of thousands of nodes; out of the question.

## Solution for R7 — Entity browser with IPA mode and tests

### Chosen approach

The existing `entities.html` logic is lifted into `app/modes/entity.jsx`. Behaviour is preserved; the new additions are:

- An "IPA" toggle in the toolbar. When on, every rendered label, description and statement value is replaced through the IPA service. The replacement runs once on toggle and is memoised per language.
- A "Run tests" disclosure that mounts the existing browser test runner (today's `run-tests.html`) inline as a `<details>` element below the entity content.

### Alternatives considered

1. **A separate `entity-ipa.html`.** Re-introduces the per-page proliferation the issue asks us to *unify*. Rejected.

## Solution for R8 — Property browser with IPA mode and tests

Identical structure to R7 but for properties (`app/modes/property.jsx`).

## Solution for R9 — Transformer with tests

### Chosen approach

The existing `transformation/index.html` UI is lifted into `app/modes/transformer.jsx` with the unified theme tokens replacing its bespoke palette. A "Run tests" disclosure embeds the existing `text-transformer-test.js` driver inline.

## Solution for R10 — Hide internal pages from the landing

### Chosen approach

`index.html` is rewritten as a thin hero linking into the six unified modes. The internal pages (`search-demo.html`, `cache-demo.html`, `browser-cache-test.html`, `run-tests.html`, `transformation/test-ngram.html`) are removed from the landing card grid but kept in the repo. `README.md` retains links to them so contributors can still find them.

### Alternatives considered

1. **Delete the internal pages entirely.** The issue is explicit that they should *still exist*, just not be user-facing.
2. **Move them under an `internal/` directory.** Breaks every existing GitHub Pages URL; would have to redirect each one. Excessive churn for a presentation-only change. Kept in place, just unlinked from the landing.

## Solution for R11 — CI/CD best practices

### Chosen approach

Three new workflows under `.github/workflows/`:

- `links.yml` — direct port from `link-foundation/js-ai-driven-development-pipeline-template/.github/workflows/links.yml`, paired with `.lycheeignore` and `scripts/check-web-archive.mjs`.
- `pages.yml` — purpose-built (the JS template has no equivalent because it publishes to npm). Uses `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`.
- `test.yml` — Bun-only excerpt of the JS template's `release.yml` test matrix. Runs `bun run-tests.mjs` and the per-script tests under the repo root.

See `ci-template-comparison.md` for the rationale per workflow.

### Alternatives considered

1. **Copy `release.yml` wholesale.** Pulls in changesets, Docker publishing, and the npm release path that have no place in a static Pages site. Rejected.
2. **Skip CI entirely.** The issue explicitly asks for CI/CD best practices ("so we don't have more CI/CD errors in the future"). Rejected.

## Solution for R12 — Case study

### Chosen approach

`docs/case-studies/issue-33/` follows the structure used for `issue-29` and `issue-31`. Artifacts:

- `README.md`, `requirements.md`, `solution-plans.md`, `external-research.md` — same names as prior case studies.
- `architecture.md` — replaces `root-causes.md` because issue #33 is an enhancement, not a bug. The architecture document carries the same "decision rationale" load that `root-causes.md` carries in the bug case studies.
- `existing-ui-survey.md`, `ci-template-comparison.md`, `known-components.md`, `timeline.md` — supporting analyses driven by the specifics of this issue.
- `issue-33.json` — raw issue payload at the time of analysis.

## Solution for R13 — Single PR

### Chosen approach

All deliverables land on branch `issue-33-3f5cf1139fe7` against PR #34. The PR description is updated to enumerate the requirements addressed and link to the case study.

## Known components used

See `known-components.md` for the catalogue. Components reused as-is: `settings.js`, `wikidata-api-browser.js`, `statements.jsx`, `loading.jsx`, `transformation/text-to-qp-transformer.js`, `unified-cache-browser.js`. Components newly added: `app/shell.jsx`, `app/routing.js`, `app/ipa.js`, `app/modes/*.jsx`, `app/tests-panel.jsx`, `app.css`, `app.html`, three workflow files, `.lycheeignore`, `scripts/check-web-archive.mjs`.

## Follow-ups (not in scope of this PR)

- Add more dictionary backends (DBnary SPARQL, Wikidata Lexemes).
- Extend the alphabet mode to non-Latin scripts (Greek, Cyrillic, Arabic) once the issue evolves; the data table is structured to make this a config-only change.
- Add a `lychee` rule that recognises `app.html#mode=…` deep links from `README.md`.
- Re-introduce a build step *if* the project later wants tree-shaking; until then the "no build step" promise stands.
