# Timeline / Sequence of events

All times are commit-author dates (UTC).

| Date | Event |
|---|---|
| 2025-07-18 | `entities.html` and `properties.html` are split into `index.html` (no longer a thing) + external `*.jsx` components (`statements.jsx`, `loading.jsx`) and external ES-module helpers (`settings.js`, `wikidata-api*.js`). Until this date the demos were single-file React + Babel pages with everything inline. Commit `4bdb1d1` introduces the JSX split. |
| 2025-07-18 | Commit `9fa6147` (\"Refactor … to utilize ES6 module imports\") — the page now imports `./settings.js` and `./wikidata-api-browser.js` as ES modules at parse time. From this commit forward the page **cannot render** without those files being served alongside the HTML. |
| 2025-07-27 | Last functional change to the entity / property viewers (commits `b670a1b`, `b0ea05a`, `093a759`, `fc08e68`). The pages were verified working on `https://deep-assistant.github.io/human-language/` (the previous Pages host before the org rename to `link-assistant`). |
| 2026-04-29 | The repo is moved under the `link-assistant` org. Issue #29 ("Make sure all our demos are listed in README, they are published in GitHub Actions and we have direct links to all demos…") is filed. |
| 2026-04-29 | Commit `0086092` (PR #30) ships the new `index.html` demo gallery and adds `_config.yml`. The new `_config.yml` introduces an `exclude:` list whose intent is to keep Node-only test scripts and JSON dumps out of the published site, but it uses broad globs that also match the runtime modules: `*.jsx`, `settings.js`, `wikidata-api-browser.js`, `unified-cache-browser.js`. **This is the regression that breaks #31.** |
| 2026-04-29 | After the GitHub Pages build of commit `0086092`, the live site no longer serves `settings.js`, `*.jsx`, `wikidata-api-browser.js` or `unified-cache-browser.js`. Every fetch returns 404 from Pages, the React tree fails to mount, and `entities.html` / `properties.html` render as a blank dark page. |
| 2026-04-29 | Issue #31 is opened with a Safari devtools screenshot showing the four 404s and the resulting `TypeError: undefined is not an object (evaluating 'window.StatementComponents.StatementsSection')`. |
| 2026-04-29 | This PR (#32) fixes `_config.yml`, repoints the cache/search demos at the browser-compatible API, fixes broken `./text-*-transformer-*.js` paths, and adds the case study under `docs/case-studies/issue-31/`. |

## Why this regression slipped through

- The exclusion list was added in the same commit that introduced the new landing page; the visible payoff (`index.html` works) overshadowed regression in pages the PR did not touch.
- `entities.html` and `properties.html` work locally with `python3 -m http.server` because there is no Jekyll layer locally — every file in the working tree is served. Only the production GitHub Pages build applies `_config.yml`.
- The two affected pages are the only consumers of `*.jsx` files in the repo, so a `*.jsx` glob silently turned them off.
