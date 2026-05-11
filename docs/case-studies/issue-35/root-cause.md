# Root cause — why the transformer broke

## TL;DR

`js/src/app/modes/transformer.jsx` (originally `app/modes/transformer.jsx`
before the issue-35 file move) was loading the transformer class with a
dynamic `import()` inside a React `useEffect`. The file is compiled in
the browser by `@babel/standalone` with the `env` and `react` presets,
because the deployed site has no build step. The `env` preset, with
default options, **rewrites dynamic `import()` to a CommonJS
`require()` wrapped in `_interopRequireWildcard`**. There is no
`require` in the browser, so the function threw immediately, the
`useEffect`'s `catch` ran, and the component rendered the banner
`Failed to load transformer: require is not defined`.

## The call chain

1. User opens `app.html#mode=transformer`.
2. `app.html` includes `babel-standalone` and tags
   `js/src/app/modes/transformer.jsx` with `data-presets="env,react"`.
3. babel-standalone compiles the JSX in the browser. The compiled
   output contains, for the line that used to be
   `const mod = await import('../../transformation/text-to-qp-transformer.js')`:

   ```js
   var mod = _interopRequireWildcard(require("../../transformation/text-to-qp-transformer.js"));
   ```

   Verified directly in the browser console:

   ```js
   Babel.transform(
     "await import('./x.js')",
     { presets: [['env'], ['react']] }
   ).code
   ```

   …returns a body that contains the `require(` substring above.

4. The component mounts, the effect fires, the `require` lookup misses
   on the browser global object, V8 throws
   `ReferenceError: require is not defined` (Chromium) or
   `Can't find variable: require` (Safari).
5. The `try/catch` inside the effect catches the error and renders
   `Failed to load transformer: ${e.message}` plus a disabled Transform
   button.

## Why this only bites in the deployed/browser path

The same `text-to-qp-transformer.js` file *works under Node and Bun*,
because Node natively understands `import()`. The legacy bun-based test
suite in `js/scripts/run-tests.mjs` therefore passed all the way through
— the test infrastructure had no signal that the deployed site was
broken.

This is why a new browser-level e2e test is critical: it's the only
layer that exercises the babel-standalone-compiled code path. Without
it, any future regression in this same trap would silently ship to
production again.

## The fix

The simplest fix that survives any future babel-standalone preset
changes is to **not run `import()` inside a babel-compiled module at
all**. `app.html` already has its own `<script type="module">` for the
SPA bootstrap — modules loaded there are pure browser ESM and Babel
never sees them. So:

```html
<!-- app.html -->
<script type="module">
  import { TextToQPTransformer }  from './js/src/transformation/text-to-qp-transformer.js';
  import { TextTransformerTest }  from './js/src/transformation/text-transformer-test.js';
  import { demonstrateTransformer } from './js/src/transformation/transformer-demo.js';
  window.HumanLanguageApp = Object.assign(
    window.HumanLanguageApp || {},
    { TextToQPTransformer, TextTransformerTest, demonstrateTransformer },
  );
</script>
```

```jsx
// js/src/app/modes/transformer.jsx — babel-compiled, no dynamic import
const { TextToQPTransformer, TextTransformerTest, demonstrateTransformer } =
  (window.HumanLanguageApp || {});

React.useEffect(() => {
  try {
    if (!TextToQPTransformer) throw new Error('TextToQPTransformer not loaded by app.html');
    setTransformer(new TextToQPTransformer());
  } catch (e) {
    setError(`Failed to load transformer: ${e?.message || e}`);
  }
}, []);
```

`window.HumanLanguageApp` was already a pattern in the codebase (the
ontology & dictionary modes use it for the same reason), so this fix
follows the surrounding style.

## Why this won't silently break again

Three layers of defense:

1. **No dynamic `import()` inside any `.jsx` file** — the file
   `transformer.jsx` only consumes pre-loaded globals. If someone
   reintroduces `import()`, the same banner will appear, and:
2. **A Playwright regression test** asserts the body never contains
   the strings `"Failed to load transformer"` or
   `"require is not defined"`. The test runs in the PR-gate workflow
   on every push, so the failure surfaces before merge.
3. **A second Playwright test** clicks Transform and waits for a
   `Q/P Sequence` panel — that fails if the transformer module is
   unloaded for any reason (not just the `require` bug).

## Why we didn't tell babel-standalone to keep `import()`

You can ask `@babel/preset-env` to leave dynamic imports alone:

```html
<script type="text/babel"
        data-presets="env,react"
        data-plugins="syntax-dynamic-import">…</script>
```

…or pass `{ targets: { esmodules: true } }` so `env` recognises that
the target supports native `import()`. Both work, but both spread the
fix into a configuration string that's easy to lose during a future
refactor. The window-handoff pattern keeps the babel-compiled file
free of any runtime feature that depends on a specific preset
configuration, which is more robust.
