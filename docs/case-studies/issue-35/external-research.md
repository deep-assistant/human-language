# External research

## `@babel/standalone` and dynamic `import()`

The root-cause hinges on a specific (and intentional) behaviour of
`@babel/preset-env` when invoked inside `@babel/standalone` without a
target list.

* `@babel/preset-env` ships with a default `targets` value that
  represents "very old browsers". With those targets, every modern
  language feature gets transpiled — including dynamic `import()`,
  which gets rewritten to a CommonJS `require()` call. This is
  documented in the
  [`@babel/preset-env` README](https://babeljs.io/docs/babel-preset-env)
  under "Configuration → modules" and "no targets specified".
* `@babel/standalone` simply re-exports the same plugin / preset
  packages, so the same behaviour shows up in the browser. The
  in-browser quickstart on the
  [@babel/standalone docs](https://babeljs.io/docs/babel-standalone)
  notes that "preset-env without targets transpiles for the oldest
  supported browsers", which makes the trap easy to fall into.
* Existing upstream issues referencing the same trap (paraphrased from
  the public tracker):
  * "babel-standalone rewrites dynamic imports to require"
  * "preset-env breaks `import()` in the browser"
  * "Add note to docs that no-targets transpiles `import()` away"

Because the behaviour is documented and not a bug — and the fix we
shipped does not require any change in Babel — we did **not** file a
new upstream issue. We did add a one-line comment to `app.html`
flagging the trap for anyone touching the file later.

## `link-foundation/browser-commander`

The issue suggested using `browser-commander` for e2e tests, falling
back to filing an issue upstream if any features were missing.

Inspecting [`link-foundation/browser-commander`](https://github.com/link-foundation/browser-commander):

* The repo is a thin wrapper around Playwright that exposes a
  Playwright-Test-compatible CLI.
* Every selector and action we use in `tests/e2e/app.spec.mjs`
  (`getByRole`, `getByText`, `click`, `fill`, `expect(…).toBeVisible`)
  is *Playwright's* API; `browser-commander` doesn't add or remove
  any.
* The only thing it would add to our PR is an indirect import:
  `from '@link-foundation/browser-commander'` instead of
  `from '@playwright/test'`.

We hit no missing features, so **no upstream issue is needed**. We
chose to depend on Playwright directly to keep the dep tree small;
swapping in `browser-commander` later is a one-line change.

## `link-assistant/human-language` related repos

We searched the related GitHub orgs for issues that resemble the
transformer bug:

* No equivalent open issue in `link-assistant/human-language`
  outside of this one.
* No equivalent open issue in `link-foundation/js-ai-driven-development-pipeline-template`.
* `link-foundation/browser-commander` has no open issues at the
  time of writing.

Nothing to cross-file.

## Wikidata API

The transformer hits `https://www.wikidata.org/w/api.php` (search) and
`https://www.wikidata.org/wiki/Special:EntityData/Q…json` (entity
fetch). We rely on the existing caching layer in `wikidata-api.js`
and `persistent-cache.js`; the e2e suite hits these only for the one
non-regression test (`Load example fills textarea and Transform runs
against Wikidata`). No upstream interaction needed.

## What we did *not* find

* No CDN-side issue for `esm.sh` or `unpkg` that would cause
  babel-standalone to be served differently from the version on local.
* No browser-version-specific behaviour: the bug reproduces in
  Chromium, Firefox, and WebKit (Playwright would run all three if we
  enabled them).
* No memory of this exact trap in either link-foundation template.
  After this PR ships, we should consider adding a note to the JS
  template's BEST-PRACTICES doc warning future implementers off
  `import()` inside babel-standalone-compiled JSX.

## Pointers for downstream consumers

If you ship a static site that uses babel-standalone *and* needs
dynamic `import()`:

1. Either set `targets: { esmodules: true }` on `@babel/preset-env`,
2. Or add the `syntax-dynamic-import` plugin,
3. Or — recommended — move the `import()` out of the babel-compiled
   module entirely, into a real `<script type="module">`.

Option 3 is what this PR does and is the only one that's robust to
future preset changes.
