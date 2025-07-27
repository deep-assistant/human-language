# Text to Wikidata Q/P Transformation

This folder contains all the code related to transforming English text into sequences of Wikidata entities (Q) and properties (P).

## Files

- **index.html** - Interactive web demo for the text transformer
- **text-to-qp-transformer.js** - Main transformation logic with n-gram support
- **text-transformer-test.js** - Test suite for the transformer
- **test-ngram.html** - HTML test page for n-gram functionality
- **test-ngram-demo.mjs** - Node.js demo script for n-gram features
- **ngram-feature-summary.md** - Documentation of the n-gram feature

## Usage

### Web Demo
Open `index.html` in a web browser to use the interactive demo.

### Node.js
```javascript
import { TextToQPTransformer } from './text-to-qp-transformer.js';

const transformer = new TextToQPTransformer();
const result = await transformer.transform("Barack Obama was president", {
  maxNgramSize: 3  // Consider up to 3-word phrases
});
```

## Features

- **N-gram matching**: Recognizes multi-word phrases as single entities
- **Priority-based search**: Longer matches take precedence
- **Configurable**: Adjust maxNgramSize (1-5) for different matching behavior
- **Caching**: Uses the shared cache in the root `/data/wikidata-cache/` directory

## Tests

Run tests from the project root:
```bash
bun run-tests.mjs
```

Or run the n-gram demo:
```bash
bun transformation/test-ngram-demo.mjs
```