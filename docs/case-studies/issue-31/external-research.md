# External research

This document collects external facts, references and prior art that informed the root-cause analysis and the chosen fix. It exists so that future contributors who hit the same class of bug can reach the same conclusion in a fraction of the time.

## Jekyll `exclude:` semantics

GitHub Pages builds this site with Jekyll (`jekyll-build-pages` action, version pinned by GitHub). Jekyll's documentation describes the `exclude:` directive as follows:

> **`exclude`** — Exclude directories and/or files from the conversion. These exclusions are relative to the site's source directory and cannot be outside the source directory.
>
> Source: <https://jekyllrb.com/docs/configuration/options/> (under "Global configuration")

Two properties are critical to the regression in #31:

1. **`exclude:` is the inverse of `include:`** — every entry causes the matching path to be omitted from `_site/`. There is no separate "exclude from copy but still allow imports" mode; if a file is excluded it is simply not present on the published site.
2. **Glob expansion follows the `File::fnmatch` rules used by `Jekyll::EntryFilter`** ([`lib/jekyll/entry_filter.rb` in jekyll/jekyll](https://github.com/jekyll/jekyll/blob/master/lib/jekyll/entry_filter.rb)). The pattern `*.jsx` matches every `.jsx` file at every depth from the source root.

Combined, those two properties mean that adding `*.jsx` to `exclude:` silently removes `statements.jsx` and `loading.jsx` from publication. There is no warning at build time and no error in the Pages build log — Jekyll considers the build successful.

### Default Jekyll exclusions

For reference, Jekyll ships with the following default `exclude:` list (from the Jekyll docs link above):

```yaml
exclude:
  - .sass-cache/
  - .jekyll-cache/
  - gemfiles/
  - Gemfile
  - Gemfile.lock
  - node_modules/
  - vendor/bundle/
  - vendor/cache/
  - vendor/gems/
  - vendor/ruby/
```

Notice that the defaults are all directories or specific manifest files, never a glob across an extension that an HTML page might import. The regression in #31 happened when the project's custom `exclude:` was written without that distinction in mind.

### Conclusion

Jekyll's behaviour is correct and matches the documentation. There is no upstream bug to file. The case study still records the surprising-but-correct semantics so a future contributor reading `_config.yml` understands that adding a filename or glob to `exclude:` is equivalent to deleting that file from the published site.

## GitHub Pages publishing model

GitHub Pages publishes the contents of `_site/` (after Jekyll has run) to the configured Pages domain. Two facts shaped the diagnosis:

1. **The Pages build log does not list excluded files.** The log records "Done in 1.2s. Auto-regeneration: disabled." and a list of the rendered pages, but it does not enumerate files that Jekyll skipped. That is why the regression escaped review of the Pages build itself.
   - Reference: [GitHub Pages docs — "About GitHub Pages"](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
2. **Pages aggressively serves only what Jekyll produces.** Once a file is excluded, the published site returns a hard 404 for it (no fallback to the Git tree). This is a deliberate property of the Pages serving layer (`pages-gem`).

## Local dev vs. production divergence

The regression slipped through review because `python3 -m http.server` (the project's documented local-preview tool) serves every file in the working tree without any Jekyll-style filtering. Jekyll's `exclude:` only takes effect during `bundle exec jekyll build` — which the GitHub Pages action runs but the project's developer documentation does not.

Two community-recommended ways to mirror the production filter locally:

- Run `bundle exec jekyll serve` locally instead of `python3 -m http.server`. This is what GitHub Pages itself does and is the most faithful reproduction.
- Use the official [`pages-gem`](https://github.com/github/pages-gem) Docker image, which pins the same Jekyll version GitHub uses.

This case study reproduces the bug locally without installing Ruby by pre-applying the exclusion list with a small shell script (see `reproduction.md`). For the long term, the project should consider documenting the `bundle exec jekyll serve` route in `CONTRIBUTING.md`.

## Related prior art / similar regressions

A search across GitHub Pages and Jekyll issue trackers for "exclude broke" surfaces the same shape of bug repeatedly. None of these is a defect; all are user error of the same family as #31:

- [`jekyll/jekyll#5450` — "Exclude pattern with leading wildcard …"](https://github.com/jekyll/jekyll/issues/5450) (closed as expected behaviour). User added `*.json` to `exclude:` and was surprised that `feed.json` no longer published.
- [`github/pages-gem#618`](https://github.com/github/pages-gem/issues/618) (similar shape; closed as expected behaviour).
- StackOverflow: ["Why is Jekyll not copying my `.js` file?"](https://stackoverflow.com/questions/22023951/jekyll-include-files-with-leading-underscore) — same surprise, same answer.

The takeaway is consistent across all of these: **never add a file extension or filename glob to `exclude:` if any HTML page in the source tree imports a file matching that pattern**. The only safe globs to exclude are those that match Node-only modules, build artefacts or developer scratch files that no published HTML page imports.

## Browser vs. Node module compatibility

The secondary causes (`cache-demo.html`, `search-demo.html`) were caused by importing Node-only modules into a browser context. The relevant constraints:

- `unified-cache.js` imports `node:fs/promises` and `node:crypto`. Browsers cannot resolve `node:` specifiers and there is no built-in browser polyfill for `fs`. The only options are (a) bundle with a Node-polyfill plugin or (b) hand-write a browser version. The project already has the second option (`unified-cache-browser.js` uses IndexedDB).
- `wikidata-api.js` imports `unified-cache.js` transitively, so it inherits the same problem.
- The browser twins (`unified-cache-browser.js`, `wikidata-api-browser.js`) re-export the same public surface, so swapping the import is a one-line fix per page.

References:

- MDN — [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) (the `import` resolution rules).
- Node.js — [Built-in modules](https://nodejs.org/api/modules.html#built-in-modules) (lists the `node:` specifiers that have no browser equivalent).

## Existing tools that would have caught this in CI

| Need | Tool | Outcome on this regression |
|---|---|---|
| HTTP link checker for static sites | `lychee` ([github.com/lycheeverse/lychee](https://github.com/lycheeverse/lychee)) | Would have flagged the four 404s on the first push of commit `0086092`. |
| HTML/asset checker | `htmltest` ([github.com/wjdp/htmltest](https://github.com/wjdp/htmltest)) | Same outcome as `lychee`. |
| HTML proofer | `html-proofer` ([github.com/gjtorikian/html-proofer](https://github.com/gjtorikian/html-proofer)) | Would have flagged the missing JS files. The Jekyll community frequently uses it. |
| Real-browser smoke test | `@playwright/test` (already used locally for the screenshots in this PR) | Would have caught the JS-side `TypeError`, even on a regression that didn't change network status (e.g. a JS bug introduced by an inline edit). |

These are listed in `solution-plans.md` under "Follow-ups (not in scope of this PR)". The minimal viable guard is a 50-line node script that walks every `<script type="module">` and `import 'X'` reference and asserts the file exists in `_site/`; if the project decides not to depend on a third-party tool, that script is the cheapest possible insurance.
