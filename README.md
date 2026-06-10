# Human Language Project

> A sophisticated web application for transforming natural language into Wikidata entity and property sequences, enabling semantic understanding and knowledge representation.

🌐 **Live site:** <https://link-assistant.github.io/human-language/>

## 🎬 Demos

The whole project is published to GitHub Pages as a single unified single-page application — open <https://link-assistant.github.io/human-language/> and switch modes from the top tab bar.

### Unified SPA (the public app)

| Mode | Description | Source |
| ---- | ----------- | ------ |
| [Alphabet](https://link-assistant.github.io/human-language/app.html#mode=alphabet) | Each letter at ≥50 % of the viewport, with IPA pronunciation and keyboard navigation. | [`js/src/app/modes/alphabet.jsx`](js/src/app/modes/alphabet.jsx) |
| [Dictionary](https://link-assistant.github.io/human-language/app.html#mode=dictionary) | Definitions merged from the Free Dictionary API and Wiktionary, with an IPA-only display toggle. | [`js/src/app/modes/dictionary.jsx`](js/src/app/modes/dictionary.jsx) |
| [Ontology](https://link-assistant.github.io/human-language/app.html#mode=ontology) | Walk Wikidata's *subclass of* tree, rooted at <em>entity</em> (Q35120). Cycles are allowed and flagged. | [`js/src/app/modes/ontology.jsx`](js/src/app/modes/ontology.jsx) |
| [Entities](https://link-assistant.github.io/human-language/app.html#mode=entity) | Browse any Wikidata Q-id, with IPA toggle and an inline test runner. | [`js/src/app/modes/entity.jsx`](js/src/app/modes/entity.jsx) |
| [Properties](https://link-assistant.github.io/human-language/app.html#mode=property) | Same lens as Entities but for P-ids. | [`js/src/app/modes/property.jsx`](js/src/app/modes/property.jsx) |
| [Text → Q/P Transformer](https://link-assistant.github.io/human-language/app.html#mode=transformer) | Turn English text into a sequence of Wikidata entities (Q) and properties (P), with n-gram support. | [`js/src/app/modes/transformer.jsx`](js/src/app/modes/transformer.jsx) |
| [Q/P → Text Generation](https://link-assistant.github.io/human-language/app.html#mode=generation) | The reverse direction: render a typed constructor (subject · predicate · object, or a subject · value · unit measurement, with negation, tense and Romance gender agreement) into sentences across the six official UN languages. | [`js/src/app/modes/generation.jsx`](js/src/app/modes/generation.jsx) |

The legacy URLs (`entities.html`, `properties.html`, `transformation/index.html`, `generation/index.html`, and bare hashes like `entities.html#Q35120`) still work — they now redirect into the unified SPA preserving any parameters.

### Internal pages (for contributors)

These are intentionally not linked from the main app, but remain on GitHub Pages so contributors can keep running them while we migrate everything into the SPA:

| Page | Description | Source |
| ---- | ----------- | ------ |
| [N-gram Transformer Test](https://link-assistant.github.io/human-language/transformation/test-ngram.html) | Compare transformer results across n-gram sizes 1–5. | [`transformation/test-ngram.html`](transformation/test-ngram.html) |
| [Search & Disambiguation](https://link-assistant.github.io/human-language/search-demo.html) | Exact and fuzzy Wikidata search with context-aware ranking. | [`search-demo.html`](search-demo.html) |
| [Caching Demo](https://link-assistant.github.io/human-language/cache-demo.html) | Visualize the unified cache layer (file-system + IndexedDB) in action. | [`cache-demo.html`](cache-demo.html) |
| [Browser Cache Test](https://link-assistant.github.io/human-language/browser-cache-test.html) | Stress-test the IndexedDB-backed browser cache. | [`browser-cache-test.html`](browser-cache-test.html) |
| [Test Runner (browser)](https://link-assistant.github.io/human-language/run-tests.html) | Run the automated test suites in the browser, no toolchain required. | [`run-tests.html`](run-tests.html) |

## 🎯 Vision

The Human Language project aims to create a universal meta-language that bridges all human languages by leveraging Wikidata's semantic knowledge graph. By converting natural language into sequences of entities (Q) and properties (P), we enable:

- **Cross-linguistic understanding**: Unified representation across all languages
- **Semantic precision**: Disambiguation of concepts using Wikidata's rich ontology
- **Knowledge integration**: Direct connection to the world's largest open knowledge base
- **IPA support**: Universal phonetic representation for true language unification

### Long-term Impact

This project will fundamentally transform how we store, access, and verify human knowledge:

1. **Universal Encyclopedia**: Merge all Wikipedia content into a single, instantly translatable knowledge base
2. **Language of Meaning**: Create formal definitions for every concept, enabling perfect translation without AI
3. **Fact-Checking Foundation**: Build the world's largest facts database for verifying AI outputs
4. **Knowledge Preservation**: Unify all article versions to preserve the best of human knowledge
5. **AI Training Dataset**: Provide structured knowledge for next-generation neural networks
6. **Zero-Cost Translation**: Enable LLMs to answer once and translate infinitely through semantic representation

## 🚀 Key Features

### 1. Text-to-Q/P Transformation
- **N-gram support**: Recognizes multi-word phrases as single entities
- **Configurable matching**: Adjust n-gram size (1-5) for optimal results
- **Priority-based search**: Longer matches take precedence
- **Real-time transformation**: Interactive web demo at `transformation/index.html`
- [Learn more →](transformation/README.md)

### 2. Q/P-to-Text Generation (reverse renderer)
- **Closes the round-trip**: the reverse of the transformer — typed meaning → natural-language text
- **Abstract-Wikipedia-style constructors**: typed containers (`instance_of`, `located_in`, `relation`, `quantity`) with named roles — including a `quantity` measurement constructor (`subject` · `value` · `unit`) mirroring a Wikidata quantity claim
- **Multi-language rendering**: one templatic renderer per constructor-per-language across the six official UN languages (en, ar, es, fr, ru, zh)
- **Grammatical features**: negation, tense, English `a`/`an` indefinite-article phonotactics, and Romance gender agreement (es `un`/`una`, fr `un`/`une`)
- **Offline-friendly**: role values may be Wikidata ids (resolved to labels) or plain text (rendered verbatim, no network)
- Interactive web demo at `app.html#mode=generation`; library entry point [`human-language/generate`](js/src/generation/qp-to-text.js)

### 3. Entity & Property Viewer
- **Beautiful UI**: Modern, responsive interface with dark/light themes
- **Multi-language support**: Automatic language detection and switching
- **Rich statements display**: View all properties and relationships
- **Direct Wikidata links**: Seamlessly navigate to source data
- View entities at `entities.html` and properties at `properties.html`

### 4. Advanced Search & Disambiguation
- **Exact & fuzzy matching**: Find entities even with typos
- **Context-aware ranking**: Domain and type preferences
- **Batch searching**: Efficient parallel searches
- **Multi-language search**: Search in any supported language
- [API Documentation →](SEARCH_README.md)

### 5. Intelligent Caching System
- **Multi-tier caching**: File system (Node.js) and IndexedDB (browser)
- **Automatic fallback**: Seamless switching between cache types
- **Performance optimized**: Reduces API calls and improves response times
- **Cross-platform**: Works in both Node.js and browser environments
- **Persistent storage**: Cached data survives across sessions

### 6. Comprehensive Language Support
- **100+ languages**: Full support for all major Wikidata languages
- **Locale-specific quotes**: Proper quotation marks for each language
- **Flag emojis**: Visual language indicators for better UX
- **Language persistence**: Settings saved in localStorage

## 📋 Roadmap

Based on our [GitHub issues](https://github.com/link-assistant/human-language/issues), here's our development roadmap:

### Phase 1: Core Infrastructure Enhancement
- [ ] **Rename properties to relations/links** ([#12](https://github.com/link-assistant/human-language/issues/12))
  - Better semantic clarity for relationships between entities
  - Update UI and API to reflect new terminology

### Phase 2: Enhanced Language Support
- [ ] **IPA Translation Support** ([#1](https://github.com/link-assistant/human-language/issues/1))
  - Integrate International Phonetic Alphabet for universal pronunciation
  - Enable true cross-linguistic unification
  
- [ ] **Words Page Development** ([#14](https://github.com/link-assistant/human-language/issues/14))
  - Display words in native language and IPA
  - List all entities a word can represent
  - Support alternative names/words for entities ([#10](https://github.com/link-assistant/human-language/issues/10))

### Phase 3: Advanced Features
- [ ] **Automatic Description Conversion** ([#11](https://github.com/link-assistant/human-language/issues/11))
  - Convert natural language descriptions into Q/P sequences
  - Enable semantic analysis of any text
  
- [ ] **Statements Viewer** ([#3](https://github.com/link-assistant/human-language/issues/3))
  - Display confirmations and refutations for each statement
  - Build trust through community validation

### Phase 4: External Integration
- [ ] **Wikidata Links API Access** ([#15](https://github.com/link-assistant/human-language/issues/15))
  - Direct API-style access to Wikidata relationships
  - Enable programmatic knowledge graph traversal
  
- [ ] **Formal Ontology Integration** ([#17](https://github.com/link-assistant/human-language/issues/17))
  - Research and integrate best formal upper ontology
  - Enhance semantic reasoning capabilities

### Phase 5: Advanced Knowledge Representation
- [ ] **Cascade Triplets Support**
  - Implement cascade triplets (not natively supported by Wikidata)
  - Enable complex relationship chains and hierarchical knowledge
  
- [ ] **Language of Meaning**
  - Transform human language into universal sequence of meaning
  - Create consistent formal definitions for every entity and property
  - Enable algorithmic translation to any language without LLMs
  
- [ ] **Wikidata Contribution Pipeline**
  - Refine and validate transformed data
  - Contribute improvements back to Wikidata
  - Automated gap filling and error correction

### Phase 6: Universal Encyclopedia Project
- [ ] **Wikipedia Content Merger**
  - Merge all Wikipedia pages into single universal encyclopedia
  - Instant translation to any language using only Wikidata
  - No dependency on LLMs or GPTs for translation
  
- [ ] **Version Unification**
  - Merge all article versions into comprehensive single versions
  - Preserve best content from all language editions
  - Create most comprehensive human knowledge database
  
- [ ] **Neural Network Dataset**
  - Prepare advanced dataset for future AI training
  - Structured knowledge representation for next-gen models

### Phase 7: Fact-Checking Infrastructure
- [ ] **World's Largest Facts Database**
  - Build comprehensive fact-checking foundation
  - Enable verification of LLM/GPT outputs
  
- [ ] **LLM Translation Pipeline**
  - LLMs answer in English → Language of Meaning → Any human language
  - Zero additional LLM cost for multilingual support
  - Guaranteed semantic accuracy across languages

## 🏗️ Architecture Overview

### Core Components

1. **Wikidata API Client** (`js/src/wikidata-api.js`)
   - Handles all Wikidata API interactions
   - Configurable caching strategies
   - Batch request optimization

2. **Text Transformer** (`js/src/transformation/text-to-qp-transformer.js`)
   - N-gram generation and matching
   - Parallel search execution
   - Priority-based result merging
   - Typed-constructor output (`transformToConstructor`) with negation, tense, question (`detectQuestion`) and quantity (`extractQuantities`) detection, plus adjacent-duplicate collapsing (`dedupeSequence`)

3. **Q/P → Text Renderer** (`js/src/generation/qp-to-text.js`, `js/src/generation/constructors.js`)
   - Typed constructors with named roles (Abstract-Wikipedia-style), including a `quantity` measurement constructor
   - One templatic renderer per constructor-per-language across the UN 6 languages
   - Negation, tense, English `a`/`an` phonotactics and Romance gender agreement (`un`/`una`, `un`/`une`)
   - Batch label resolution via the Wikidata client (`getLabels`), pluggable for offline use

4. **Search Utilities** (`js/src/wikidata-api.js`)
   - Exact and fuzzy search algorithms
   - Context-aware ranking system
   - Multi-language support

5. **Caching System** (`js/src/unified-cache.js`)
   - Factory pattern for cache creation
   - File system cache for Node.js
   - IndexedDB cache for browsers

6. **UI Components** (`js/src/statements.jsx`, `js/src/loading.jsx`)
   - React 19 components with JSX
   - No build step required (Babel in-browser)
   - Responsive and theme-aware design

### Data Flow

```
User Input → Text Transformer → N-gram Generator → Parallel Search
                                                           ↓
                                                    Wikidata API
                                                           ↓
                                                     Cache Layer
                                                           ↓
                                                   Result Merger
                                                           ↓
                                                    UI Display
```

## 🛠️ Technical Details

### Dependencies
- **React 19**: Latest features via ESM.sh CDN
- **Babel Standalone**: In-browser JSX transformation
- **No build step**: Direct browser execution

### Browser Support
- Modern browsers with ES6+ support
- IndexedDB for caching
- Fetch API for network requests

### Node.js Support
- Version 18+ recommended
- File system caching
- Native fetch support

## 🚦 Getting Started

### Quick Start
1. Clone the repository
2. Open `entities.html` in a web browser
3. Start exploring Wikidata entities!

### For Developers
```bash
# Run gating unit tests (zero deps)
npm run test:unit

# Run gating E2E tests (boots a local static server + Playwright)
npm run test:e2e:local

# Syntax-check every .mjs/.js module
npm run test:syntax

# Live integration test runners (hit the real Wikidata API)
node js/scripts/run-tests.mjs
node js/src/transformation/test-ngram-demo.mjs
node js/scripts/comprehensive-test.mjs
node js/scripts/e2e-test.mjs
node js/scripts/limitation-test.mjs
```

### Interactive Demos

See the [🎬 Demos](#-demos) section above for the full table — every demo is hosted at `https://link-assistant.github.io/human-language/<file>`.

- **Entity Viewer** — [`entities.html`](https://link-assistant.github.io/human-language/entities.html)
- **Property Viewer** — [`properties.html`](https://link-assistant.github.io/human-language/properties.html)
- **Text Transformer** — [`transformation/index.html`](https://link-assistant.github.io/human-language/transformation/index.html)
- **Q/P → Text Generation** — [`app.html#mode=generation`](https://link-assistant.github.io/human-language/app.html#mode=generation)
- **N-gram Test** — [`transformation/test-ngram.html`](https://link-assistant.github.io/human-language/transformation/test-ngram.html)
- **Search Demo** — [`search-demo.html`](https://link-assistant.github.io/human-language/search-demo.html)
- **Caching Demo** — [`cache-demo.html`](https://link-assistant.github.io/human-language/cache-demo.html)
- **Browser Cache Test** — [`browser-cache-test.html`](https://link-assistant.github.io/human-language/browser-cache-test.html)
- **Browser Test Runner** — [`run-tests.html`](https://link-assistant.github.io/human-language/run-tests.html)

## ⚠️ Known Limitations

The text transformation system currently has some limitations:

1. **Negation handling**: The raw Q/P sequence does not encode negation — but `transformToConstructor` now detects it and the generation renderer expresses it ("X is not a Y")
2. **Question parsing**: Direct questions (who, what, when) aren't supported
3. **Verb tenses**: The raw sequence drops tense — `transformToConstructor` detects past/present/future and the renderer inflects the copula where grammatical (e.g. English "X was a Y", "X will be a Y", and the Spanish/French/Russian/Arabic equivalents). Languages that need noun-case morphology for a given tense (e.g. Russian/Arabic *instance_of* past) fall back to the present form, pending the Wikidata Lexeme integration tracked in `research/`
4. **Pronoun resolution**: Cannot resolve pronouns like "he", "she", "it"
5. **Complex sentences**: Struggles with subordinate clauses

See `limitations-found.json` for detailed test results.

## 📚 Documentation

- [Search & Disambiguation API](SEARCH_README.md)
- [Text Transformation Guide](transformation/README.md)
- [N-gram Feature Documentation](transformation/ngram-feature-summary.md)

## 📊 Performance & Testing

The project includes comprehensive test suites with excellent results:

- **API Pattern Tests**: 100% success rate (8/8 tests passing)
- **N-gram Matching**: Correctly identifies multi-word entities
- **Disambiguation**: Handles ambiguous terms with multiple alternatives
- **Caching Efficiency**: Significant performance improvements with persistent cache

Test results are stored in `api-patterns.json` showing real-world transformation examples.

## 🤝 Contributing

We welcome contributions! Check our [issues](https://github.com/link-assistant/human-language/issues) for areas where you can help.

## 📄 License

This project is released into the public domain under The Unlicense.

This means you are free to:
- Copy, modify, publish, use, compile, sell, or distribute this software
- Use it for any purpose, commercial or non-commercial
- Do so without any restrictions or attribution requirements

For more information, see [The Unlicense](https://unlicense.org)

---

*Building bridges between human languages through semantic understanding.*
