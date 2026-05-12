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
│ │ transformation/                 │   │ │ │ tokenize.rs     │   │
│ │   text-to-qp-transformer.js     │◀──┼─┤ │   tokenize,     │   │
│ │   lino-format.js                │   │ │ │   generate_ngr  │   │
│ └─────────────────────────────────┘   │ │ │   is_property…  │   │
│ ┌─────────────────────────────────┐   │ │ └─────────────────┘   │
│ │ wikidata-api[-browser].js       │   │ │ ┌─────────────────┐   │
│ │ unified-cache[-browser].js      │   │ │ │ lino.rs         │   │
│ │ persistent-cache.js             │   │ │ │ settings.rs     │   │
│ └─────────────────────────────────┘   │ │ │                 │   │
│ ┌─────────────────────────────────┐   │ │ └─────────────────┘   │
│ │ app/routing.js                  │◀──┼─┤ ┌─────────────────┐   │
│ │ app/ipa.js                      │   │ │ │ routing.rs      │   │
│ │ settings.js                     │   │ │ │                 │   │
│ └─────────────────────────────────┘   │ │ └─────────────────┘   │
│ ┌─────────────────────────────────┐   │ │ ┌─────────────────┐   │
│ │ index.js  ◀── re-exports        │   │ │ │ lib.rs          │   │
│ │ server.js (new)                 │   │ │ │ bin/cli.rs      │   │
│ │ cli.js    (new)                 │   │ │ └─────────────────┘   │
│ │ config.js (new)                 │   │ │                       │
│ └─────────────────────────────────┘   │ │                       │
└───────────────────────────────────────┘ └───────────────────────┘
                  ▲                                 ▲
                  │ depends on                      │ depends on
                  │                                 │
       ┌──────────┴────────────┐        ┌───────────┴─────────────┐
       │ npm deps              │        │ crate deps              │
       │   lino-objects-codec  │        │   lino-arguments        │
       │   lino-arguments      │        │   lino-objects-codec    │
       │                       │        │   reqwest (feature)     │
       └───────────────────────┘        │   serde / serde_json    │
                                        │                         │
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
| `rust/src/tokenize.rs` | Rust core | crate `[lib]`, `[[bin]]` |
| `rust/src/routing.rs` | Rust core | crate `[lib]` |
| `rust/src/settings.rs` | Rust core | crate `[lib]` |
| `rust/src/lino.rs` | Rust core | crate `[lib]`, `[[bin]]` |
| `rust/src/lib.rs` | Rust core | crate `[lib]` |
| `rust/src/bin/cli.rs` | Rust CLI | crate `[[bin]]` |

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
        └─ LiNo response formatting when requested
        │
        ▼
HTTP 200 { tokens, sequence, formatted, alternatives }
```

## Versioning & release flow

```
PR merged -> js.yml on main
        │
        ├─ syntax-check
        ├─ unit-tests
        ├─ link-check
        ├─ e2e-local
        ├─ Pages build/deploy + deployed e2e
        ├─ detect-version-bump
        ├─ npm publish --provenance
        ├─ Docker publish to GHCR
        └─ create GitHub release
```

For Rust:

```
PR merged -> rust.yml on main
        │
        ├─ cargo fmt --check
        ├─ cargo clippy --all-targets -- -D warnings
        ├─ cargo test --all-targets (Linux/macOS/Windows)
        ├─ detect Cargo.toml version bump
        └─ cargo publish --locked
```
