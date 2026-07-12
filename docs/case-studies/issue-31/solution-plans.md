# Solution plans

For each requirement (R1–R6 in `requirements.md`) we list the proposed solution, the alternatives we considered, and any existing components/libraries that would help if the project ever needs to scale this beyond a one-off fix.

## Solution for R1 + R2 — get every link on the landing page working

### Chosen approach

Edit `_config.yml` so the `exclude:` list contains **only** files that should never be served (Node-only modules, JSON dumps, the `.gitkeep` placeholder, `node_modules/`, the `data/` cache, and the Node test scripts under `*.mjs`). Specifically:

- Remove `*.jsx`, `settings.js`, `unified-cache-browser.js`, `wikidata-api-browser.js`, `search-test.js` from the exclusion list — every one of these is fetched by an HTML page that GitHub Pages publishes.
- Keep `persistent-cache.js`, `unified-cache.js`, `wikidata-api.js` excluded — these are Node-only and pulling them into `_site/` only wastes bytes; nothing in a browser HTML page imports them.

### Alternatives considered

1. **Switch to an `include:` allowlist.** Smaller surface but loses Jekyll's natural defaults (e.g. it would also stop publishing the README as the index, which the rest of the project relies on). Rejected.
2. **Rename the JSX files to `*.js`.** Removes the `*.jsx` glob trip-wire but breaks every editor's syntax highlighting and is a much bigger diff. Rejected.
3. **Put the demos in a directory whose contents are always published (e.g. `app/`).** The largest change — it would be the right move if the project grew beyond ~10 demos, but is overkill for the current size and would invalidate every external link to `entities.html` / `properties.html`. Rejected for now; revisit if more demos are added.

## Solution for R3 — fix the rest of the demos

### Chosen approach

Repoint the cache and search demos at the browser-safe API:

- `cache-demo.html` — `import { TextToQPTransformer } from './transformation/text-to-qp-transformer.js'` (correct path) and `import { CacheFactory } from './wikidata-api-browser.js'` (re-exported there for exactly this reason).
- `search-demo.html` — `import { searchUtility } from './wikidata-api-browser.js'`.
- `search-test.js` — `import { searchUtility, client } from './wikidata-api-browser.js'`.
- `run-tests.html` — `import { TextTransformerTest, demonstrateTransformer } from './transformation/text-transformer-test.js'` (correct path).

### Why this works

`wikidata-api-browser.js` already re-exports the symbols the demos need (`searchUtility`, `client`, `CacheFactory`); no new code paths are required, only correct imports. `wikidata-api-browser.js` itself only depends on `unified-cache-browser.js`, which only uses `IndexedDB` and falls back to in-memory when unavailable — both safe in a browser, both safe in a Node test (where the Node test scripts under `*.mjs` continue to use the Node twins via their own imports).

### Alternatives considered

1. **Bundle everything with esbuild / Vite.** Removes the runtime ESM footguns at the cost of introducing a build step. The repo's stated value proposition is "no build step" — see the README's "View source on any page; everything is plain HTML / CSS / ESM". Rejected; revisit only if the import graph keeps growing.
2. **Write a tiny `dependencies.json` per HTML page and a CI script that verifies every listed file exists in `_site/`.** Useful if/when more demos are added; out of scope for #31 itself but called out in the "Follow-ups" section below.

## Solution for R4 — case-study folder

The `docs/case-studies/issue-31/` directory follows the exact layout of `docs/case-studies/issue-29/`. Contents listed in `README.md`. The reproduction script (`reproduction.md`) is new compared to issue-29 because the bug here is reproducible mechanically.

## Solution for R5 — verbose mode

Not needed. The 404s are visible from the Network tab without any code changes; the existing `console.log` calls in `entities.html` and `properties.html` are sufficient once the imports succeed. If a future regression hides behind a successful 200 (e.g. a CDN caches an old asset), the next case study should add `console.debug` around the `fetchEntity` / `fetchProperty` paths and gate it behind `localStorage.getItem('debug') === '1'`.

## Solution for R6 — upstream issue

No upstream defect. Jekyll's `exclude:` semantics are working as documented (see `external-research.md`). No issue is filed against `jekyll/jekyll` or `pages-gem`.

---

## Known components / libraries that would help

These are listed for future reference; none of them are introduced as part of this PR.

| Need | Tool / library | Notes |
|---|---|---|
| Verify every link on a static site | `lychee` (Rust, [github.com/lycheeverse/lychee](https://github.com/lycheeverse/lychee)) or `htmltest` (Go) | Run on the built `_site/` in CI; would have caught all four 404s. |
| Verify every JS module import resolves | `htmlproofer --check-internal-hash` after a build, or a tiny custom script that walks `<script type="module">` and `import 'X'` references | A 50-line node script can statically catch the regression without needing a real browser. |
| Smoke-test demos in a real browser in CI | `@playwright/test` (already used locally for the screenshots in this PR) | Add a single test that opens each demo, asserts `console.error` is empty for the first 3 seconds, and snapshots the page. |
| Catch Jekyll exclude regressions specifically | Jekyll plugin `jekyll-include-cache` is unrelated; the simplest guard is a CI step that asserts `_site/settings.js`, `_site/statements.jsx`, etc. exist after `bundle exec jekyll build`. | One-line `test -f` per file. |

## Follow-ups (not in scope of this PR)

- Add a `lychee` or custom-script CI job that runs against `_site/` and fails on any 404 or unresolved JS import. Recommended cadence: once per push to `main`.
- Add a Playwright smoke test that visits each demo from `index.html` and asserts no `console.error` events.
- When the project gains a build step (or grows past ~10 demos), revisit the "move demos under `app/`" plan from the alternatives section.
