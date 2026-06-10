# Text to Wikidata Q/P Transformation

This folder contains the **deployed pages** for the text-to-Q/P transformer. The
transformation source code itself lives in [`/js/src/transformation/`](../js/src/transformation/);
see [the issue #35 case study](../docs/case-studies/issue-35/) for the rationale
behind the layout.

## Files in this folder (deployed by GitHub Pages)

- **index.html** — redirect shim that forwards to the unified SPA
  (`app.html#mode=transformer`), preserving any `?text=…` parameters.
- **test-ngram.html** — standalone HTML test page for n-gram functionality.
- **ngram-feature-summary.md** — documentation of the n-gram feature.

## Source code (in `/js/src/transformation/`)

- **text-to-qp-transformer.js** — main transformation logic with n-gram support.
- **text-transformer-test.js** — test suite for the transformer.
- **test-ngram-demo.mjs** — Node.js demo script for n-gram features.

## Usage

### Web demo
Open `index.html` in a browser; you will be redirected to the unified SPA
(`app.html#mode=transformer`).

### Node.js
```javascript
import { TextToQPTransformer } from './js/src/transformation/text-to-qp-transformer.js';

const transformer = new TextToQPTransformer();
const result = await transformer.transform("Barack Obama was president", {
  maxNgramSize: 3  // consider up to 3-word phrases
});
```

## Features

- **N-gram matching**: recognises multi-word phrases as single entities.
- **Priority-based search**: longer matches take precedence.
- **Configurable**: adjust `maxNgramSize` (1–5) for different matching behaviour.
- **Caching**: uses the shared cache in `/data/wikidata-cache/`.

## Running tests

From the project root:

```bash
node js/scripts/run-tests.mjs              # full transformer suite (live Wikidata)
node js/src/transformation/test-ngram-demo.mjs  # n-gram-only demo
npm run test:unit                          # gating unit suites
```
