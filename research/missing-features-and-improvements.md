# Missing Features & Service-Quality Improvements

*Derived from fresh (June 2026) research on Abstract Wikipedia / Wikifunctions — see
[`abstract-wikipedia-analysis.md`](./abstract-wikipedia-analysis.md) for the full background and
[Sources](./abstract-wikipedia-analysis.md#sources).*

This document answers two practical questions:

1. **What features does Abstract Wikipedia have that we are missing — and could support?**
2. **How can we improve the quality of each of our existing services?**

It is intentionally concrete and mapped to files in this repository.

---

## Part 1 — Feature gaps we can close

Abstract Wikipedia and the human-language project share the same core idea: separate
**language-independent meaning** from **language-specific text**. The difference is direction and
depth. We currently do **text → Q/P** (analysis only); Abstract Wikipedia invests most heavily in
**meaning → text** (generation), with a typed, grammar-aware pipeline. The biggest opportunities sit
in the parts of their pipeline we have no equivalent for.

| # | Missing feature | What Abstract Wikipedia does | Where it would live here | Priority |
|---|-----------------|------------------------------|--------------------------|----------|
| 1 | **Reverse generation (Q/P → text)** | Renderers turn a constructor into a sentence in any language (`Z26039` → "Berlin is a city" / "Berlín es una ciudad") | New `generation/qp-to-text.js` service | **High** |
| 2 | **Wikidata Lexeme integration** | Lexemes drive disambiguation and morphological inflection | `wikidata-api.js` (`searchLexemes`), used by transformer + search | **High** |
| 3 | **Typed, role-labelled representation** | Constructors are typed containers with named argument roles, not flat lists | Output schema of `text-to-qp-transformer.js` | **High** |
| 4 | **Universal Dependencies parsing** | Renderers emit/consume UD (or Surface-Syntactic UD) trees | New parsing layer feeding the transformer | Medium |
| 5 | **Multi-language rendering (UN 6)** | Same meaning rendered in English, Arabic, Spanish, French, Russian, Chinese | Generation service templates | Medium |
| 6 | **Modular function composition** | Wikifunctions composes small reusable functions; one templatic renderer per constructor-per-language | `SemanticFunctionLibrary` (sketched in analysis doc) | Medium |
| 7 | **Grammatical features + phonotactics** | Feature unification for agreement; sandhi rules (English *a/an*, French *de+le→du*) | Generation service | Medium |
| 8 | **Embedded live function results** | Function-call results embedded in wiki pages (since Apr 2025) | Demo pages (`entities.html`, etc.) | Low |
| 9 | **Community validation process** | NLG SIG + community-editable templates/grammar | Contribution docs + validation hooks | Low |

### The single highest-leverage gap: reverse generation

We can already parse text into Q/P. We cannot yet render Q/P back into a human sentence in any
language — which is exactly the capability the README's vision ("Zero-Cost Translation", "Language of
Meaning", "LLM Translation Pipeline") depends on. A minimal renderer that closes the loop, mirroring
Abstract Wikipedia's `Z26039` "is-a" fragment:

```javascript
// generation/qp-to-text.js  (sketch)
// Constructor:  { type: 'instance_of', subject: 'Q64', object: 'Q515' }  // Berlin, city
// Renders:      "Berlin is a city" | "Berlín es una ciudad" | "Берлин — город"
class QPRenderer {
  async render(constructor, lang = 'en') {
    const template = TEMPLATES[constructor.type]?.[lang];
    if (!template) throw new Error(`No renderer for ${constructor.type}/${lang}`);
    const labels = await this.api.getLabels(
      [constructor.subject, constructor.object], lang
    );
    return this.applyPhonotactics(this.fill(template, labels, constructor), lang);
  }
}
```

Starting with one constructor (`instance_of`) across the **UN 6** languages is a small, demonstrable
deliverable that proves the round-trip `text → Q/P → text` and directly de-risks the README roadmap.

---

## Part 2 — Per-service quality improvements

### 1. Text-to-Q/P Transformer (`transformation/text-to-qp-transformer.js`)

The transformer currently emits a **flat list** of Q/P ids and skips meaning-bearing words. The
documented limitations in `limitations-found.json` (12/31 cases failing) cluster exactly where
Abstract Wikipedia invests:

- **Negation** ("Einstein did *not* discover gravity" → loses the *not*). Abstract Wikipedia models
  this structurally via constructors; we should attach a `negated: true` flag to the relation rather
  than dropping the token. Today `stopWords`/`propertyIndicators` (lines 30–40) silently discard such
  words.
- **Questions / tenses / pronouns** — also failing. A typed representation (gap #3) with a tense and
  modality slot is the structural fix, not more keyword lists.
- **Lexeme-based disambiguation (gap #2)** would replace the hand-maintained `propertyIndicators`
  array with morphological lookup, handling inflected forms ("wrote" → P50/author) generically.

**Quality win:** change the output from `["Q937", "P19", "Q183"]` to a typed constructor with roles,
preserving negation/tense — turning today's silent failures into representable structure.

### 2. Search & Disambiguation (`wikidata-api.js`, `SEARCH_README.md`)

- Add **`searchLexemes(term, lang)`** alongside entity search and merge/rank results (Abstract
  Wikipedia treats lexemes as first-class). The codebase only touches lexemes as a claim *datatype*
  (`wikidata-api.js:424`) — there is no lexeme *search*.
- Use lexeme forms to **normalize morphology before matching**, improving fuzzy search for inflected
  inputs.

### 3. Entity & Property Viewer (`entities.html`, `properties.html`, `statements.jsx`)

- Surface **lexeme forms and senses** for an entity, and show an **auto-generated example sentence**
  (using the new renderer) so users see meaning rendered, not just ids.
- Adopt Abstract Wikipedia's terminology hint: render **per-language** example output for the UN 6 set.

### 4. Caching System (`unified-cache.js`, `persistent-cache.js`)

- Abstract Wikipedia caches function results aggressively. Add **HTTP `ETag` / conditional-request**
  support and **incremental invalidation** so cached labels/lexemes refresh without full re-fetch.
- Add **batch fetching** (`getLabels([...])`) to cut round-trips for multi-entity renders — required
  by the generation service anyway.

### 5. New service — Multi-language Generation (`generation/`)

This is the missing counterpart to the transformer (gap #1). It should:

- Live in a new `generation/` folder mirroring `transformation/` (templates + tests + demo HTML).
- Start with the `instance_of` constructor across the UN 6 languages.
- Reuse the cache and the new batch label fetch.
- Include phonotactic post-processing (English *a/an*) as the first grammatical feature.

---

## Suggested sequencing

1. **Add `searchLexemes` + batch `getLabels`** (foundation, low risk, helps every service).
2. **Switch transformer output to a typed constructor** preserving negation/tense (fixes documented limitations).
3. **Ship a minimal `generation/qp-to-text.js`** for `instance_of` across UN 6 (proves the round-trip).
4. **Surface example sentences** in the entity/property viewers.
5. **Layer in caching (ETag/incremental) and UD parsing** as the corpus grows.

Each step is independently shippable and testable, following Abstract Wikipedia's own lesson:
**start with simple, high-value fragments and grow the grammar incrementally.**
