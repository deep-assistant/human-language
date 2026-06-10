# Timeline / Sequence of Events

Reconstructed from the repository's git history, the GitHub Pages build history (`pages-builds.json`) and the workflow run list (`workflow-runs.json`).

| When (UTC)               | Event                                                                                                   | Evidence                                                  |
|--------------------------|---------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| 2025-07-15 19:20:57      | `pages-build-deployment` workflow created. GitHub Pages enabled in **legacy mode** — source: `main` / `/` (root). No custom workflow file is committed. | `workflow-runs.json`, `pages-config.json`                |
| 2025-07-15 .. 2025-07-27 | Initial development, multiple feature commits add demos: `transformation/index.html`, `entities.html`, `properties.html`, `search-demo.html`, `cache-demo.html`, `browser-cache-test.html`, `run-tests.html`, `transformation/test-ngram.html`. | `git log`                                                |
| 2025-07-27 18:02 .. 18:13 | Three README revamps land on `main`. Each push triggers a successful `pages build and deployment` run (commits `87b4aa2`, `d0db4a4`, `44819dc`). | `pages-builds.json`                                     |
| 2025-08-24 13:06         | `13d32b6` — *"Add a document about search for the semantic foundation"* — published successfully. | `pages-builds.json`                                       |
| 2025-08-24 13:12         | `675c8ee` — *"Add a draft of proof of the probability of absense of the information"* — published successfully. **This is the most recent successful Pages build.** | `pages-builds.json`                                  |
| 2026-04-29               | Issue #29 opened. PR #30 (this PR) opened against branch `issue-29-51ae10349f3e`. | `issue-29.json`                                  |

## Observations

- The repository was **renamed from `deep-assistant/human-language` to `link-assistant/human-language`** at some point before this issue. The README and the live Jekyll output still contain hard-coded `deep-assistant` URLs.
- All Pages builds in history are `status: "built"` with `error.message: null` — there is **no failing build** to debug. The "republish" problem the issue asks us to fix is therefore not a CI failure but a *content* problem: nothing on the published page invites a republish until a tracked file changes, and once republished the canonical/og URLs still point at the old org.
- There is **no `.github/workflows/` directory committed in this repo** — the only workflow is the implicit GitHub-managed `pages-build-deployment` (its `path` is `dynamic/pages/pages-build-deployment`). All pages builds we see are runs of that implicit workflow.
- There is **no `index.html` at the repository root** — the live site is rendered by Jekyll's default theme from `README.md`, which is why the issue calls out that the main page lacks direct links to demos.
