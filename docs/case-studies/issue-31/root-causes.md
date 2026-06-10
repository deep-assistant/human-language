# Root-cause analysis

There is **one** primary root cause and three secondary, latent bugs that the audit (R3) surfaced.

## Primary cause: Jekyll `exclude:` glob removes runtime modules

`_config.yml` introduced in commit `0086092` contained:

```yaml
exclude:
  - node_modules
  - data
  - api-patterns.json
  - limitations-found.json
  - "*.mjs"
  - "*.jsx"
  - settings.js
  - persistent-cache.js
  - search-test.js
  - unified-cache.js
  - unified-cache-browser.js
  - unified-cache-test.mjs
  - wikidata-api.js
  - wikidata-api-browser.js
  - .gitkeep
```

Jekyll's `exclude:` is the **inverse of `include:`** — every entry causes the matching path to be omitted from `_site/`. The glob `*.jsx` matches `statements.jsx` and `loading.jsx`. The explicit entries `settings.js`, `wikidata-api-browser.js` and `unified-cache-browser.js` further remove the modules that the React app *requires at runtime*. Result on production:

| Resource | URL | Status |
|---|---|---|
| `entities.html` | `https://link-assistant.github.io/human-language/entities.html` | 200 (HTML loads) |
| `settings.js` | `https://link-assistant.github.io/human-language/settings.js` | **404** |
| `wikidata-api-browser.js` | `https://link-assistant.github.io/human-language/wikidata-api-browser.js` | **404** |
| `statements.jsx` | `https://link-assistant.github.io/human-language/statements.jsx` | **404** |
| `loading.jsx` | `https://link-assistant.github.io/human-language/loading.jsx` | **404** |

Because `entities.html` declares its module imports synchronously at parse time:

```html
<script type="module">
  import { STORAGE_KEYS, ... } from './settings.js';
  import { client as apiClient, ... } from './wikidata-api-browser.js';
  ...
</script>
<script type="text/babel" src="statements.jsx"></script>
<script type="text/babel" src="loading.jsx"></script>
```

…the failed `import` rejects with a TypeError, the babel transformer logs `Could not load …/loading.jsx`, the inline component code dereferences `window.StatementComponents.StatementsSection` (undefined), and the React tree never mounts. The user sees a blank dark page — exactly what is visible behind the devtools panel in the issue screenshot.

## Why the same config breaks four more demos

The audit walked every link on `index.html`. Three more pages had at least one broken module reference (independent of this regression but uncovered by it):

### Secondary cause #1 — `cache-demo.html` imports a Node-only module

`cache-demo.html` imports `./unified-cache.js`, which is the **Node version** of the cache (`import { promises as fs } from 'fs'` two levels deep). Even with the file served by Pages, the browser cannot import a module that depends on `fs` and `crypto`. There is a browser-safe twin (`unified-cache-browser.js`, re-exported as `CacheFactory` from `wikidata-api-browser.js`).

### Secondary cause #2 — `search-demo.html` imports the Node-only Wikidata API

`search-demo.html` imports `./wikidata-api.js` and `./search-test.js`, both of which transitively import `persistent-cache.js` (Node-only). The browser version is `wikidata-api-browser.js`.

### Secondary cause #3 — broken relative paths in two demos

- `cache-demo.html` imports `./text-to-qp-transformer.js`, but that file lives at `transformation/text-to-qp-transformer.js`. The page never worked from the site root.
- `run-tests.html` imports `./text-transformer-test.js`, but that file lives at `transformation/text-transformer-test.js`. Same problem.

These two are unrelated to the Jekyll exclusion list — they are simple path bugs that have always returned 404, but they survived undetected because nobody clicked through every demo from the new gallery.

## Why nobody caught it earlier

- **Local dev does not run Jekyll.** A plain `python3 -m http.server` (and most file-watcher dev servers) serve every file in the working tree. The exclusion list is applied only when `github-pages` Jekyll renders `_site/`.
- **The exclude list was a side-quest in PR #30.** The PR's headline change was the new landing page; the exclude list was meant to keep noise (test scripts, cache JSON dumps) out of `_site/`. The author did not have a checklist of "files imported by a published HTML page".
- **The two failing pages had no smoke test.** No CI step opens `entities.html` or `properties.html` after Pages publishes.
