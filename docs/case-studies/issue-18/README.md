# Case Study — Issue #18

> **Issue:** [link-assistant/human-language#18](https://github.com/link-assistant/human-language/issues/18)
> "Learn from Abstract Wikipedia development"
> **Pull request:** [#19](https://github.com/link-assistant/human-language/pull/19)
> **Branch:** `issue-18-ef8b353c`

## Summary

Issue #18 asked us to learn from the [Abstract Wikipedia /
Wikifunctions](https://meta.wikimedia.org/wiki/Abstract_Wikipedia)
project. The first half of the work (see
[`research/`](../../../research)) gathered fresh 2025–2026 research and a
feature-gap analysis. This half acts on that analysis: it **implements**
the most valuable missing capability the research surfaced — the reverse
of our existing Text → Q/P transformer.

Until now the project could only do *analysis* (English text → a sequence
of Wikidata entities and properties). Abstract Wikipedia's core idea is
the other direction: hold meaning in a language-independent, typed form
and *render* it into natural language in many languages. That direction —
**generation** — is what closes the round-trip the README vision depends
on ("Language of Meaning", "Zero-Cost Translation").

## What shipped

A new **Generation** service (Q/P → text), built in the project's
established style — pure data layer, an injectable renderer, offline-first
unit tests, package subpath exports, hand-written type declarations, a
unified-SPA mode, a legacy redirect shell, and e2e coverage.

| Layer | File |
| --- | --- |
| Typed constructors + multi-language templates (pure, dependency-free) | [`js/src/generation/constructors.js`](../../../js/src/generation/constructors.js) |
| The renderer (`QPRenderer`) | [`js/src/generation/qp-to-text.js`](../../../js/src/generation/qp-to-text.js) |
| Batch labels + lexeme search on the Wikidata client | [`js/src/wikidata-api.js`](../../../js/src/wikidata-api.js), [`js/src/wikidata-api-browser.js`](../../../js/src/wikidata-api-browser.js) |
| Typed-constructor output from the transformer (negation/tense) | [`js/src/transformation/text-to-qp-transformer.js`](../../../js/src/transformation/text-to-qp-transformer.js) |
| SPA mode | [`js/src/app/modes/generation.jsx`](../../../js/src/app/modes/generation.jsx) |
| Legacy redirect shell | [`generation/index.html`](../../../generation/index.html) |
| Unit tests (offline) | [`js/tests/unit/qp-to-text.test.mjs`](../../../js/tests/unit/qp-to-text.test.mjs) |
| e2e tests | [`js/tests/e2e/app.spec.mjs`](../../../js/tests/e2e/app.spec.mjs) |

## Documents in this case study

| File | Purpose |
| --- | --- |
| [`requirements.md`](./requirements.md) | Every requirement extracted from the issue and its PR comments, with status. |
| [`architecture.md`](./architecture.md) | How the generation service is structured and which Abstract-Wikipedia concepts it maps to. |

## The Abstract-Wikipedia concepts we adopted

* **Constructors** — typed containers with named argument *roles*
  (`instance_of`, `located_in`, `relation`). Our `CONSTRUCTORS`
  catalogue mirrors this.
* **Templatic renderers** — one template per constructor *per language*.
  We ship the six official UN languages (en, ar, es, fr, ru, zh), the
  same demonstration set Abstract Wikipedia uses for its first
  natural-language-generation "semantic fragments" (e.g. Z26039 "Berlin
  is a city").
* **Grow the grammar incrementally** — we deliberately start with a
  handful of high-value constructors plus English `a`/`an` phonotactics
  as the first grammatical feature, exactly the way Abstract Wikipedia
  grew its grammar.

## Round-trip in one example

```
"Berlin is a city"        (English text)
   → transformToConstructor → { type: 'instance_of', subject: 'Berlin', object: 'city' }
   → QPRenderer.renderAll →
        en: Berlin is a city      es: Berlin es un city
        fr: Berlin est un city    ru: Berlin — city
        zh: Berlin是city          ar: Berlin city
```

(With Wikidata ids in the roles instead of plain text, each label is
resolved in the target language before rendering.)
