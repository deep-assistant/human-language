# Solution plans

Each top-level requirement from [`requirements.md`](./requirements.md)
was a small design choice in its own right. The chosen approach is
listed first, followed by the alternatives that were considered and
rejected.

## 1. Fix the transformer

**Chosen:** Hoist the transformer modules out of `app/modes/transformer.jsx`
into a real `<script type="module">` in `app.html`, expose them on
`window.HumanLanguageApp`, and have the babel-compiled `.jsx` file
read off `window`. See [`root-cause.md`](./root-cause.md) for the
mechanism.

**Alternatives considered:**

| Option | Why rejected |
| --- | --- |
| Pass `data-plugins="syntax-dynamic-import"` to babel-standalone so it preserves `import()`. | Works, but the fix lives in a magic string on a `<script>` tag — easy to lose during a refactor and impossible to type-check. |
| Switch the preset list to `{ targets: { esmodules: true } }`. | Same vulnerability as above. Also breaks if someone later adds a transformer that needs `env` for some other reason. |
| Pre-bundle the JSX with esbuild / Vite during the Pages build. | Adds a build step. The whole point of the current architecture is "no build step in CI"; introducing one to fix a one-line bug would be wildly disproportionate. |
| Polyfill `globalThis.require` with a function that throws a clearer error. | Cosmetic at best. The fix needs the module to *load*, not just produce a different error message. |

## 2. E2E tests for every section

**Chosen:** Playwright, single Chromium project, `js/tests/e2e/app.spec.mjs`
with one `test.describe` per mode. The suite runs against
`http://localhost:8000` by default and against any `BASE_URL` override
when invoked from CI's post-deploy step.

**Alternatives considered:**

| Option | Why rejected |
| --- | --- |
| `link-foundation/browser-commander`. | Thin Playwright wrapper. The features we need are 100% covered by Playwright directly; the wrapper would add a dependency without simplifying anything. |
| Selenium / WebdriverIO. | Heavier, slower, and only one of our team members has historically used them in this codebase. |
| Use `bun test` with happy-dom / jsdom. | Doesn't run real babel-standalone; would not have caught the original bug. |

## 3. Unit / integration coverage

**Chosen:** `node:test` directly, no extra dependency. Two suites for
the modules that are pure and easy to test in isolation
(`routing.test.mjs`, `ipa.test.mjs`); `globalThis.fetch` stubbed with
`node:test`'s `mock.fn` so the suite runs offline.

**Alternatives considered:**

| Option | Why rejected |
| --- | --- |
| Vitest. | Brings in a 10+ MB dev dependency for what `node:test` already does. |
| Jest. | Same as Vitest, plus the ES Modules story is still rough. |
| Bun's built-in `bun test`. | Would tie the gate to Bun; one of the project's invariants is that CI works on a plain Node runner. The existing Bun-using suites are kept around as informational. |

## 4. CI/CD unification

**Chosen:** A single `.github/workflows/js.yml`, structure adapted from
`link-foundation/js-ai-driven-development-pipeline-template/release.yml`,
trimmed of npm-publish / changeset / Docker layers because we're a
static site, not a library. Specific steps run as `.mjs` scripts in
`./js/scripts/` (issue #35 also asks for "all JavaScript under `./js/`",
so the CI scripts live alongside the application source rather than at
the repo root).

**Alternatives considered:**

| Option | Why rejected |
| --- | --- |
| Keep `test.yml`, `pages.yml`, `links.yml` separate. | The issue explicitly asked for a single file. Also, the Pages deploy was not gated on tests before, which is exactly the kind of mistake the unification prevents. |
| Move scripts into a separate npm package. | Premature; we have five scripts, all <80 LOC. |
| Use a build matrix across Node / Bun / Deno like the template does. | Overkill — the only consumer of these scripts is a single GitHub runner. We pin Node 20 and call it a day. |

## 5. Move all JS into `./js/`

**Chosen:** Two-folder split under `./js/`:

* **`js/src/`** — application source: everything `app.html` (and the
  remaining demo HTML pages) imports at runtime. Subfolders mirror the
  pre-move logical groupings: `js/src/app/` for the SPA shell and modes,
  `js/src/transformation/` for the text-to-Q/P transformer, and
  top-level files for the cache / Wikidata-API helpers.
* **`js/scripts/`** — Node-only scripts: every CI/CD step
  (`check-mjs-syntax.mjs`, `check-web-archive.mjs`, `run-unit-tests.mjs`,
  `run-e2e-local.mjs`, `serve-static.mjs`) plus the long-standing
  live-Wikidata integration runners (`run-tests.mjs`, `cache-test.mjs`,
  `unified-cache-test.mjs`, etc.).
* **`js/tests/`** — `node:test` unit suites (`unit/`) and Playwright
  e2e specs (`e2e/`), so the test layout mirrors the template's
  `./tests/` convention while still satisfying "all JavaScript under
  `./js/`".

The deployed HTML pages (`app.html`, `entities.html`, `properties.html`,
`browser-cache-test.html`, `cache-demo.html`, `run-tests.html`,
`search-demo.html`, plus the redirect / demo pages under
`transformation/`) stay at their public URLs so existing external links
keep working; their `<script>` and `import` tags were rewritten to
reference the new `./js/src/...` paths.

`_config.yml`'s `exclude` list was updated so Jekyll keeps `js/scripts`,
`js/tests`, and the Node-only modules in `js/src/` (`unified-cache.js`,
`persistent-cache.js`, `wikidata-api.js`) out of the deployed Pages
artifact while still publishing the browser-side modules.

**Alternatives considered:**

| Option | Why rejected |
| --- | --- |
| Flat `./js/` with no subfolder split. | Drops the source / scripts / tests distinction and makes it ambiguous which files are deployed by Pages and which are Node-only. The `_config.yml` exclude list would have to enumerate individual files instead of whole folders. |
| Template's flat `./src` + `./scripts` + `./tests` at the repo root (no `./js/`). | The issue text explicitly says "All JavaScript should live in `./js/`", so the template's layout is moved one level down. |
| Defer the move to a follow-up PR (the original plan, see [PR #36 review feedback](https://github.com/link-assistant/human-language/pull/36)). | The reviewer asked for everything in a single PR. The mechanical risk is mitigated by the automated test gates — `npm run test:unit`, `node js/scripts/check-mjs-syntax.mjs`, the e2e suite — all of which run locally before the push. |
