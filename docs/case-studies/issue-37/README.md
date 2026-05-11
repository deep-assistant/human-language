# Case Study — Issue #37

> **Issue:** [link-assistant/human-language#37](https://github.com/link-assistant/human-language/issues/37)
> "Make it more universally accessible."
> **Pull request:** [#38](https://github.com/link-assistant/human-language/pull/38)
> **Branch:** `issue-37-0d7db2803f2c`

## Summary

Issue #37 continues the vision of #33 (unified SPA) by removing the
remaining "JavaScript-and-GitHub-Pages only" constraint. Today every
useful piece of logic in this repository is reachable only by opening
`app.html` in a browser. The issue asks us to:

1. Expose the same core logic as a **library on npm** (for JavaScript
   consumers) so other projects — most concretely
   [`link-assistant/meta-expression`](https://github.com/link-assistant/meta-expression)
   and [`link-assistant/calculator`](https://github.com/link-assistant/calculator) —
   can reuse it without scraping the SPA.
2. Mirror the same core logic as a **crate on crates.io** so Rust
   consumers (and WASM consumers) have parity.
3. Expose the same public API as an HTTP **microservice in Docker** so
   any language can call it.
4. Adopt the configuration / encoding / data-storage primitives of the
   `link-foundation` ecosystem:
   [`lino-arguments`](https://github.com/link-foundation/lino-arguments),
   [`lino-objects-codec`](https://github.com/link-foundation/lino-objects-codec),
   [`links-notation`](https://github.com/link-foundation/links-notation),
   [`link-cli`](https://github.com/link-foundation/link-cli) /
   [`doublets-rs`](https://github.com/linksplatform/doublets-rs) /
   [`doublets-web`](https://github.com/linksplatform/doublets-web).
5. Match the CI/CD blueprints of
   [`js-ai-driven-development-pipeline-template`](https://github.com/link-foundation/js-ai-driven-development-pipeline-template)
   and
   [`rust-ai-driven-development-pipeline-template`](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template).

## Documents in this case study

| File | Purpose |
| --- | --- |
| [`requirements.md`](./requirements.md) | Verbatim list of every requirement extracted from the issue body, with the status of each in PR #38. |
| [`external-research.md`](./external-research.md) | Notes on the eleven external repositories referenced from the issue body, plus other prior art for the same problem (universal accessibility via library + WASM + microservice). |
| [`known-components.md`](./known-components.md) | Short catalogue of libraries / data sources that we plan to depend on (or imitate) per requirement. |
| [`ci-template-comparison.md`](./ci-template-comparison.md) | File-by-file comparison of our `.github/workflows/` against `js-ai-driven-development-pipeline-template` and `rust-ai-driven-development-pipeline-template`; lists which jobs land in PR #38 and which are deferred. |
| [`solution-plans.md`](./solution-plans.md) | The chosen plan per requirement, plus the alternatives that were considered. |
| [`architecture.md`](./architecture.md) | Prose-and-ASCII diagram of the four surfaces (library, Rust crate, Docker microservice, existing SPA) and where they share code. |
| [`timeline.md`](./timeline.md) | Chronological reconstruction of the work that landed in PR #38. |

## The fix in one sentence

The core text-to-Q/P logic, the Wikidata client, the in-memory and
IndexedDB caches and the locale / IPA helpers were already pure
modules — PR #38 declares the package public, adds typed entry points
(`./` for the library, `./server` for the microservice, `./cli` for the
CLI), drops a `Dockerfile` that runs the same `./server` module, and
adds a Rust crate under `rust/` that mirrors the JS public API one
function at a time (the transformer port is the first; the rest follow
in subsequent PRs because each requires a Wikidata-shaped fixture).

## What ships in this PR

- **JS library** — `package.json` is no longer `private`, declares
  `main` / `types` / `exports`, ships `bin` for the CLI, and is ready
  to publish as `human-language` on npm (the actual publish step is
  gated behind the new `release.yml` workflow — see
  [`ci-template-comparison.md`](./ci-template-comparison.md)).
- **JS CLI** — `js/src/cli.js` exposes
  `human-language transform "Albert Einstein was born in Ulm"` and
  uses `lino-arguments`-style precedence (CLI > env > defaults).
- **JS microservice** — `js/src/server.js` exposes
  `POST /transform`, `GET /entity/:id`, `GET /property/:id`,
  `GET /healthz`. Same precedence rules as the CLI.
- **Dockerfile** — a small multi-stage image that runs
  `node js/src/server.js` and exposes port 8080.
- **Rust crate** — `rust/Cargo.toml` declares `human-language` with
  both `[lib]` and `[[bin]]`, depends on `lino-arguments`, and ports
  the tokenizer / n-gram generator / property-indicator detector from
  `js/src/transformation/text-to-qp-transformer.js`. The Wikidata
  HTTP client is sketched out behind a `reqwest` feature flag; the
  library currently exposes deterministic operations only.
- **CI/CD** — `.github/workflows/release.yml` (JS) and
  `.github/workflows/rust.yml` are adapted from the two templates.
  The existing `js.yml` keeps gating the Pages deploy.
- **Case study** — this folder.

## What does not ship in this PR

These are tracked as follow-up issues so the PR stays reviewable:

- Actual npm OIDC trusted-publishing config (requires a repo-level
  toggle outside Git).
- Actual crates.io token (requires a `CARGO_REGISTRY_TOKEN` secret).
- Docker Hub publishing (requires `DOCKERHUB_IMAGE` repo var + creds).
- Full Wikidata HTTP client in Rust (port deferred until the JS
  fixture suite is exported).
- Adoption of `links-notation` / `lino-objects-codec` as the on-disk
  cache format — the JS cache and the Rust crate both _accept_ LiNo
  strings via a feature flag, but the in-tree cache still uses JSON
  for compatibility with existing snapshots.

See [`solution-plans.md`](./solution-plans.md) for the per-requirement
status.
