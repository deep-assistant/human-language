# Timeline — Issue #35

Reconstructed from the branch's `git log` and the PR conversation.

## T0 — pre-existing state on `main`

Commit `64762e0` ("feat: unified SPA + CI/CD workflows for issue #33")
landed the new SPA (`app.html` + `app/`) and three separate workflows:

* `test.yml` — Bun-based unit tests + a one-off `node --check` for two files
* `pages.yml` — Jekyll build + Pages deploy
* `links.yml` — lychee + Wayback fallback

The transformer mode worked locally under `bun run` but never under the
deployed page-build pipeline, because the deployed site uses
`@babel/standalone` to compile the JSX in-browser. No test (e2e or
otherwise) exercised the deployed transformer path, so the regression
shipped.

## T+0 — issue filed

[Issue #35](https://github.com/link-assistant/human-language/issues/35)
opened by @konard with a screenshot of the broken transformer
(see [`issue-screenshot.png`](./issue-screenshot.png)).

## T+0..1h — branch + PR created

Branch `issue-35-0373f2491b21` and PR #36 opened as Draft with the
initial commit `9a10f10` ("Initial commit with task details"), which
just captured the task brief.

## T+1h — reproduce

Loaded `app.html#mode=transformer` locally and confirmed the banner:

> Failed to load transformer: require is not defined

A `before` screenshot was captured to
[`docs/screenshots/issue-35-transformer-before.png`](../../screenshots/issue-35-transformer-before.png).

## T+1h..2h — root-cause

Probed `@babel/standalone` directly in the browser console:

```js
Babel.transform("await import('./x.js')", { presets: ['env','react'] }).code
```

returned a body containing `_interopRequireWildcard(require("./x.js"))`.
This proved the `env` preset rewrites dynamic `import()` to CommonJS
`require()` — which is exactly what the banner reported. See
[`root-cause.md`](./root-cause.md) for the full proof.

## T+2h — fix the transformer

Commit `8943f27` ("fix(transformer): preload modules so babel-standalone
can't break `import()`"):

1. `app.html` gained a real `<script type="module">` that imports
   `transformation/text-to-qp-transformer.js`,
   `transformation/text-transformer-test.js`, and the demo helper, and
   stashes them on `window.HumanLanguageApp`.
2. `app/modes/transformer.jsx` reads them off `window.HumanLanguageApp`
   instead of using a dynamic `import()` inside a `useEffect`.

This bypasses the `env` preset's CommonJS rewrite entirely because the
relevant modules are loaded by a real `<script type="module">` that
Babel never touches.

After this commit, navigating to `#mode=transformer` rendered the panel
with the Transform button enabled, and clicking Transform produced a
real Q/P sequence. See
[`docs/screenshots/issue-35-transformer-after.png`](../../screenshots/issue-35-transformer-after.png).

## T+3h — automated tests

Commit `e0f7c13` ("test: add Playwright e2e suite and Node-test unit
suite for issue #35"):

* `tests/e2e/app.spec.mjs` — 9 Playwright tests covering all six modes
  plus three transformer-specific regression tests. The regression test
  for the original issue asserts the body never contains "Failed to
  load transformer" or "require is not defined".
* `tests/unit/routing.test.mjs` — 8 `node:test` tests for `parseHash`,
  `serializeHash`, `MODES`, URI decoding.
* `tests/unit/ipa.test.mjs` — 7 `node:test` tests for `toIpa` and
  `toIpaForEntity` using `mock.fn` to stub `globalThis.fetch`.
* `scripts/serve-static.mjs`, `scripts/run-e2e-local.mjs`,
  `scripts/run-unit-tests.mjs`, `scripts/check-mjs-syntax.mjs` — all
  zero-dep Node CLIs that the workflow shells out to.

Local run:

```
✓ 8 routing tests
✓ 7 ipa tests
✓ 29 files clean under check-mjs-syntax
✓ 9 Playwright tests (alphabet / dictionary / ontology / entities /
  properties / transformer) — 8.1s total
```

## T+4h — unify CI/CD

Commit `5a861be` ("ci: unify test/pages/links into a single js.yml
workflow"):

* `.github/workflows/js.yml` created (210 LOC) with a `needs:`-graph
  of 7 jobs: `syntax-check → unit-tests → e2e-local`, plus
  `link-check`, then `pages-build → pages-deploy → e2e-deployed`
  on push to main.
* `.github/workflows/test.yml`, `.github/workflows/pages.yml`,
  `.github/workflows/links.yml` deleted in the same commit.

Concurrency policy mirrors the link-foundation template:
`cancel-in-progress: ${{ github.ref == 'refs/heads/main' }}` —
cancel older runs on main, queue on PR branches.

## T+5h — case study

This folder.
