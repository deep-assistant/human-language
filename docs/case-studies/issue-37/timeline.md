# Timeline — issue #37

A reverse-chronological reconstruction of the work that landed in PR
#38, mirroring the convention of [`../issue-33/timeline.md`](../issue-33/timeline.md)
and [`../issue-35/timeline.md`](../issue-35/timeline.md).

## Phase 0 — Background (issues #29, #31, #33, #35)

The unified SPA, the cache layer and the transformer all exist by the
time PR #38 starts. See the case studies for issues #29, #31, #33 and
#35 for the work history.

## Phase 1 — Research (commit `docs: case study for issue #37`)

- Audited every `link-foundation/*` and `linksplatform/*` repository
  referenced from issue #37 (eleven repositories).
- Enumerated each workflow file and helper script in both CI/CD
  templates.
- Inventoried the JS modules under `js/src/` and classified each as
  **core** (publishable) or **UI** (SPA-only).
- Wrote the case study skeleton (this folder).

## Phase 2 — Packaging the JS library

- Removed `private` from `package.json`; bumped `version` to `0.1.0`.
- Added `main`, `types`, `bin`, `files`, `exports` (with sub-paths
  per `architecture.md`).
- Added `js/src/index.js` that re-exports the public API.
- Added `js/src/config.js` backed by the upstream `lino-arguments`
  package.
- Added `js/src/cli.js` (`human-language transform "…"`).
- Added `js/src/server.js` (HTTP factory).
- Added `js/src/transformation/lino-format.js` (LiNo serializer).
- Added `js/src/index.d.ts` (hand-written TypeScript declarations).

## Phase 3 — Tests for the new modules

- Added `js/tests/unit/config.test.mjs` covering precedence rules.
- Added `js/tests/unit/cli.test.mjs` covering argument parsing.
- Added `js/tests/unit/server.test.mjs` covering `/healthz`,
  `/version`, request validation (no network calls).
- Added `js/tests/unit/lino-format.test.mjs` covering deterministic
  serialization.
- Added `js/tests/unit/persistent-cache.test.mjs` covering
  `lino-objects-codec` cache persistence.
- Updated `js/scripts/run-unit-tests.mjs` to include the new tests
  (already runs every `*.test.mjs` under `js/tests/unit/`).

## Phase 4 — Dockerfile + Compose

- Added `Dockerfile` (`node:22-alpine`, multi-stage).
- Added `.dockerignore`.
- Added `examples/docker-compose.yml`.
- Documented `docker build` / `docker run` in the README.

## Phase 5 — Rust crate

- Added `rust/Cargo.toml`, `rust/src/lib.rs`, `rust/src/bin/cli.rs`.
- Ported `tokenize`, `generate_ngrams`, `is_property_indicator`,
  `is_stop_word`, `parse_hash`, `serialize_hash`,
  `flag_for_language`, `quotes_for_language`, LiNo sequence rendering,
  and their tests.
- Added `rust/tests/parity.rs`.
- Added `rust/changelog.d/README.md`.
- Added `rustfmt.toml`, `rust-toolchain.toml`.
- Added direct dependencies on `lino-arguments` and
  `lino-objects-codec`.

## Phase 6 — CI/CD

- Updated `.github/workflows/js.yml` to be the single JS workflow:
  syntax, unit, link, e2e, Pages, npm publish, GHCR Docker publish,
  and GitHub release.
- Added `.github/workflows/rust.yml` for Rust fmt, clippy, test
  matrix, and crates.io publish.
- Added `js/scripts/check-package-version.mjs`.
- Added `rust/scripts/check-cargo-version.mjs`.

## Phase 7 — Examples and READMEs

- Added `examples/docker-compose.yml`.
- Updated the top-level `README.md` with library, CLI, server, Docker,
  and Rust usage notes.

## Phase 8 — Final wiring + PR

- Verified `npm pack --dry-run` lists only the whitelisted files.
- Verified `cargo package --list` succeeds for `rust/`.
- Verified the branch `js.yml` and `rust.yml` workflows pass on the
  latest pushed commit before the follow-up review changes.
- Updated PR #38's title and description with the summary from
  `solution-plans.md`.
- Removed the "[WIP]" prefix and marked the PR as Ready for Review.
