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

**Chosen:** Playwright, single Chromium project, `tests/e2e/app.spec.mjs`
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
`./scripts/`.

**Alternatives considered:**

| Option | Why rejected |
| --- | --- |
| Keep `test.yml`, `pages.yml`, `links.yml` separate. | The issue explicitly asked for a single file. Also, the Pages deploy was not gated on tests before, which is exactly the kind of mistake the unification prevents. |
| Move scripts into a separate npm package. | Premature; we have five scripts, all <80 LOC. |
| Use a build matrix across Node / Bun / Deno like the template does. | Overkill — the only consumer of these scripts is a single GitHub runner. We pin Node 20 and call it a day. |

## 5. Move all JS into `./js/`

**Chosen:** Deferred to a follow-up PR.

**Why deferred, not done:**

* Every `.jsx` file currently lives at `app/modes/`. Every
  `.js` module lives either at the repo root (`text-to-qp-transformer.js`
  used to, now in `transformation/`) or under `app/`. Moving them into
  a single `./js/` folder rewrites the import path of essentially
  every module in the repo.
* `app.html` references modules with relative paths from the repo
  root; those references would all need to change too.
* The legacy demo HTML files (the now-orphaned `index.html`,
  `dictionary.html`, etc.) also reference these modules; they'd need
  to be rewritten or deleted.
* Bundling the move into the bug-fix PR makes the diff unreviewable
  and increases the risk of a follow-on regression.

PR #36 already lands the *blocking* parts of issue #35 (the bug
fix, the test coverage that prevents recurrence, the unified CI).
The `./js/` move is mechanical once those are merged and is tracked
as a follow-up.
