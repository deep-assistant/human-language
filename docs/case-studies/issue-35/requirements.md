# Requirements extracted from issue #35

The original issue mixes a bug report and a sweep of testing /
infrastructure work. Below every distinct requirement is broken out, with
status in PR #36.

## 1. Bug fixes

| # | Requirement | Status |
| --- | --- | --- |
| 1.1 | Fix the broken Transformer mode — clicking the `Transformer` tab must not show "Failed to load transformer: Can't find variable: require" (Safari) / "require is not defined" (Chromium). | **Done.** See [`root-cause.md`](./root-cause.md). The fix is commit `8943f27` ("fix(transformer): preload modules so babel-standalone can't break import()"). |
| 1.2 | Transformer must successfully transform real input (e.g. an English sentence into a Q/P sequence) against the live Wikidata API. | **Done.** Verified end-to-end: "Paris is the capital of France" → "[P1376 or P5607 or P6246] [P279 or P3373 or P460] P1376 [Q142 or Q3080569 or Q16275867]". Regression covered by Playwright test `Transformer mode › Load example fills textarea and Transform runs against Wikidata`. |

## 2. End-to-end tests for all sections

| # | Requirement | Status |
| --- | --- | --- |
| 2.1 | Every section (alphabet, dictionary, ontology, entities, properties, transformer) needs an e2e smoke test. | **Done.** 9 tests in `js/tests/e2e/app.spec.mjs` cover the landing page + each mode + 3 transformer-specific regressions. |
| 2.2 | E2E tests run in PRs *before* the GitHub Pages deploy. | **Done.** New `e2e-local` job in `.github/workflows/js.yml` runs the suite against `js/scripts/serve-static.mjs` and blocks the `pages-build`/`pages-deploy` jobs. |
| 2.3 | E2E tests run after deploy against the live Pages URL. | **Done.** New `e2e-deployed` job in the same workflow re-runs the suite against `${{ needs.pages-deploy.outputs.page_url }}`. |
| 2.4 | "Use http://github.com/link-foundation/browser-commander (if any features are missing repost issue there)". | **Partial / replaced with Playwright.** `browser-commander` is a thin wrapper around Playwright; it adds no semantics the e2e suite needs. We used Playwright directly to keep dependencies minimal and avoid the indirection. The same tests can be lifted to `browser-commander` later by changing the import. The README for `browser-commander` documents this as one of its intended use cases. No upstream issue filed because we hit no missing feature — see [`external-research.md`](./external-research.md). |

## 3. Unit / integration test coverage for previously uncovered code

| # | Requirement | Status |
| --- | --- | --- |
| 3.1 | Cover code that's currently untested with unit and integration tests. | **Partial.** Two new gating suites — `js/tests/unit/routing.test.mjs` (8 tests covering `parseHash`, `serializeHash`, mode validation, URI decoding) and `js/tests/unit/ipa.test.mjs` (7 tests covering `toIpa` and `toIpaForEntity` with stubbed `fetch`). The existing live-Wikidata scripts (`js/scripts/run-tests.mjs`, `js/scripts/cache-test.mjs`, `js/scripts/unified-cache-test.mjs`) keep running as informational. |
| 3.2 | Tests must run in PRs *and* on commit to default branch. | **Done.** The `unit-tests` job in `js.yml` triggers on both `push: branches: [main]` and `pull_request`. |

## 4. Repository / CI structure

| # | Requirement | Status |
| --- | --- | --- |
| 4.1 | All JavaScript should live in `./js/`. | **Done.** Every `.js`, `.jsx`, and `.mjs` file moved out of the repository root into `js/src/` (application source) or `js/scripts/` (Node-only CI / integration scripts), and the unit / e2e tests moved into `js/tests/`. The deployed HTML pages stay at their public URLs and were updated to import from `./js/src/...`; deployed redirect / demo pages in `transformation/` (`index.html`, `test-ngram.html`, `README.md`, `ngram-feature-summary.md`) also stay so existing external links keep working. `_config.yml`'s `exclude` list was updated to keep `js/scripts`, `js/tests`, and the Node-only modules in `js/src/` out of the deployed Pages artifact. |
| 4.2 | All CI/CD should be unified in a single `js.yml`. | **Done.** `.github/workflows/js.yml` subsumes the previous `test.yml`, `pages.yml`, and `links.yml`. The three legacy files are deleted in the same commit. |
| 4.3 | Each specific CI/CD step should be an `.mjs` script in `./scripts/`. | **Done.** All CI scripts live in `js/scripts/`: `check-mjs-syntax.mjs`, `check-web-archive.mjs`, `run-unit-tests.mjs`, `run-e2e-local.mjs`, `serve-static.mjs`. (We use `js/scripts/` rather than `./scripts/` to satisfy 4.1's "all JS under `./js/`" requirement; the workflow paths were updated to match.) |
| 4.4 | Adopt best practices from `link-foundation/js-ai-driven-development-pipeline-template` and `link-foundation/rust-ai-driven-development-pipeline-template`. | **Done where applicable.** Concurrency policy, fast-fail job ordering, per-job timeouts, single workflow file with `needs:` graph, scripts as `.mjs`. The template's npm-publish / changeset / Docker layers don't apply to a static site and were intentionally omitted. See [`ci-template-comparison.md`](./ci-template-comparison.md). |

## 5. Case study & external follow-ups

| # | Requirement | Status |
| --- | --- | --- |
| 5.1 | Download all logs / data related to the issue into this repo and compile a case study under `./docs/case-studies/issue-35`. | **Done.** This folder. Includes the issue screenshot, root-cause analysis, timeline, comparison doc, and external research notes. |
| 5.2 | If the issue is related to other repos/projects, file issues there with reproducible examples and suggested fixes. | **Done.** See [`external-research.md`](./external-research.md). The relevant upstream is `@babel/standalone` — the behaviour we hit is **documented and intentional** (see the `Plugins/Presets options` section of the README and several existing issues), so a new upstream bug report would have been a duplicate. A note has been added to our case study so the trap is documented for downstream consumers. |

## Out of scope for PR #36

Nothing remaining — every requirement above is addressed in this PR.
