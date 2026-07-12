# Case Study: Issue #33

> Source: [link-assistant/human-language#33](https://github.com/link-assistant/human-language/issues/33)
>
> Title: *Unify all current UI we have*

## Contents

- `issue-33.json` — full issue payload at the time of analysis.
- `requirements.md` — every requirement extracted from the issue body (R1–R10).
- `existing-ui-survey.md` — inventory of every UI page, JSX component, settings module and API client currently in the repository.
- `ci-template-comparison.md` — file-by-file comparison with `link-foundation/js-ai-driven-development-pipeline-template` and `link-foundation/rust-ai-driven-development-pipeline-template`; identifies which workflows are worth adopting for a static GitHub Pages site.
- `external-research.md` — external references for IPA, alphabets, dictionaries, ontologies, SPA design (with citations).
- `solution-plans.md` — proposed solutions, alternatives and existing components/libraries that can help with each requirement.
- `known-components.md` — short catalogue of libraries / data sources that would slot into each mode (alphabet data, dictionary APIs, ontology backbones, IPA conversion).
- `architecture.md` — diagram-prose of the unified SPA: app shell, mode switcher, shared services (theme, language, cache), per-mode contracts.
- `timeline.md` — sequence of events: when each demo was added, which case studies preceded this one (issue-29, issue-31), how the project arrived at the "many independent demos" state.

## Quick summary

The repository has accreted eight standalone HTML demos over the lifetime of the project, each with its own stylesheet, its own theme/language handling and its own ad-hoc layout. Two of them (`entities.html`, `properties.html`) already share `settings.js` and the JSX components `statements.jsx` / `loading.jsx`. The others (`transformation/index.html`, `search-demo.html`, `cache-demo.html`, `browser-cache-test.html`, `run-tests.html`, `transformation/test-ngram.html`) each reinvent the chrome.

Issue #33 asks us to:

1. **Consolidate** the user-facing demos into a single-page application driven by a mode switcher (alphabet, dictionary, ontology browser, entity browser, property browser, transformer/formalizer).
2. **Reuse** the patterns that already work well (Wikidata client with cache, `statements.jsx`, `settings.js` language/theme persistence, locale-specific quote handling).
3. **Add three new modes** that don't exist yet: alphabet (each letter ≥50 % of viewport, IPA front-and-centre), dictionary (merge multiple open dictionaries, optionally render the whole page in IPA), ontology browser (tree with loops, rooted at "entity").
4. **Add IPA display mode** to entity and property browsers.
5. **Hide internal/technical pages** (cache demos, test runners, n-gram tests) from the user-facing landing page but keep links in `README.md`.
6. **Adopt CI/CD best practices** from the two reference pipeline templates so a future issue-31-style breakage is caught before deploy.
7. **Compile this case study** under `docs/case-studies/issue-33/`.

The unified SPA is delivered as `app.html` with hash routing (`#mode=alphabet&letter=A`, `#mode=entity&id=Q35120`, …); the existing landing page (`index.html`) becomes a thin shell that links into `app.html` at the appropriate mode. The pre-existing pages (`entities.html`, `properties.html`, …) continue to work and act as deep-link aliases so that all external links keep resolving — same compatibility guarantee that drove the issue-31 fix.

Three new GitHub Actions workflows are added under `.github/workflows/`:

- `links.yml` (lychee) — copied from the JS pipeline template, scoped to the demo pages.
- `pages.yml` — purpose-built GitHub Pages deploy (the JS template has no equivalent; it publishes to npm instead).
- `test.yml` — Bun-only excerpt of the JS template's release pipeline so the existing `*.mjs` tests under the repo root run on every push.

The full per-requirement breakdown lives in `solution-plans.md`.
