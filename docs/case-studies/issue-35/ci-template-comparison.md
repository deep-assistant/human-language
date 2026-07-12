# CI/CD template comparison

How the new `.github/workflows/js.yml` aligns with the patterns from
the link-foundation templates.

## Sources reviewed

* [link-foundation/js-ai-driven-development-pipeline-template](https://github.com/link-foundation/js-ai-driven-development-pipeline-template) — `.github/workflows/release.yml` (617 lines), `.github/workflows/links.yml`, and 30+ `.mjs` scripts in `./scripts/`.
* [link-foundation/rust-ai-driven-development-pipeline-template](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template) — single `.github/workflows/release.yml`.

## Patterns adopted

| Pattern from the template | How js.yml uses it |
| --- | --- |
| **Single workflow file** containing all jobs (`release.yml` in the template). | `js.yml` is the only workflow file in `.github/workflows/`. |
| **Concurrency: cancel-in-progress on main, queue on PR** so force-pushes don't cancel checks. | Same expression: `cancel-in-progress: ${{ github.ref == 'refs/heads/main' }}`. |
| **Fast-fail job ordering** — cheap checks gate slow ones. | `syntax-check → unit-tests → e2e-local → pages-build → pages-deploy → e2e-deployed`. |
| **Per-job `timeout-minutes`** with realistic budgets. | 5-15min per job. The template uses similar values (5 for syntax checks, 10 for lint/test, 30 for release). |
| **All scripts live in `./scripts/`** and are called from the workflow YAML as `node scripts/X.mjs` or `bash scripts/X.sh`. | Adapted — same shape, but the scripts live under `js/scripts/` instead of `./scripts/` so the repo can satisfy issue #35's "all JavaScript under `./js/`" requirement at the same time. The workflow calls `node js/scripts/check-mjs-syntax.mjs`, `node js/scripts/run-unit-tests.mjs`, `node js/scripts/run-e2e-local.mjs`, `node js/scripts/serve-static.mjs`, and `node js/scripts/check-web-archive.mjs`. All `.mjs`. |
| **Pin the action version (`@v6`, `@v5`)** rather than tracking `@main`. | Same — `actions/checkout@v6`, `actions/setup-node@v6`, `actions/configure-pages@v5`, `actions/deploy-pages@v4`. |
| **Default minimal `permissions:` block** at the workflow level, widen per-job. | `permissions: contents: read` at the top; `pages-deploy` widens to `pages: write, id-token: write`. |
| **`needs:` + `outputs:` pattern to thread state between jobs.** | `pages-deploy.outputs.page_url` is consumed by `e2e-deployed` to point Playwright at the just-deployed site. |
| **`if: failure()` artefact upload** so a broken run leaves a debug-able report. | `playwright-report/` is uploaded on failure from both `e2e-local` and `e2e-deployed`. |
| **`workflow_dispatch:` for manual triggers** alongside `push` and `pull_request`. | All three triggers wired up. |
| **Use Node's built-in toolchain** wherever possible (no extra deps for CI scripts). | `js/scripts/serve-static.mjs` uses `node:http`, `js/scripts/run-unit-tests.mjs` uses `node:test`, `js/scripts/check-mjs-syntax.mjs` uses `node --check`. The only dev-dependency is `@playwright/test`. |

## Patterns intentionally **not** adopted

These exist in the template but don't apply to a static-site repo:

| Template pattern | Why we skipped it |
| --- | --- |
| **npm publish path** (the `release` job, `instant-release`, `setup-npm.mjs`, `publish-to-npm.mjs`). | This repo is a static site served from GitHub Pages, not a published library. There's nothing to publish to npm. |
| **Changesets workflow** (`changeset-check` job, `validate-changeset.mjs`, `version-and-commit.mjs`, `create-manual-changeset.mjs`). | No semver to bump, no CHANGELOG to maintain, no consumers downstream. |
| **OIDC trusted publishing** (`id-token: write` on the release job, `setup-npm.mjs`). | Tied to npm publish; see above. |
| **Docker Hub publish** (`docker-publish` job, `check-docker-publish.mjs`, the `./.github/actions/publish-dockerhub` composite). | No Docker artefact. |
| **Multi-runtime test matrix** (`runtime: [node, bun, deno]` × `os: [ubuntu, macos, windows]`). | The static site only ever runs in browsers; CI just needs to validate the artefacts. Running the same Playwright suite three times on three OSes burns CI minutes without raising the chance of catching the kind of bug this PR fixed. |
| **`detect-changes` step** that diffs the PR and skips unrelated jobs. | Every job in `js.yml` runs in <2 minutes wall time; the YAML cost of adding a `detect-changes` outputs matrix would dwarf the savings. If individual jobs grow expensive we can revisit. |
| **`simulate-fresh-merge.sh`** — checks out a merge with the base branch before linting/testing. | Worth it for a library where lint catches regressions. For a SPA whose only "lint" is `node --check`, GitHub's default behaviour (running against the merge commit for `pull_request`) is already adequate. |
| **`max-lines` ESLint rule (1500-line file cap)**. | We have no ESLint config today and no .mjs file in this repo exceeds 80 lines. We can add it when the codebase grows. |

## Where we _added_ things the template doesn't have

Because the templates are package-shaped and we are SPA-shaped, two
jobs in `js.yml` have no analogue in the template:

* **`pages-build` + `pages-deploy`.** Adapted from the previous
  `pages.yml`; kept intact aside from the `needs:` graph that now
  blocks deploy on tests passing.
* **`e2e-deployed`.** A fresh Playwright run against the live Pages
  URL after deploy. This is the canonical "verify the deployment"
  hook the issue called for and has no equivalent in a library
  workflow.

## Net result

Before this PR:

```
.github/workflows/
├── test.yml   (52 lines, no Pages or e2e)
├── pages.yml  (53 lines, no test gate)
└── links.yml  (85 lines)
```

After this PR:

```
.github/workflows/
└── js.yml     (212 lines, full pipeline)
scripts/
├── check-mjs-syntax.mjs
├── check-web-archive.mjs   (pre-existing)
├── run-e2e-local.mjs
├── run-unit-tests.mjs
└── serve-static.mjs
```

One workflow, four new scripts, and the deploy is gated on tests for
the first time.
