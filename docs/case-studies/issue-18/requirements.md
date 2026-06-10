# Requirements — Issue #18

Extracted from the issue body and the binding follow-up comments on PR #19.

## From the issue

> **"Learn from Abstract Wikipedia development"**

| # | Requirement | Status |
| --- | --- | --- |
| R1 | Study Abstract Wikipedia / Wikifunctions and capture the lessons | ✅ `research/abstract-wikipedia-analysis.md`, `research/missing-features-and-improvements.md` |
| R2 | Identify the features it has that we are missing | ✅ Feature-gap table in `research/missing-features-and-improvements.md` |

## From the PR comments (binding)

> **"Get latest fresh data about Abstract Wikipedia research, and improve
> quality of all our services, and also point to missing features we can
> also support."**

| # | Requirement | Status |
| --- | --- | --- |
| R3 | Fresh (2025–2026) research | ✅ Refreshed analysis doc |
| R4 | Point to missing features we can support | ✅ Prioritised gap table |
| R5 | Improve quality of our services | ✅ Batch `getLabels`, `searchLexemes`, typed-constructor transformer output |

> **"Get latest changes from default branch, and implement everything in
> the established style our other features have. Please plan and execute
> everything in this single pull request … until each and every
> requirement is fully addressed."**

| # | Requirement | Status |
| --- | --- | --- |
| R6 | Merge latest `main` into the branch | ✅ |
| R7 | **Implement** the missing features (not just document them) | ✅ Generation service (Q/P → text) |
| R8 | Reverse generation (Q/P → text) | ✅ `js/src/generation/qp-to-text.js` |
| R9 | Typed, role-labelled constructors | ✅ `js/src/generation/constructors.js` + `transformToConstructor` |
| R10 | Multi-language rendering (UN 6) | ✅ `renderAll` across en/ar/es/fr/ru/zh |
| R11 | Grammatical features + phonotactics | ✅ English `a`/`an`, negation, tense, Romance gender agreement (`un`/`una`, `un`/`une`) |
| R12 | Wikidata Lexeme integration | ✅ `searchLexemes` on both API clients |
| R13 | Follow the established style (library export, types, SPA mode, redirect shell, tests, demo) | ✅ See `architecture.md` |
| R14 | Single PR (#19), branch `issue-18-ef8b353c` | ✅ |

> **"Double check again, and implement unimplemented or delayed, make
> sure we support all test cases Abstract Wikipedia project has. And also
> expand on our use cases and features … If you see clearly wrong tests
> (in the entire codebase), that can be improved — do it."**

| # | Requirement | Status |
| --- | --- | --- |
| R15 | Close the documented analysis gaps (negation, questions, numerical, repetition) in the *analysis* direction | ✅ `extractModifiers`, `detectQuestion`, `extractQuantities`, `dedupeSequence` on `transformToConstructor` |
| R16 | Expand the constructor catalogue — numerical round-trip | ✅ `quantity` constructor (`subject`·`value`·`unit`) renders across the UN 6 and is emitted by `toConstructor` |
| R17 | Add a grammatical feature beyond English phonotactics | ✅ Romance gender agreement (es/fr indefinite article, P5185-style gender) |
| R18 | Fix clearly-wrong tests | ✅ Corrected the ungrammatical es/fr gender assertions (`una ciudad`, `une ville`) in `qp-to-text.test.mjs` |
| R19 | Make the limitation harness reflect the structural handling | ✅ `limitation-test.mjs` now scores `transformToConstructor`; documented problems 12 → 4 (remaining are knowledge-base/data limits, not logic) |
| R20 | Wire the new features into the SPA + docs | ✅ Role-aware Generation mode (value/unit, gender selector), README + case-study updates |

## Established-style checklist (R13 in detail)

The project has a recognisable shape for every feature; the generation
service follows all of it:

- [x] Pure, dependency-free data layer (`generation/constructors.js`)
- [x] Runtime API-client selection (Node `fs` vs browser) like the transformer
- [x] Public package surface: `js/src/index.js` re-exports + `package.json`
      subpath exports (`./generate`, `./generate/constructors`)
- [x] Hand-written type declarations in `js/src/index.d.ts`
- [x] Offline-first unit tests gated in `run-unit-tests.mjs`
- [x] Unified-SPA mode (`app/modes/generation.jsx`) wired into routing +
      shell + `app.html`
- [x] Legacy redirect shell (`generation/index.html`) like
      `transformation/index.html`
- [x] e2e coverage in `js/tests/e2e/app.spec.mjs`
- [x] README + landing-page (`index.html`) entries
- [x] Version bump (`0.1.0` → `0.2.0`) to trigger the release workflow
