# Requirements extracted from issue #33

The issue body is dense and intermixes user-facing requirements with infrastructure asks. Each is treated as a separate requirement here.

## R1 — Unify all current UI into a single-page application with mode switching

> "Each section should be usable from single home page, we should make it single page application, that allows to switch between modes …"

The unified app must expose six top-level modes accessible from a single home page:

- Alphabet
- Dictionary
- Ontology browser
- Entity browser (was `entities.html`)
- Property browser (was `properties.html`)
- Transformer / formalizer (was `transformation/index.html`)

The switch between modes must not require a full page reload (SPA semantics). Each mode must keep theme and language preferences in sync across mode switches.

## R2 — Reuse best practices from the existing codebase

> "We need to make sure we use all the best practices from all the code around the code, meaning if something is good and useful in other place we should reuse as much code as possible."

The unified app must reuse, not re-implement:

- `settings.js` for theme, language, locale-specific quotes, flag emoji.
- `wikidata-api-browser.js` (the browser-safe API client + cache + label manager).
- `statements.jsx` for rendering Wikidata claims.
- `loading.jsx` for the loading overlay.
- `transformation/text-to-qp-transformer.js` for the transformer mode.
- The CSS custom-property theme tokens (`--background`, `--text`, `--neon`, `--neon-selected`, `--neon-shadow`, …) that already drive `entities.html` / `properties.html`.

If a duplicated style sheet or a re-implemented language switcher is found, it must be deleted in favour of the shared module.

## R3 — Automatic language detection and theme detection

> "Use React.js components, unify style, automatic language detection, theme detection."

- Theme: respect `localStorage` first, then `prefers-color-scheme`.
- Language: respect `localStorage` first, then `navigator.languages`, then fall back to `'en'`.
- Both controls must be visible on every mode and survive mode switching.
- React components must be used (React 19 via esm.sh, Babel-standalone for JSX, matching the existing convention; no build step).

## R4 — Alphabet mode

> "alphabet (collect all the best data about alphabet, each upper case and lower case letter should take up at least 50% of screen space on any size), we can use all the npm libraries about alphabets, and combine all data from them. For alphabet we should also make sure for each letter we always use international phonetic alphabet."

Specific constraints:

- Both upper-case and lower-case glyph each occupy ≥ 50 % of the viewport on any size.
- Letter view shows the IPA pronunciation prominently.
- Data is aggregated from publicly-available alphabet sources (Wikidata's alphabet items, `npm` packages such as `alphabet-iso` or equivalent).
- Letter navigation: previous / next, optionally keyboard-driven.

## R5 — Dictionary mode

> "dictionary (also collect all the best data from all publicly and freely accessible dictionaries, and merge data from them into single one), also we should be able to use full IPA translation, meaning all text of dictionary on the page is translated to IPA, not only just a word. But by default it should be meaning description dictionary in the same language, with ability to switch language, so the original word itself stays in its original language, but we explain it in other languages."

Specific constraints:

- Word lookup with multiple data sources merged (e.g. Wiktionary REST, Free Dictionary API, DBnary-style RDF where available).
- Default display: definitions in the same language as the headword.
- Language switcher: changes the *explanation* language only; the headword stays in its original orthography.
- "Full IPA mode" toggle: re-renders every text node on the page (definition, examples, etymology) into IPA, not only the headword.

## R6 — Ontology browser

> "ontology browser (here we should have tree like structure between terms will loops allowed, so we see the root of ontology like entity that branches to abstract entities, physical entities and so on)."

Specific constraints:

- Tree visualisation rooted at `entity` (Wikidata `Q35120`).
- Edges follow the `instance of` / `subclass of` properties (P31, P279); other ontological links must be supported as optional layers.
- Cycles (loops) must be rendered without infinite recursion or duplication of nodes — i.e. a *graph* with breadcrumb / collapsible nodes, not a strict tree.
- Clicking a node deep-links into entity-browser mode for that node.

## R7 — Entity browser with IPA mode and tests

> "entity browser (as we have now) with tests button on the same page (with added IPA display mode)"

- Carry forward all behaviour of `entities.html` (labels, descriptions, statements, language switcher).
- Add an IPA display mode toggle: when on, all rendered text (labels, descriptions, statement values) is rendered in IPA.
- Add a "Run tests" button that triggers the existing browser test runner (today: `run-tests.html`) inline / in a panel rather than on a separate page.

## R8 — Property browser with IPA mode and tests

> "property browser (as we have now) with tests button on the same page (with added IPA display mode)"

Same as R7 but for properties — i.e. carry forward `properties.html`, add IPA mode, add inline tests.

## R9 — Transformer / formalizer with tests

> "transformer/formalizer (as we have now, but in unified style and with tests button)."

- Carry forward `transformation/index.html` behaviour (Q/P sequence, n-gram size, alternatives).
- Re-skin it with the unified styling.
- Add a tests button (today: `transformation/test-ngram.html`) inline.

## R10 — Hide internal / technical demos from the user-facing landing page

> "Caching and all other technical details pages with tests, can still exists but should not be user facing, meaning, for example links to them only in README.md on GitHub, not on main GitHub Pages web-application."

- Remove cache-demo, browser-cache-test, run-tests, n-gram-test from the GitHub Pages landing.
- Keep the source files in the repo; keep links in `README.md` so contributors can still reach them.
- The deployed landing page (`index.html`) must surface only the six unified modes.

## R11 — Adopt CI/CD best practices from the two reference pipeline templates

> "Use all the best practices from CI/CD templates (check full file tree to compare for all GitHub workflow and CI/CD scripts file): https://github.com/link-foundation/js-ai-driven-development-pipeline-template https://github.com/link-foundation/rust-ai-driven-development-pipeline-template"
>
> "We should compare all files, so we don't have more CI/CD errors in the future and reuse all the best practices from these templates."

- Add a `.github/workflows/` directory (the repo currently has none).
- Adopt link checking (lychee) with `.lycheeignore` — direct copy from the JS template, plus the `check-web-archive.mjs` fallback script for graceful handling of dead-but-archived links.
- Add a GitHub Pages deploy workflow (the JS template does not have one; this is purpose-built for this site).
- Add a Bun-based test workflow that runs the `*.mjs` test scripts already in the repo.
- Add `.editorconfig` and `.prettierrc` only if we adopt the formatter (not strictly required by the issue; skipped for now to keep the diff focused).
- See `ci-template-comparison.md` for the complete file-by-file comparison.

## R12 — Case study under `docs/case-studies/issue-{id}`

> "We need to collect data related about the issue to this repository, make sure we compile that data to ./docs/case-studies/issue-{id} folder, and use it to do deep case study analysis (also make sure to search online for additional facts and data), list of each and all requirements from the issue, and propose possible solutions and solution plans for each requirement (we should also check known existing components/libraries, that solve similar problem or can help in solutions)."

- Folder must exist at `docs/case-studies/issue-33/`, following the same layout as the existing `issue-29` and `issue-31` case studies (issue payload, requirements, root causes / approach analysis, solution plans, external research, known components).

## R13 — Single pull request, fully addressed

> "Please plan and execute everything in a single pull request, you have unlimited time and context, as context auto-compacts and you can continue indefinitely, until it is each and every requirement fully addressed, and everything is totally done."

The work must land as a single PR (#34) that addresses every requirement above. Partial implementations are explicitly disallowed by the issue. Where a requirement is naturally an iterative one (e.g. "merge all dictionaries"), the deliverable is a working first cut that demonstrably covers at least one source and exposes the data-source plumbing so that additional sources can be added by configuration only.
