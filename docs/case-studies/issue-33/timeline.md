# Timeline

How this repository arrived at the state issue #33 asks us to consolidate.

## Pre-history (no commit dates needed — captured from current file content)

- `wikidata-api.js`, `wikidata-api-browser.js`, `unified-cache.js`, `unified-cache-browser.js`, `persistent-cache.js` are introduced as paired Node / browser modules for a Wikidata client with a unified cache layer.
- `entities.html` and `properties.html` are introduced as the first user-facing demos; they share `settings.js`, `statements.jsx`, `loading.jsx`.
- `transformation/` is introduced with `index.html`, `test-ngram.html`, and the `text-to-qp-transformer.js` library.
- `search-demo.html`, `cache-demo.html`, `browser-cache-test.html`, `run-tests.html` are added one at a time; each gains its own bespoke palette and chrome.

## Issue #29

A regression in the Pages publish pipeline. Case study at `docs/case-studies/issue-29/`. Resolved by adjusting the Pages build.

## Demo gallery PR (#30)

`index.html` is introduced as a landing page with a card per demo. `_config.yml` is added with an `exclude:` list that silently drops `*.jsx`, `settings.js`, `wikidata-api-browser.js`, etc. from the published site.

## Issue #31

The demo links 404 because of the `exclude:` regression. Case study at `docs/case-studies/issue-31/`. PR #32 fixes the exclusion list and the broken imports in the cache and search demos.

## Issue #33 (this case study)

The cumulative effect of the per-demo proliferation is now hard to keep consistent. The issue asks us to:

1. Consolidate the user-facing demos under a single SPA with a mode switcher.
2. Add three new user-facing modes that don't exist yet (alphabet, dictionary, ontology).
3. Add IPA display mode to the entity / property browsers and unify the transformer's styling.
4. Hide the internal-only pages (cache demos, test runners, n-gram tests) from the landing page.
5. Adopt the CI/CD patterns from the two reference templates so a future issue-31 doesn't ship to production.
6. Compile a case study under `docs/case-studies/issue-33/`.

## PR #34

This PR delivers the work for issue #33 on branch `issue-33-3f5cf1139fe7`. Initial commits focus on (i) the case study, (ii) the unified SPA, (iii) the new GitHub Actions workflows, and (iv) the redirect shells that preserve all existing deep links. Subsequent commits adjust the README to mark internal pages as contributor-only.

## Forward look

Once this PR is merged the project gains:

- A single page that exposes every user-facing capability through a mode switcher.
- A clear pattern for adding new modes (data adapters + a mode component).
- A CI/CD baseline that would have caught the issue-31 regression before merge.
- Three case studies (#29, #31, #33) documenting the project's evolution.
