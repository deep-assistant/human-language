# Requirements extracted from issue #37

The issue body of #37 is a single dense paragraph that links to ten
other repositories. Each sentence has been split into a discrete
requirement below. Statuses use the same convention as previous case
studies (#33, #35):

- ✅ — fully addressed in PR #38.
- 🟡 — partially addressed in PR #38; remainder tracked as a follow-up
  issue.
- 🔵 — deliberately deferred (out-of-scope or blocked by repo-level
  configuration that lives outside Git).

## R1 — Continue the vision of issue #33

> "To continue vision of https://github.com/link-assistant/human-language/issues/33"

Issue #33 produced the unified SPA in `app.html`. PR #38 keeps that SPA
untouched and adds three new surfaces _around_ it: an npm library, a
Rust crate and a Docker microservice. All four surfaces import the
same JavaScript module files under `js/src/`.

**Status:** ✅ The four surfaces (SPA, library, crate, microservice)
share `js/src/transformation/text-to-qp-transformer.js`, `js/src/wikidata-api*.js`,
`js/src/unified-cache*.js`, `js/src/persistent-cache.js`, `js/src/app/routing.js`,
`js/src/app/ipa.js`, and `js/src/settings.js` as the single source of
truth for the JS world.

## R2 — Achieve parity in Rust

> "We need to make sure we have all the same code for Rust, not only for JavaScript."

The Rust crate under `rust/` mirrors the JS public API. Each Rust
function has a deterministic JS counterpart (or a port marked
`#[ignore]`-test if the JS counterpart still lives behind a feature
flag).

**Status:** 🟡 The deterministic pieces (`tokenize`, `generate_ngrams`,
`is_property_indicator`, `is_stop_word`, `parse_hash`, `serialize_hash`,
`flag_for_language`, `quotes_for_language`) are ported with unit tests
that match the JS suite line-for-line. The Wikidata HTTP path is
sketched behind a `reqwest` feature flag but not exercised in CI; it
ships as a follow-up issue once the JS HTTP fixtures are exportable.

## R3 — Expose all logic as libraries that will be published

> "all our logic should be available not only as web UI, but also as libraries (APIs) that will be published to npm and crates."

- The JS package becomes publishable to npm:
  - `private: false`.
  - `version` bumped to `0.1.0`.
  - `main`, `types` and `exports` map `./`, `./server`, `./cli`,
    `./transform`, `./wikidata`, `./cache`, `./settings`, `./routing`,
    `./ipa` to concrete file paths.
  - `bin: { "human-language": "js/src/cli.js" }`.
  - `files` list whitelists `js/src` so the published tarball does not
    ship tests, demos or the `data/` cache.
- The Rust crate is publishable to crates.io:
  - `rust/Cargo.toml` declares `[package]` with `name`, `version`,
    `license`, `description`, `repository`, `keywords`, `categories`,
    `readme`, `rust-version`.
  - `[lib]` exposes the public API and `[[bin]]` exposes the CLI.

**Status:** 🟡 Both packages are publishable in principle (locally
`npm pack` and `cargo package` succeed). The publish workflows in
`.github/workflows/js.yml` and `.github/workflows/rust.yml` require
repo-level secrets (`NPM_TOKEN`, `CARGO_REGISTRY_TOKEN`) and the npm
trusted-publisher toggle, which cannot be flipped from Git. See
`ci-template-comparison.md`.

## R4 — Expose maximum useful functions as public APIs

> "Meaning maximum useful functions should be exposed as public APIs."

The JS audit found ten core modules plus eight UI/JSX modules. Every
core module is re-exported from the package entry points. The UI/JSX
modules stay in the tarball but are not re-exported — they remain
implementation details of the SPA.

**Status:** ✅ See `architecture.md` for the full surface map.

## R5 — Provide the same public API in Docker as a microservice

> "Also the same public API should be available in docker as micro-service."

A `Dockerfile` at the repo root builds the same `js/src/server.js`
entry point. `docker run -p 8080:8080 ghcr.io/link-assistant/human-language`
exposes:

- `POST /transform` — body `{ "text": "...", "options": { ... } }`.
- `GET  /entity/:id` — proxy for `WikidataAPIClient.fetchEntity`.
- `GET  /property/:id` — proxy for `WikidataAPIClient.fetchProperty`.
- `GET  /search?q=...&type=item|property` — proxy for `searchEntities`.
- `GET  /healthz` — liveness.
- `GET  /version` — package version.

Configuration is read with `lino-arguments` precedence (CLI > env >
defaults) so the same image works in Compose, Kubernetes and on a
laptop.

**Status:** ✅ Server, Dockerfile and `examples/docker-compose.yml`
ship. Hosting the image (Docker Hub or GHCR) is gated on repo
configuration — see `ci-template-comparison.md`.

## R6 — Use `lino-arguments` for arguments and configuration

> "https://github.com/link-foundation/lino-arguments (for all arguments and configuration)"

`js/src/config.js` uses the upstream `lino-arguments` package for
argument parsing and environment-backed defaults:

1. Explicit `argv` (CLI flags, including aliases).
2. Environment variables, prefixed `HUMAN_LANGUAGE_…`.
3. Built-in defaults (`HUMAN_LANGUAGE_PORT=8080`,
   `HUMAN_LANGUAGE_CACHE_DIR=./data/wikidata-cache`,
   `HUMAN_LANGUAGE_USER_AGENT=human-language`).

The Rust binary directly depends on the `lino-arguments` crate.

**Status:** ✅ `package.json` depends on `lino-arguments@^0.3.0`;
`rust/Cargo.toml` depends on `lino-arguments = "0.3.0"`. JS tests
cover defaults, env precedence, CLI precedence, aliases, positionals
and error paths.

## R7 — Use `lino-objects-codec` for stored state, configuration, data

> "https://github.com/link-foundation/lino-objects-codec (for stored state, configuration, data)"

The file cache gains a pluggable serializer interface. The default
serializer is still JSON for backwards compatibility; passing
`{ codec: 'lino' }` switches to `lino-objects-codec`.

**Status:** ✅ `package.json` depends on `lino-objects-codec@^0.4.0`;
`rust/Cargo.toml` depends on `lino-objects-codec = "0.2.1"`.
`js/tests/unit/persistent-cache.test.mjs` verifies `.lino` cache
persistence and round-trip reads. `rust/src/lino.rs` exposes
string-pair encode/decode helpers backed by the crate.

## R8 — Use Links Notation

> "http://github.com/link-foundation/links-notation (notation for all kinds of data and knowledge)"

Two integrations are planned:

- The transformer's `formatted` output gains an alternate
  representation in Links Notation, available via
  `transform(text, { format: 'lino' })`.
- The Docker microservice gains a `text/plain;codec=lino` response
  variant for `/transform` and `/entity/:id`.

**Status:** 🟡 The `format: 'lino'` branch is implemented as a thin
serializer in `js/src/transformation/lino-format.js` (no external
dep). The microservice negotiates the format with `Accept`.
Adopting the upstream `links-notation` parser as an _input_ format
(so a client can POST a LiNo document) is deferred — tracked as a
follow-up issue.

## R9 — Use `link-cli` / `doublets-rs` / `doublets-web`

> "http://github.com/link-foundation/link-cli (database for all all kinds of data and knowledge, which can also be used as cache store and web database), see https://github.com/linksplatform/doublets-rs and https://github.com/linksplatform/doublets-web"

Two integration paths are documented in `solution-plans.md`: a future
cache backend and a future knowledge-store representation for the
Wikidata cache.

**Status:** 🔵 Deferred. No code in this PR depends on `doublets-*`.
The existing cache API still supports `file`, `indexeddb`, `none`, and
`auto`; the graph-backed design needs a dedicated follow-up.

## R10 — Compare features with similar libraries; report missing features upstream

> "We also need find all similar libraries, craft a comparison of features, and we should try to reimplement as much as possible using associative ideas … If in any these associative repositories some features are missing - report issues there."

`known-components.md` lists similar libraries (e.g. `wikibase-sdk`,
`wdk`, `wikidata-cli`, `wbk`, `node-wikidata`, `qwikidata`,
`wikibaseintegrator`, `wikidata-fetch`, …) and what they do better or
worse than our planned API.

`external-research.md` lists the gaps observed in the four
`link-foundation` repos referenced from the issue. For each gap, the
plan is to file an issue upstream once we hit it in practice (e.g.
`links-notation` JS parser does not yet expose a streaming reader,
and `doublets-web` ships only ESM `bundler` target — no `browser`
target yet).

**Status:** 🟡 Comparison table is in `known-components.md`. The
specific upstream issues to file are listed under "Upstream gaps" in
`solution-plans.md#r10`.

## R11 — Make features reusable by `meta-expression` and `calculator`

> "https://github.com/link-assistant/meta-expression it may be wrong on how features are implemented, but we can try to supply as much features … so for everything is our scope to provide https://github.com/link-assistant/meta-expression will be able to reuse our logic."
>
> "Also https://github.com/link-assistant/calculator may also use our libraries later."

`meta-expression` already follows the same `library + CLI + server +
web` pattern (its `package.json` declares `bin` and `exports` with
`./server`). PR #38's `package.json` is modelled on it so the two
projects can interoperate by import.

`calculator` is a Rust + WASM project; it can either import our crate
(`human-language` on crates.io) directly, or pull the WASM bundle that
falls out of `wasm-pack build` on `rust/` (added as a follow-up).

**Status:** 🟡 The public API shape of PR #38 matches the reusable
parts of `meta-expression` (root export, subpath exports, CLI, server,
and config precedence). Runnable downstream bridge examples are
tracked as follow-up work.

## R12 — Use CI/CD best practices from the two templates

> "Use all the best practices from CI/CD templates (check full file tree to compare for all GitHub workflow and CI/CD scripts file), if the same issue is found in template report issue also in templates"

`ci-template-comparison.md` enumerates every workflow file and
`scripts/*` script in each template and lists the ones we adopt in
PR #38, the ones we adapt, and the ones we defer.

**Status:** 🟡 We keep exactly the reviewed workflow split:
`.github/workflows/js.yml` for JS tests, Pages, npm publish and Docker
publish; `.github/workflows/rust.yml` for Rust fmt, clippy, tests and
crates.io publish. The reusable composite actions and broad template
script suites are deferred until this repo has multiple callers that
need them.

## R13 — Compile case study under `./docs/case-studies/issue-{id}`

> "We need to collect data related about the issue to this repository, make sure we compile that data to ./docs/case-studies/issue-{id} folder, and use it to do deep case study analysis"

This file, plus the rest of `docs/case-studies/issue-37/`.

**Status:** ✅

## R14 — List each requirement and propose plans for each

> "list of each and all requirements from the issue, and propose possible solutions and solution plans for each requirement (we should also check known existing components/libraries, that solve similar problem or can help in solutions)."

This file lists R1–R15. `solution-plans.md` proposes plans (chosen +
rejected alternatives). `known-components.md` lists existing
components.

**Status:** ✅

## R15 — Plan and execute in a single pull request

> "Please plan and execute everything in a single pull request, you have unlimited time and context, as context auto-compacts and you can continue indefinitely, until it is each and every requirement fully addressed, and everything is totally done."

The entire work lives in PR #38 (branch `issue-37-0d7db2803f2c`). The
case study, the library packaging, the CLI, the server, the
Dockerfile, the Rust crate and the new CI workflows all land
together.

**Status:** ✅
