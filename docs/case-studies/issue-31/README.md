# Case Study: Issue #31

> Source: [link-assistant/human-language#31](https://github.com/link-assistant/human-language/issues/31)
>
> Title: *We need to click all links in our landing page, and make sure it is working*

## Contents

- `issue-31.json` — full issue payload at the time of analysis.
- `issue-screenshot.png` — the original screenshot attached to the issue (Safari devtools showing 404s and a `TypeError`).
- `pr-32.json` — metadata for the work-in-progress PR that addresses this issue.
- `pages-config.json` — GitHub Pages configuration for the repository.
- `pages-builds.json` — full history of GitHub Pages builds (used to rule out the build pipeline as a cause).
- `repo-info.json` — repository metadata.
- `live-entities-snapshot.html` — snapshot of `https://link-assistant.github.io/human-language/entities.html` captured while the bug was live.
- `live-properties-snapshot.html` — snapshot of `https://link-assistant.github.io/human-language/properties.html` captured while the bug was live.
- `timeline.md` — reconstructed sequence of events that led to the regression.
- `requirements.md` — every requirement the issue explicitly or implicitly imposes.
- `root-causes.md` — root-cause analysis for each broken page.
- `solution-plans.md` — proposed solutions plus alternatives and known components that can help.
- `external-research.md` — external facts, references and prior art (Jekyll exclusion semantics, GitHub Pages publishing model).
- `reproduction.md` — how to reproduce the bug locally, before/after screenshots and verification log.

## Quick summary

Every demo on the landing page (`index.html`) loads its own JavaScript helpers as ES modules from the site root. After the demo gallery PR (#30) introduced the new `_config.yml`, those helpers were silently excluded from publication on GitHub Pages because their filenames matched glob patterns in `exclude:` (`*.jsx`, `settings.js`, `wikidata-api-browser.js`, …). The HTML loaded fine, but every `<script type="module">` import 404'd and the React components exploded with `undefined is not an object (evaluating 'window.StatementComponents.StatementsSection')`.

The fix is twofold:

1. Stop excluding files that are part of the published runtime; only exclude *Node-only* modules that cannot be loaded in a browser anyway (`persistent-cache.js`, `unified-cache.js`, `wikidata-api.js`).
2. Fix the demos that imported the Node-only modules so they import the browser-compatible counterparts (`wikidata-api-browser.js`, `unified-cache-browser.js`) and correct paths that pointed at files that never existed at the site root (`./text-to-qp-transformer.js` → `./transformation/text-to-qp-transformer.js`, `./text-transformer-test.js` → `./transformation/text-transformer-test.js`).

After the fix, all eight demos linked from the landing page open without console errors.
