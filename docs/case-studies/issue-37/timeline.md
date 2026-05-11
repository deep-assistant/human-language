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
- Added `js/src/config.js` (`lino-arguments` precedence shim).
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
- Updated `js/scripts/run-unit-tests.mjs` to include the new tests
  (already runs every `*.test.mjs` under `js/tests/unit/`).

## Phase 4 — Dockerfile + Compose

- Added `Dockerfile` (`node:22-alpine`, multi-stage).
- Added `.dockerignore`.
- Added `examples/docker-compose.yml`.
- Documented `docker build` / `docker run` in the README.

## Phase 5 — Rust crate

- Added `rust/Cargo.toml`, `rust/src/lib.rs`, `rust/src/bin/main.rs`.
- Ported `tokenize`, `generate_ngrams`, `is_property_indicator`,
  `is_stop_word`, `parse_hash`, `serialize_hash`,
  `flag_for_language`, `quotes_for_language` and their tests.
- Added `rust/tests/transform_parity.rs` and
  `rust/tests/routing_parity.rs`.
- Added `rust/changelog.d/0001-initial.md` (placeholder).
- Added `rustfmt.toml`, `rust-toolchain.toml`.

## Phase 6 — CI/CD

- Added `.github/workflows/release.yml` (JS npm + optional Docker
  Hub) modelled on the JS template.
- Added `.github/workflows/rust.yml` (Rust lint + test + manual
  publish) modelled on the Rust template.
- Added `js/scripts/check-version.mjs`,
  `js/scripts/validate-changeset.mjs`,
  `js/scripts/setup-npm.mjs`,
  `js/scripts/publish-to-npm.mjs`,
  `js/scripts/wait-for-npm.mjs`,
  `js/scripts/check-docker-publish.mjs`,
  `js/scripts/create-github-release.mjs`,
  `js/scripts/format-github-release.mjs`,
  `js/scripts/version-and-commit.mjs`,
  `js/scripts/merge-changesets.mjs`,
  `js/scripts/detect-code-changes.mjs`.
- Existing `js.yml` left unchanged (it still gates the Pages deploy
  on the unit and link-check jobs).

## Phase 7 — Examples and READMEs

- Added `examples/meta-expression-bridge.mjs` showing how
  `meta-expression` will import `human-language`.
- Added `examples/calculator-bridge.mjs` (sketch only — depends on a
  WASM build that lands in a follow-up).
- Updated the top-level `README.md` "How to use" section with three
  new code blocks: `import` from npm, `docker run`, `cargo add`.

## Phase 8 — Final wiring + PR

- Verified `npm pack --dry-run` lists only the whitelisted files.
- Verified `cargo package --list` succeeds for `rust/`.
- Verified the existing `js.yml` workflow still passes on the
  branch (unit + e2e against localhost).
- Updated PR #38's title and description with the summary from
  `solution-plans.md`.
- Removed the "[WIP]" prefix and marked the PR as Ready for Review.
