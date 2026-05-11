# External research for issue #37

## The eleven repositories referenced from the issue body

These notes were collected via the GitHub REST API; the raw JSON
payloads and READMEs are pinned in
[`docs/case-studies/issue-37/research-notes/`](./research-notes/) for
future audits.

### 1. `link-foundation/lino-arguments`

- **Primary languages:** JavaScript + Rust (dual)
- **Purpose:** Unified configuration layer that resolves precedence
  `CLI args > env vars > config file > built-in defaults`. Ships
  `makeConfig({yargs, getenv})` in JS and `getenv_int`, `getenv_bool`,
  `clap` integration in Rust.
- **Layout:** `js/{src,tests,examples,.changeset,package.json}`,
  `rust/{src,tests,examples,changelog.d,Cargo.toml}`, shared
  `scripts/`, `.github/workflows/js.yml` + `rust.yml`.
- **What we imitate:** the dual `js/` + `rust/` directory split with a
  shared `scripts/` directory; the precedence rules; the `bin` /
  `exports` structure of its `package.json`.
- **What we depend on:** the **Rust** crate is depended on directly;
  the **JS** package is shimmed (see requirements R6).

### 2. `link-foundation/lino-objects-codec`

- **Primary languages:** JavaScript + Rust + Python + C# (quad)
- **Purpose:** Encode arbitrary objects to / from Links Notation with
  circular reference + identity support. JS surface:
  `encode`, `decode`, `formatIndented`, `parseIndented`.
- **What we imitate:** the four-language parity model with identical
  API. The README's "registry badge matrix" idea is borrowed for our
  README.
- **What we depend on:** a tiny adapter under
  `js/src/transformation/lino-format.js` that uses `encode` /
  `formatIndented` _if_ the optional dependency is installed.

### 3. `link-foundation/links-notation`

- **Primary languages:** Rust (primary) + JS, C#, Python, Go, Java
- **Purpose:** Core parser / serializer for Links Notation (the data
  / knowledge syntax). JS exports `Parser`; Rust exports `parse_lino`.
- **What we imitate:** workflow set (AutoMerge, bom-check, pages),
  `.gitpod.yml` + Codacy integration.
- **What we depend on:** indirect — through `lino-objects-codec`.

### 4. `link-foundation/link-cli`

- **Primary languages:** C# (primary) + Rust (WASM workbench)
- **Purpose:** `clink` CLI doing all CRUD via a single substitution
  operation on links. Ships as `dotnet tool install --global clink`
  plus a WASM browser workbench (`clink-wasm` crate).
- **What we imitate:** the `cdylib + rlib` Cargo pattern (we
  reproduce it under `rust/Cargo.toml` so our crate is consumable
  from both Rust and WASM).
- **What we depend on:** nothing in this PR. The `link-cli` query
  surface is a candidate cache backend for a follow-up issue
  (R9, deferred).

### 5. `linksplatform/doublets-rs`

- **Primary language:** Rust (nightly)
- **Purpose:** Associative storage of links (`index/source/target`)
  with file-mapped persistence. Exposes `Doublets`, `DoubletsExt`,
  `Link`, `Links`, `create_point`, `create_link`, `each_iter`.
- **What we imitate:** the workspace-with-FFI layout
  (`doublets/`, `doublets-ffi/`, `doublets-decorators/`) for when we
  need C-bindings; the `changelog.d/` fragment pattern.
- **What we depend on:** nothing in this PR; follow-up issue R9.

### 6. `linksplatform/doublets-web`

- **Primary languages:** TypeScript + Rust (WASM)
- **Purpose:** WASM bindings around `doublets-rs` published to npm as
  `doublets-web`; exports `Link`, `LinksConstants`, `UnitedLinks`.
- **What we imitate:** stable-Rust `wasm-pack build --target bundler
  --out-dir pkg` flow; npm-package-from-Rust pattern; the GitHub
  Pages playground deployment.
- **What we depend on:** nothing in this PR; follow-up issue R9.

### 7. `link-assistant/meta-expression`

- **Primary language:** JavaScript
- **Purpose:** Statement reasoning playground. Exposes
  `analyzeStatement`, `formalizeTextWith`, `translateTextWith`,
  `checkText`, `searchTextUniqueness`. Already a
  library + CLI + microservice + static web bundle — the **closest
  prior art** for our R3 + R5.
- **What we imitate:** verbatim. Its `package.json` layout (bin,
  dual `exports['.','./server']`), its `src/server.js` structure,
  its `src/cli.js` structure.

### 8. `link-assistant/calculator`

- **Primary languages:** Rust (WASM) + React
- **Purpose:** Grammar-based expression calculator (DateTime,
  Currency) compiled to WASM. Published as `link-calculator` on
  crates.io with a React frontend on GitHub Pages.
