# Reproduction guide

This document explains how to reproduce the bug locally without waiting for a GitHub Pages deploy, how the audit walked every demo, and what the fix looks like in side-by-side screenshots.

## TL;DR

The bug only manifests under Jekyll. A plain `python3 -m http.server` over the working tree serves every file and therefore looks fine. To see the bug, you must filter the served tree the way Jekyll's `_config.yml` `exclude:` directive filters `_site/`.

## Reproduce on the live site (no setup)

While the regression was live, the four 404s could be observed directly:

```bash
for f in settings.js wikidata-api-browser.js statements.jsx loading.jsx; do
  printf '%-30s %s\n' "$f" "$(curl -s -o /dev/null -w '%{http_code}' "https://link-assistant.github.io/human-language/$f")"
done
```

Output during the regression (captured 2026-04-29 ahead of the fix):

```
settings.js                    404
wikidata-api-browser.js        404
statements.jsx                 404
loading.jsx                    404
```

Once this PR merges and Pages republishes, every line above must read `200`. That is the smoke-test for the primary fix.

## Reproduce locally without installing Ruby/Jekyll

A 12-line shell script mirrors the Jekyll exclude filter and serves the result on `localhost:8000`. This was the script used during the audit:

```bash
#!/usr/bin/env bash
# reproduce-issue-31.sh — mirror Jekyll's exclude filter without installing Jekyll.
set -euo pipefail

SRC="$(pwd)"
SIM="${TMPDIR:-/tmp}/jekyll-sim"

rm -rf "$SIM"
mkdir -p "$SIM"

# Copy the working tree, then delete files matching the exclude list from
# _config.yml *as it stood before the fix*. Adjust the list to test a different
# exclude pattern.
cp -R "$SRC"/. "$SIM"/
( cd "$SIM"
  rm -rf node_modules data
  rm -f api-patterns.json limitations-found.json .gitkeep
  find . -name '*.mjs'  -delete
  find . -name '*.jsx'  -delete
  rm -f settings.js persistent-cache.js search-test.js
  rm -f unified-cache.js unified-cache-browser.js
  rm -f wikidata-api.js wikidata-api-browser.js
)

cd "$SIM"
python3 -m http.server 8000
```

Open http://localhost:8000/entities.html — the dark blank page reproduces, devtools shows the same 404s and `TypeError` as the issue screenshot. Edit the script's `rm` section to match the **fixed** `_config.yml` exclude list (only the Node-only modules and `.mjs` test scripts) and the page renders correctly.

## Audit checklist (R1 + R3)

The landing page was walked link by link. The table below is the audit log used to satisfy R1 ("click every link") and R3 ("check all demos for bugs"). Each demo was opened in a real browser via Playwright; "console errors" reflects what `mcp__playwright__browser_console_messages` returned during the first 3 seconds after page load.

| # | Card on `index.html` | Target | Pre-fix status | Post-fix status |
|---|---|---|---|---|
| 1 | Transformation Demo | `transformation/index.html` | OK | OK |
| 2 | N-gram Test | `transformation/test-ngram.html` | OK | OK |
| 3 | Entity Viewer | `entities.html` | **Blank page**, 404 on `settings.js`, `wikidata-api-browser.js`, `statements.jsx`, `loading.jsx`; `TypeError: undefined is not an object (evaluating 'window.StatementComponents.StatementsSection')` | Renders Q35120 with statements |
| 4 | Property Viewer | `properties.html` | **Blank page**, same 404s as #3 | Renders P31 with statements |
| 5 | Search Demo | `search-demo.html` | Loads, but search throws `Cannot resolve module 'fs'` from `wikidata-api.js` import chain | Search returns results |
| 6 | Cache Demo | `cache-demo.html` | Loads, but every action throws `Cannot resolve module 'fs'` from `unified-cache.js`; transformer import 404 (`./text-to-qp-transformer.js`) | Cache + transformer panels work |
| 7 | Browser Cache Test | `browser-cache-test.html` | OK | OK |
| 8 | Run Tests | `run-tests.html` | Loads, "Run all" fails: 404 on `./text-transformer-test.js` (file is at `transformation/text-transformer-test.js`) | All tests pass |

The "OK" rows confirmed there was no broader bug in the demos that survived. The five rows with a non-OK pre-fix status correspond exactly to the changes in this PR (`_config.yml`, `cache-demo.html`, `search-demo.html`, `search-test.js`, `run-tests.html`).

## Before / after screenshots

All screenshots are committed under `docs/screenshots/`.

### `entities.html`

| Before | After |
|---|---|
| ![entities before](../../screenshots/issue-31-entities-before.png) | ![entities after](../../screenshots/issue-31-entities-after.png) |

### `properties.html`

| Before | After |
|---|---|
| ![properties before](../../screenshots/issue-31-properties-before.png) | ![properties after](../../screenshots/issue-31-properties-after.png) |

### `cache-demo.html` and `search-demo.html`

After-fix only — both demos previously surfaced their errors only on user interaction, so a "before" screenshot would just be the empty form.

| `cache-demo.html` | `search-demo.html` |
|---|---|
| ![cache demo after](../../screenshots/issue-31-cache-demo-after.png) | ![search demo after](../../screenshots/issue-31-search-demo-after.png) |

## Verification log

Run after the fix was applied (Playwright, headless Chromium, viewport 1280×720, network idle):

```
[ok] http://localhost:8000/                          0 console errors
[ok] http://localhost:8000/transformation/           0 console errors
[ok] http://localhost:8000/transformation/test-ngram.html  0 console errors
[ok] http://localhost:8000/entities.html             0 console errors, mounted in 412 ms, statements rendered
[ok] http://localhost:8000/properties.html           0 console errors, mounted in 397 ms, statements rendered
[ok] http://localhost:8000/search-demo.html          0 console errors, search 'Berlin' returns 10 results
[ok] http://localhost:8000/cache-demo.html           0 console errors, cache set/get round-trips
[ok] http://localhost:8000/browser-cache-test.html   0 console errors
[ok] http://localhost:8000/run-tests.html            0 console errors, all tests pass
```

The reproduction filter (`reproduce-issue-31.sh`, see above) was rerun with the fixed `_config.yml` exclude list. All eight pages above report identical status under the simulated Jekyll filter, confirming the fix is robust to the production publishing pipeline and not an artefact of local file servers being more permissive than Pages.
