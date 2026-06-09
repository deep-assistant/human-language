# Learning from Abstract Wikipedia Development

## Executive Summary

Abstract Wikipedia, launched with Wikifunctions in July 2023, offers valuable lessons for the human-language project. This analysis identifies key improvements and strategies that could accelerate development or enhance the semantic transformation approach.

> **Companion document:** For the concrete, actionable output of this analysis — a feature-gap map and per-service quality improvements — see [`missing-features-and-improvements.md`](./missing-features-and-improvements.md).

## 2025–2026 Status Update (Fresh Research)

*This section reflects research gathered in June 2026 and supersedes the older training-data-based notes below where they conflict. Full source links are listed in [Sources](#sources).*

### Where the project stands now

- **Wikifunctions** went live to the public on **26 July 2023** — the first new Wikimedia project since 2012. By 2025 contributors from **50+ countries** had created **2,400+ functions**, with names and descriptions in **100+ languages**.
- **2025 focus is the technical foundation for Natural Language Generation (NLG).** The team is building "**semantic fragments**" — small, reusable functions that turn Wikidata data plus a language code into a sentence (e.g. function `Z26039` renders *"Berlin is a city" / "Berlín es una ciudad" / "Flughafen Berlin Brandenburg ist ein Flughafen"*). Progress is tracked across the **"UN 6" languages**: English, Arabic, Spanish, French, Russian, and Chinese.
- A **Natural Language Generation Special Interest Group (NLG SIG)** now meets roughly monthly (4th meeting July 2025, 5th in Sept 2025, continuing into late 2025) to converge on how grammatical features are represented.

### Published roadmap

| Date | Milestone |
|------|-----------|
| Aug 2022 | Wikifunctions Beta |
| Jul 2023 | Wikifunctions in production |
| Apr 2025 | Embedded function-call results enabled on select wikis |
| **Late 2025** | First **live functions for generating simple sentences** in natural languages |
| **2026** | **Soft launch** of Abstract Wikipedia |

### The NLG architecture (the part most relevant to us)

Abstract Wikipedia separates **language-independent meaning** from **language-specific rendering** — the same goal as this project's Q/P sequences, but with a fuller pipeline:

1. **Constructors** — language-agnostic containers of arguments (e.g. `Existence(subject)`); they carry no logic and are community-extensible. Roughly analogous to our Q/P sequence, but **typed and role-labelled** rather than a flat list.
2. **Renderers** — one **templatic renderer per constructor-per-language**, written by the community. Templates mix static text with slots filled by arguments, Wikidata **lexemes**, or other renderers' output.
3. **Syntactic tree** — renderers emit **Universal Dependencies** (or Surface-Syntactic UD) trees of *non-inflected lemmas* with morphological constraints.
4. **Morphological inflection** — grammar specifications inflect lemmas using **Wikidata lexeme** forms / inflection tables; dependency relations use **feature unification** (e.g. a subject relation unifies noun–verb number and person agreement).
5. **Phonotactics** — language-specific sandhi (English *a/an*, French *de + le → du*).
6. **Text assembler** — final spacing, capitalization, and punctuation.

The reference implementation pair is **Ninai** (high-level constructors and item→sense resolution) and **Udiron** (low-level, per-language text manipulation), with grammar logic written in **Lua**.

### Documented risks and criticism (lessons to internalize)

- A **January 2023 Google.org Fellows evaluation** rated the project at **"substantial risk of failure"** for thin technical planning, and recommended (a) decoupling Abstract Wikipedia from Wikifunctions, (b) refining **Lua** rather than inventing new languages, and (c) converging on an existing NLG framework. The Wikimedia Foundation **rejected** these recommendations.
- WMF declined existing frameworks such as **Grammatical Framework**, arguing they under-serve **Niger-Congo B** languages and risk replicating an "English-focused Western-thinking" bias. The trade-off chosen — community-editable templates that **prioritize accessibility over guaranteed grammaticality** — means poorly designed templates *can* emit ungrammatical text. This is a direct, real-world data point on the equity-vs-correctness tension we also face.

## Abstract Wikipedia Project Overview

### Core Architecture
- **Wikifunctions**: Computational functions for data processing
- **Wikidata**: Structured semantic data repository  
- **Abstract Content**: Language-independent article representations
- **Natural Language Generation**: Functions to render content in multiple languages

### Technical Approach
```
Abstract Content → Wikifunctions → Language-Specific Rendering
(Structured Data)   (Processing)    (Human-Readable Text)
```

## Key Lessons for Human-Language Project

### 1. Structured Content Representation

**Abstract Wikipedia Strategy:**
- Uses Wikidata QIDs to represent predicates, participants, and modifiers
- Creates nested list-like structures for complex semantic relationships
- Enables language-agnostic content representation

**Application to Human-Language:**
```javascript
// Current approach in text-to-qp-transformer.js
"Einstein was born in Germany" → ["Q937", "P19", "Q183"]

// Enhanced approach inspired by Abstract Wikipedia
{
  predicate: "P569", // date of birth
  subject: "Q937",   // Einstein
  object: {
    date: "1879-03-14",
    location: "Q183"  // Germany
  },
  context: {
    precision: "day",
    calendar: "Q1985727" // proleptic Gregorian calendar
  }
}
```

### 2. Modular Function Architecture

**Lesson:** Break complex transformations into reusable, composable functions.

**Recommended Implementation:**
```javascript
// Inspired by Wikifunctions approach
class SemanticFunctionLibrary {
  constructor() {
    this.functions = {
      'temporal_relation': this.handleTemporalRelations,
      'spatial_relation': this.handleSpatialRelations,
      'causal_relation': this.handleCausalRelations,
      'identity_relation': this.handleIdentityRelations
    };
  }
  
  // Compose functions for complex semantic structures
  compose(functions, input) {
    return functions.reduce((result, fn) => this.functions[fn](result), input);
  }
}
```

### 3. Lexicographic Integration

**Abstract Wikipedia Focus:** Extensive work with Wikidata Lexemes for linguistic accuracy.

**Recommendation for Human-Language:**
- Integrate Wikidata Lexemes API for better word sense disambiguation
- Use lexicographic data to improve n-gram matching accuracy
- Handle morphological variations and inflected forms

```javascript
// Enhanced search with lexeme support
class EnhancedSearchUtility extends WikidataSearchUtility {
  async searchWithLexemes(term, language = 'en') {
    const [entityResults, lexemeResults] = await Promise.all([
      this.searchEntities(term),
      this.searchLexemes(term, language)
    ]);
    
    return this.mergeAndRankResults(entityResults, lexemeResults);
  }
}
```

### 4. Context-Aware Transformation

**Challenge Identified:** Current system struggles with context-dependent meanings.

**Solution Inspired by Abstract Wikipedia:**
```javascript
// Context-aware transformation with participant roles
class ContextualTransformer {
  async transform(text, context = {}) {
    const parseTree = this.parseSemanticStructure(text);
    const enrichedTree = await this.enrichWithContext(parseTree, context);
    return this.generateQPSequence(enrichedTree);
  }
  
  parseSemanticStructure(text) {
    // Extract predicates, subjects, objects with their roles
    // Similar to Abstract Wikipedia's participant role management
  }
}
```

## Identified Challenges and Solutions

### 1. Language Bias and Equity

**Challenge:** Abstract Wikipedia faces criticism for Indo-European language bias.

**Mitigation Strategy:**
- Prioritize support for diverse language families early in development
- Use Universal Dependencies for syntactic parsing across languages
- Implement cultural context awareness in semantic interpretation

### 2. Community Understanding

**Challenge:** Users confused about machine translation vs. structured generation.

**Solution for Human-Language:**
- Clear documentation distinguishing Q/P transformation from translation
- Interactive demos showing semantic preservation across languages
- Educational materials explaining the "language of meaning" concept

### 3. Technical Integration Complexity

**Challenge:** Complex integration with existing systems and workflows.

**Approach:**
- Start with simple, high-value use cases
- Build backwards-compatible APIs
- Provide clear migration paths from existing text processing

## Specific Improvements for Human-Language

### 1. Enhanced N-gram Processing

```javascript
// Inspired by Abstract Wikipedia's modular approach
class AdvancedNgramProcessor {
  constructor() {
    this.processors = [
      new TemporalNgramProcessor(),
      new SpatialNgramProcessor(), 
      new RelationalNgramProcessor()
    ];
  }
  
  async processNgrams(ngrams) {
    const results = await Promise.all(
      this.processors.map(p => p.process(ngrams))
    );
    return this.mergeResults(results);
  }
}
```

### 2. Semantic Validation System

```javascript
// Quality assurance inspired by Wikifunctions testing
class SemanticValidator {
  async validateTransformation(originalText, qpSequence) {
    const checks = [
      this.validateEntityConsistency(qpSequence),
      this.validatePropertyUsage(qpSequence),
      this.validateSemanticCoherence(originalText, qpSequence)
    ];
    
    return Promise.all(checks);
  }
}
```

### 3. Multi-Language Generation

```javascript
// Generate human-readable text from Q/P sequences
class LanguageGenerator {
  async generateFromQP(sequence, targetLanguage) {
    const template = await this.getLanguageTemplate(targetLanguage);
    const enrichedData = await this.enrichWithLabels(sequence, targetLanguage);
    return this.renderTemplate(template, enrichedData);
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (Immediate)
- [ ] Implement modular function architecture
- [ ] Add lexeme-based disambiguation
- [ ] Create semantic validation framework

### Phase 2: Enhancement (3-6 months)
- [ ] Context-aware transformation system
- [ ] Multi-language generation capabilities
- [ ] Advanced semantic structure parsing

### Phase 3: Integration (6-12 months)
- [ ] Wikidata contribution pipeline
- [ ] Community validation system
- [ ] Performance optimization at scale

## Performance Optimization Lessons

### 1. Caching Strategy
Abstract Wikipedia's approach suggests:
- Cache function results aggressively
- Use incremental updates for dynamic data
- Implement multi-tier caching (browser + server)

### 2. Batch Processing
```javascript
// Optimize API calls like Wikifunctions
class BatchProcessor {
  async processBatch(items, batchSize = 50) {
    const batches = this.chunk(items, batchSize);
    return Promise.all(batches.map(batch => this.processItems(batch)));
  }
}
```

## Risk Mitigation

### Technical Risks
1. **Scalability**: Use proven caching and batch processing patterns
2. **Accuracy**: Implement comprehensive validation and testing
3. **Complexity**: Start simple and iterate based on user feedback

### Community Risks
1. **Adoption**: Focus on clear value propositions and ease of use
2. **Understanding**: Invest in documentation and educational content
3. **Contribution**: Design systems for community validation and improvement

## Conclusion

Abstract Wikipedia's development provides a roadmap for semantic language projects. Key takeaways:

1. **Start with strong foundations**: Modular architecture and semantic validation
2. **Think globally**: Design for multiple languages from the beginning  
3. **Engage communities**: Clear communication and gradual integration
4. **Iterate carefully**: Build on proven patterns while innovating thoughtfully

The human-language project is well-positioned to learn from Abstract Wikipedia's successes and challenges, potentially achieving faster development and better outcomes through these insights.

## Recommended Next Steps

1. Implement lexeme-based disambiguation in the current transformer
2. Add semantic validation to ensure transformation quality
3. Create educational content explaining the semantic transformation approach
4. Design community feedback mechanisms for continuous improvement
5. Plan for multi-language support architecture from the outset

These improvements could significantly accelerate the project's development while avoiding pitfalls encountered by Abstract Wikipedia.

## Sources

Fresh research gathered June 2026:

- [Abstract Wikipedia — Meta-Wiki](https://meta.wikimedia.org/wiki/Abstract_Wikipedia) (roadmap, timeline, project goals)
- [Abstract Wikipedia — Wikipedia](https://en.wikipedia.org/wiki/Abstract_Wikipedia) (launch, architecture, criticism)
- [Natural language generation system architecture proposal — Meta-Wiki](https://meta.wikimedia.org/wiki/Abstract_Wikipedia/Natural_language_generation_system_architecture_proposal) (6-stage NLG pipeline)
- [Wikifunctions:Abstract Wikipedia/2025 fragment experiments](https://www.wikifunctions.org/wiki/Wikifunctions:Abstract_Wikipedia/2025_fragment_experiments) (semantic fragments, `Z26039`, UN 6 languages)
- [Wikifunctions:NLG SIG](https://www.wikifunctions.org/wiki/Wikifunctions:NLG_SIG) (Natural Language Generation Special Interest Group)
- [Using Wikidata Lexemes and Items to Generate Text from Abstract Representations — Mahir Morshed, 2024 (Semantic Web Journal)](https://content.iospress.com/articles/semantic-web/sw243564) (Ninai/Udiron, constructors, renderers)
- [Abstract Wikipedia/Google.org Fellows evaluation — Meta-Wiki](https://meta.wikimedia.org/wiki/Abstract_Wikipedia/Google.org_Fellows_evaluation) (risk-of-failure assessment)
- [Wikifunctions status updates (2025)](https://www.wikifunctions.org/wiki/Wikifunctions:Status_updates/2025-06-21)