- **What we imitate:** `crate-type = ["cdylib", "rlib"]` with `[[bin]]`
  + `[lib]` simultaneously, `clippy::pedantic`+`nursery` lints,
  periodic update workflows (currency rates, screenshots → we could
  use the same pattern for a `update-wikidata-snapshots.yml`).

### 9. `link-foundation/js-ai-driven-development-pipeline-template`

The JS template to mirror. Workflows we adopt are listed in
`ci-template-comparison.md`. The 24 `scripts/*.mjs` we partially
imitate are also listed there.

ESLint flat config: `complexity:15`, `max-depth:5`,
`max-lines:1500` (error), `max-lines-per-function:150`,
`max-params:6`, `max-statements:60`, plus Prettier integration.
We do **not** adopt the ESLint config in this PR because the
existing codebase predates these limits and would need a follow-up
sweep to comply.

### 10. `link-foundation/rust-ai-driven-development-pipeline-template`

The Rust template to mirror.

`Cargo.toml`: `[lib]` + `[[bin]]`, depends on `lino-arguments = "0.3"`
+ `clap`, `clippy::all + pedantic + nursery` warn, `unsafe_code =
"forbid"`, `[profile.release] lto=true codegen-units=1 strip=true`.

Workflow `release.yml`: `detect-changes → changelog-fragment-check →
version-check → lint (rustfmt + clippy + file-size) → test matrix 3 OS
→ coverage (cargo-llvm-cov → Codecov) → build → auto-release (publish
crates.io + wait-for-crate + optional Docker Hub buildx + GitHub
Release) → manual-release`. All helpers are `rust-script` `.rs` files
in `scripts/` (16 scripts).

### 11. `link-assistant/human-language` (this repo)

For context. Current state at the start of PR #38:

- Single workflow `.github/workflows/js.yml` (adapted from the JS
  template by previous PRs but trimmed).
- `package.json` is `private: true`, version `0.0.0`, no `main` /
  `exports`.
- No Rust directory, no Dockerfile.
- `js/src/` is well organised (10 core modules + 8 UI modules — see
  `architecture.md`).

## Prior art outside the `link-foundation` ecosystem

For each surface we add, there is at least one widely-used analog:

### npm: Wikidata-as-a-library

- **`wikibase-sdk`** (≈80 k weekly downloads). Read-only Wikidata
  client. Pure JS. No transformer, no IPA. Useful reference for
  `wbgetentities` URL building (we already match it in
  `wikidata-api.js`).
- **`wikibase-edit`** — write side; not relevant.
- **`wbk`** (formerly `wikidata-sdk`) — older alias of
  `wikibase-sdk`.
- **`qwikidata`** — TypeScript wrapper, smaller and simpler.

Our library is differentiated by the **transformer** (English →
Q/P sequence) which none of the above provides.

### crates.io: Wikidata as a Rust crate

- **`mediawiki`** crate (Magnus Manske) — a generic MediaWiki API
  client. The Wikidata data structures are not first-class.
- **`wikibase`** crate — by the same author; SPARQL-focused.
- **`wikibase_rs`** — an older fork.

None of these include the transformer logic. Our crate is a thin
port of the JS transformer plus a `feature = "wikidata"` flag that
re-exports a `WikidataClient` thin wrapper over the JSON API.

### Docker: Wikidata microservice

- **`wikidata-toolkit`** images — bulk dump processors; not a per-
  request API.
- Several community Wikidata SPARQL proxies.

None of these answer the `POST /transform` use case. The closest is
[`link-assistant/meta-expression`](https://github.com/link-assistant/meta-expression),
which already ships a Dockerfile with the same library + server
shape we adopt.

## Upstream gaps (issues to file)

These are gaps we found while planning, not bugs we hit. Each will
be filed as a stand-alone upstream issue with a link back to this
case study:

- `lino-arguments` (JS) — the published tarball includes ESM
  imports of `node:fs` that crash under Bun's `bun --target=browser`
  bundler. The Rust crate is fine. _Gap report planned._
- `lino-objects-codec` (JS) — `encode` does not yet handle `Map` /
  `Set` natively (round-trips through `Object.fromEntries`). _Gap
  report planned._
- `links-notation` (JS) — the `Parser` is a synchronous parser; no
  streaming reader for large LiNo dumps. _Gap report planned._
- `doublets-web` — npm tarball ships only the `bundler` target of
  `wasm-pack`; no `browser` target available, so consumers cannot
  load it directly from `esm.sh`. _Gap report planned._
- `js-ai-driven-development-pipeline-template` — the
  `setup-npm.mjs` script assumes the package name matches the
  `${{ github.repository }}` short name. Our package is
  `human-language` (matches), but `meta-expression` differs from
  its repo name (no published differentiation). _Documentation gap
  report planned._
- `rust-ai-driven-development-pipeline-template` — the
  `auto-release` job hard-codes `nightly` for `cargo-llvm-cov`
  although stable works as of `1.83`. _Modernisation issue
  planned._

The issue links will be appended to this file once filed.
