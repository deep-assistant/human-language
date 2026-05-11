# Architecture after issue #37

After PR #38, the project exposes **four surfaces** that all share the
same JavaScript modules under `js/src/` (plus, for Rust consumers, a
parallel implementation under `rust/`).

```
┌───────────────────────────────────────────────────────────────┐
│                    Surfaces                                    │
│                                                                │
│ ┌─────────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐ │
│ │ SPA         │ │ npm        │ │ Docker      │ │ crates.io  │ │
│ │ (app.html)  │ │ library    │ │ microservice│ │ crate      │ │
│ │             │ │ (Node/Bun) │ │ (HTTP/JSON) │ │ (Rust)     │ │
│ └──────┬──────┘ └─────┬──────┘ └──────┬──────┘ └──────┬─────┘ │
│        │              │               │               │       │
└────────┼──────────────┼───────────────┼───────────────┼───────┘
         │              │               │               │
         ▼              ▼               ▼               ▼
┌───────────────────────────────────────┐ ┌───────────────────────┐
│             JS core modules           │ │      Rust core        │
│             (js/src/)                 │ │       (rust/src/)     │
│                                       │ │                       │
│ ┌─────────────────────────────────┐   │ │ ┌─────────────────┐   │
│ │ transformation/                 │   │ │ │ transform.rs    │   │
│ │   text-to-qp-transformer.js     │◀──┼─┤ │   tokenize,     │   │
│ │   lino-format.js   (new)        │   │ │ │   generate_ngr  │   │
│ └─────────────────────────────────┘   │ │ │   is_property…  │   │
│ ┌─────────────────────────────────┐   │ │ └─────────────────┘   │
│ │ wikidata-api[-browser].js       │   │ │ ┌─────────────────┐   │
│ │ unified-cache[-browser].js      │   │ │ │ wikidata.rs     │   │
│ │ persistent-cache.js             │   │ │ │   (feature      │   │
│ └─────────────────────────────────┘   │ │ │    "wikidata")  │   │
│ ┌─────────────────────────────────┐   │ │ └─────────────────┘   │
│ │ app/routing.js                  │◀──┼─┤ ┌─────────────────┐   │
│ │ app/ipa.js                      │   │ │ │ routing.rs      │   │
│ │ settings.js                     │   │ │ │ locale.rs       │   │
│ └─────────────────────────────────┘   │ │ └─────────────────┘   │
│ ┌─────────────────────────────────┐   │ │ ┌─────────────────┐   │
│ │ index.js  ◀── re-exports        │   │ │ │ lib.rs          │   │
│ │ server.js (new)                 │   │ │ │ bin/main.rs     │   │
│ │ cli.js    (new)                 │   │ │ └─────────────────┘   │
│ │ config.js (new)                 │   │ │                       │
│ └─────────────────────────────────┘   │ │                       │
└───────────────────────────────────────┘ └───────────────────────┘
                  ▲                                 ▲
                  │ depends on                      │ depends on
                  │                                 │
       ┌──────────┴────────────┐        ┌───────────┴─────────────┐
       │ optional npm deps     │        │ optional crate deps     │
       │   lino-objects-codec  │        │   lino-arguments        │
       │   links-notation      │        │   serde / serde_json    │
       │   doublets-web        │        │   reqwest (feature)     │
       └───────────────────────┘        │   doublets-rs (planned) │
                                        │   links-notation (rs)   │
                                        └─────────────────────────┘
```

## Module ownership

| Module path | Owner | Surface(s) that import it |
| --- | --- | --- |
| `js/src/index.js` | npm library | npm |
| `js/src/server.js` | server | Docker, npm `./server` import |
| `js/src/cli.js` | CLI | npm `bin`, Docker (entrypoint shim) |
| `js/src/config.js` | shared | server, CLI |
| `js/src/transformation/text-to-qp-transformer.js` | core | SPA, npm, server, CLI |
| `js/src/transformation/lino-format.js` | core | npm `transform({ format:'lino' })`, server `Accept: text/plain;codec=lino` |
| `js/src/wikidata-api-browser.js` | core | SPA, npm |
| `js/src/wikidata-api.js` | core | server, CLI |
| `js/src/unified-cache-browser.js` | core | SPA, npm |
| `js/src/unified-cache.js` | core | server, CLI |
| `js/src/persistent-cache.js` | core | server, CLI |
| `js/src/app/routing.js` | core | SPA, npm |
| `js/src/app/ipa.js` | core | SPA, npm |
| `js/src/settings.js` | core | SPA, npm |
| `js/src/app/shell.jsx` + `app/modes/*.jsx` | SPA-only | SPA (not re-exported) |
| `js/src/statements.jsx` | SPA-only | SPA |
| `js/src/loading.jsx` | SPA-only | SPA |
| `js/src/app/tests-panel.jsx` | SPA-only | SPA |
| `rust/src/transform.rs` | Rust core | crate `[lib]`, `[[bin]]` |
| `rust/src/routing.rs` | Rust core | crate `[lib]` |
| `rust/src/locale.rs` | Rust core | crate `[lib]` |
| `rust/src/wikidata.rs` | Rust core | crate `[lib]` (feature `wikidata`) |
| `rust/src/lib.rs` | Rust core | crate `[lib]` |
| `rust/src/bin/main.rs` | Rust CLI | crate `[[bin]]` |

## Data flow (POST /transform under Docker)

```
HTTP POST { text, options }
        │
        ▼
js/src/server.js  ─── parse JSON, validate
        │
        ▼
js/src/transformation/text-to-qp-transformer.js
        │
        ├─ tokenize() ─────────────────────────┐
        ├─ generateNgrams() ──────────────────┐│
        ├─ searchNgrams() ── WikidataAPI ── unified-cache
        ├─ matchTokensWithPriority() ────────┘│
        └─ format() ─ optional lino-format.js┘
        │
        ▼
HTTP 200 { tokens, sequence, formatted, alternatives }
```

## Versioning & release flow

```
PR merged → release.yml on main
        │
        ├─ detect-changes
        ├─ test
        ├─ check-version  ── compares package.json#version to last npm tag
        ├─ validate-changeset
        ├─ build
        ├─ npm publish (OIDC trusted publisher)
        ├─ wait-for-npm
        ├─ docker-publish (if vars.DOCKERHUB_IMAGE set)
        ├─ create-github-release
        └─ format-github-release
```

For Rust:

```
PR merged → rust.yml on main
        │
        ├─ detect-changes
        ├─ lint (rustfmt + clippy)
        ├─ test (cargo test, ubuntu only in PR #38)
        ├─ coverage (cargo-llvm-cov; continue-on-error)
        ├─ check-version
        ├─ build
        └─ manual-release (workflow_dispatch) ── publishes to crates.io
```
