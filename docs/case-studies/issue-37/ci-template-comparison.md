# CI/CD template comparison for issue #37

This file records the file-tree comparison requested in issue #37. It
uses **adopted**, **adapted**, and **deferred** to distinguish what PR
#38 actually ships from what remains follow-up work.

## Workflow shape in PR #38

PR review requested the repository to expose two language workflows:

- `.github/workflows/js.yml`
- `.github/workflows/rust.yml`

The JS and Rust template repositories both use `release.yml` internally,
but PR #38 folds the adapted behavior into those language-named
workflows so this repository has one workflow per language surface.

## JS template — `link-foundation/js-ai-driven-development-pipeline-template`

### Workflows

| Template file | PR #38 status | Notes |
| --- | --- | --- |
| `.github/workflows/release.yml` | **adapted into `js.yml`** | Syntax check, unit tests, local Playwright e2e, Pages build/deploy, live Pages e2e, npm publish on `package.json` version bumps, GHCR Docker publish, and GitHub release creation. |
| `.github/workflows/links.yml` | **adapted into `js.yml`** | `js.yml` runs lychee and then checks Web Archive fallback before failing. |
| `.github/actions/publish-dockerhub/action.yml` | **deferred** | PR #38 publishes to GHCR inline. A composite action is useful once a second workflow needs the same Docker setup. |

### Scripts

| Template script | PR #38 status | Notes |
| --- | --- | --- |
| `check-mjs-syntax.sh` | **adapted** as `js/scripts/check-mjs-syntax.mjs` | Existing repo check, used by `js.yml` and `prepack`. |
| `check-web-archive.mjs` | **adapted** as `js/scripts/check-web-archive.mjs` | Existing repo check, used after lychee failures. |
| `check-version.mjs` | **adapted** as `js/scripts/check-package-version.mjs` | Gates npm/Docker release jobs on `package.json` version changes. |
| `detect-code-changes.mjs` | **deferred** | Current jobs are already cheap or gated by `needs`; path-based skipping would add complexity with little benefit. |
| Changeset and release-note scripts | **deferred** | This repo does not yet use changesets. |
| `publish-to-npm.mjs`, `setup-npm.mjs`, `wait-for-npm.mjs`, DockerHub helpers | **deferred** | The workflow inlines the few publish steps it currently needs. |
| `check-file-line-limits.sh` | **deferred** | Existing large files need a separate lint cleanup before this can become a gate. |

### ESLint flat config

**Deferred.** The template's ESLint config would surface pre-existing
violations in the SPA and transformer files. That cleanup is tracked as
a follow-up so the packaging/API PR does not mix in a broad lint sweep.

## Rust template — `link-foundation/rust-ai-driven-development-pipeline-template`

### Workflows

| Template file | PR #38 status | Notes |
| --- | --- | --- |
| `.github/workflows/release.yml` | **adapted as `rust.yml`** | PRs run `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo test --all-targets` on Linux/macOS/Windows. Main pushes publish to crates.io when `rust/Cargo.toml` version changes. |

### Scripts and crate metadata

| Template file/script | PR #38 status | Notes |
| --- | --- | --- |
| Cargo package metadata | **adopted** | `name`, `version`, `license`, `repository`, `readme`, `keywords`, `categories`, `rust-version`, `[lib]`, and `[[bin]]` are present. |
| `check-version.rs` | **adapted** as `rust/scripts/check-cargo-version.mjs` | Gates `cargo publish` on a Cargo.toml version change. |
| Rust lint script | **inlined** | `rust.yml` calls `cargo fmt` and `cargo clippy` directly. |
| Publish script | **inlined** | `rust.yml` calls `cargo publish --locked` directly. |
| Changelog fragment scripts | **deferred** | `rust/changelog.d/README.md` documents the convention; enforcing fragments is follow-up work. |
| `check-file-size.rs` | **deferred** | Same reason as the JS file-line gate. |

## Current PR #38 workflows

- `js.yml`: JS syntax, unit, link, e2e, Pages, npm release, Docker
  release, GitHub release.
- `rust.yml`: Rust fmt, clippy, test matrix, crates.io release.

## Upstream gaps

Potential upstream issues are listed in
[`external-research.md#upstream-gaps-issues-to-file`](./external-research.md#upstream-gaps-issues-to-file).
