# Known components that solve part of issue #37

Per-requirement catalogue of libraries, data sources and patterns
that either ship a feature we can reuse or constrain the shape of
our public API.

## R3 — npm publishing patterns

| Library / template | What we reuse |
| --- | --- |
| `link-assistant/meta-expression` | `package.json` shape (`exports['.','./server','./cli']`, `bin`, `files`), `src/server.js`, `src/cli.js`, Dockerfile pattern. |
| `link-foundation/lino-arguments` | dual-runtime layout (`js/`, `rust/`), `.changeset/` versioning. |
| `link-foundation/js-ai-driven-development-pipeline-template` | Release workflow patterns adapted into `.github/workflows/js.yml`: tests, npm provenance publish, Docker publish, GitHub release. |

## R3 — crates.io publishing patterns

| Crate / template | What we reuse |
| --- | --- |
| `link-foundation/rust-ai-driven-development-pipeline-template` | `Cargo.toml` shape, rustfmt / clippy gates, `changelog.d/` convention, and crates.io publish pattern adapted into `.github/workflows/rust.yml`. |
| `link-assistant/calculator` | `crate-type = ["cdylib","rlib"]`, `[[bin]]`-and-`[lib]` coexistence. |
| `link-foundation/lino-arguments` (rust/) | `clap` integration, `getenv_*` helpers — depended on directly. |

## R5 — HTTP microservice patterns

| Project | What we reuse |
| --- | --- |
| `link-assistant/meta-expression` | `src/server.js` skeleton: a single `createServer` using Node's built-in `http`, no Express dependency. Same shape for `/healthz`, `/version`, content negotiation. |
| `link-foundation/lino-arguments` | precedence rules for `port`, `host`, `cache-dir`. |

## R6 — Configuration

| Library | Used by | Status |
| --- | --- | --- |
| `lino-arguments` (Rust) | `rust/src/bin/cli.rs` | Direct dependency. |
| `lino-arguments` (JS) | `js/src/config.js` | Direct dependency. |

## R7 — Stored state codec

| Library | Used by | Status |
| --- | --- | --- |
| `lino-objects-codec` (JS) | `js/src/persistent-cache.js` (codec adapter) | Direct dependency. JSON remains the default cache codec. |
| `lino-objects-codec` (Rust) | `rust/src/lino.rs` | Direct dependency. |

## R8 — Links Notation

| Library | Used by | Status |
| --- | --- | --- |
| `links-notation` (JS Parser) | `js/src/transformation/lino-format.js` for INPUT parsing | Deferred (see R8). |
| `links-notation` (Rust `parse_lino`) | `rust/src/lino.rs` for INPUT parsing | Deferred. |

## R9 — Storage / cache backend

| Library | Status |
| --- | --- |
| `link-cli` | Deferred follow-up. |
| `doublets-rs` | Deferred follow-up. |
| `doublets-web` | Deferred follow-up. |

## Wikidata clients (comparison)

| Library | Language | Read API | Search | SPARQL | Transformer (text → Q/P) | Cache | IPA |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **this project** | JS + Rust | ✅ | ✅ | ❌ (planned) | ✅ | ✅ (file + IndexedDB) | ✅ (Oxford) |
| `wikibase-sdk` | JS | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `qwikidata` | TS | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `wikibaseintegrator` | Py | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `mediawiki` (Rust) | Rust | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `wikibase` (Rust) | Rust | partial | ❌ | ✅ | ❌ | ❌ | ❌ |

## Phonetic / IPA backends

| Source | Used in | Notes |
| --- | --- | --- |
| Oxford Dictionaries API | `js/src/app/ipa.js` | Existing dependency. |
| `epitran` (Python) | not used | Would let Rust generate IPA offline. |
| `lexconvert` | not used | Offline converter; potential follow-up. |

## Alphabet / dictionary data sources

(Unchanged from issue #33 case study; see
[`../issue-33/known-components.md`](../issue-33/known-components.md).)
