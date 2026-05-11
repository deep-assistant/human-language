# CI/CD template comparison

Source repositories:

- **JS template:** [`link-foundation/js-ai-driven-development-pipeline-template`](https://github.com/link-foundation/js-ai-driven-development-pipeline-template)
- **Rust template:** [`link-foundation/rust-ai-driven-development-pipeline-template`](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template)
- **This repo:** `link-assistant/human-language` — **has no `.github/` directory at the time of this case study.**

## File tree comparison

### `.github/workflows/`

| Template file | In this repo? | Action taken |
|---|---|---|
| JS `links.yml` (broken-link checker via lychee + Wayback fallback) | No | **Copy & adapt** → `.github/workflows/links.yml` |
| JS `release.yml` (changesets + npm publish + Docker Hub + 3×3 test matrix) | No | **Cherry-pick** only the Bun test job → `.github/workflows/test.yml`; skip the rest (this repo isn't an npm package) |
| Rust `release.yml` | No | Not applicable (no Rust crate) |
| GitHub Pages deploy workflow | No | **Author new** → `.github/workflows/pages.yml` (neither template has this) |

### `.github/actions/`

| Template file | In this repo? | Action taken |
|---|---|---|
| JS `publish-dockerhub/` composite action | No | Not applicable |

### Root-level config files

| Template file | In this repo? | Action taken |
|---|---|---|
| `.gitignore` | Yes (already present) | Keep, no merge needed for this PR |
| `.lycheeignore` | No | **Copy verbatim** → `/.lycheeignore` (refines the broken-link checker's behaviour) |
| `.editorconfig` (not in JS template) | No | Skipped to keep PR focused; can be added later |
| `.prettierrc` / `.prettierignore` | No | Skipped — adopting Prettier is a separate decision |
| `.jscpd.json` (code duplication detector) | No | Skipped |
| `.secretlintrc.json` | No | Skipped |
| `.husky/` git hooks | No | Skipped (no `package.json` to host them) |
| `.changeset/` | No | Skipped (no npm package) |
| `bunfig.toml`, `deno.json`, `eslint.config.js` | No | Skipped |
| `package.json` | No | Skipped — repo is intentionally build-step-free per `README.md` "no build step required" |

### `scripts/`

| Template file | In this repo? | Action taken |
|---|---|---|
| `scripts/check-web-archive.mjs` (used by `links.yml`'s Wayback fallback) | No | **Copy** → `scripts/check-web-archive.mjs` |
| All other `scripts/*` (Changeset utilities, version bump, Docker publish) | No | Skipped — only relevant to npm release flow |

## Summary of the adoption decision

| Workflow / file | Adopted? | Rationale |
|---|---|---|
| `links.yml` (lychee) | Yes | Highest-value workflow for an HTML/Markdown-heavy site. Would have caught issue-31's 404s. |
| `.lycheeignore` | Yes | Required by `links.yml`. |
| `scripts/check-web-archive.mjs` | Yes | Wayback Machine fallback makes the link checker resilient to transient outages on the public sites (Wikipedia, esm.sh, …) the demos reference. |
| `pages.yml` (new) | Yes | The repository deploys to GitHub Pages today via a *default* Pages build that simply runs `bundle exec jekyll build` on `main`. A dedicated workflow makes the deploy reproducible from `workflow_dispatch`, lets the test workflow gate it, and surfaces deploy errors in the same UI as the other checks. |
| `test.yml` (Bun-only excerpt) | Yes | Runs the existing `*.mjs` tests in the repo root (`run-test.mjs`, `comprehensive-test.mjs`, `e2e-test.mjs`, `limitation-test.mjs`, `cached-api-test.mjs`, `unified-cache-test.mjs`, `cache-test.mjs`). These exercise the Wikidata API client and the transformer. They run today via `bun run-tests.mjs` but nothing in CI gates a PR on their result. |
| `release.yml` (npm publish + changesets + Docker) | No | Repo is not an npm package. |
| `eslint.config.js`, `.prettierrc`, `.jscpd.json`, `.secretlintrc.json`, `.husky/`, `.changeset/` | No | Out of scope; would require introducing `package.json` and a toolchain that the project has explicitly chosen to avoid. |

## Patterns borrowed from the JS template

Even where we don't copy the file verbatim we borrow the *shape*:

1. `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }` — applied to every new workflow so old runs are cancelled when a new commit lands.
2. `timeout-minutes: <reasonable upper bound>` on every job — protects against hanging external requests.
3. Path-filtered triggers — `links.yml` only fires when `.md` / `.html` files change; `test.yml` only fires when JS / `.mjs` / `.html` files change.
4. Pinned major action versions (`actions/checkout@v6`, `oven-sh/setup-bun@v2`, `lycheeverse/lychee-action@v2`).

## Forward-looking note

If the project later grows a `package.json` (e.g. to formalise the `*.mjs` tests, to add Vitest, or to publish a public client library), the cherry-picked `test.yml` is the foundation to extend; the full `release.yml` from the JS template is then the right thing to import.
