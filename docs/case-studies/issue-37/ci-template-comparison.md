# CI/CD template comparison for issue #37

This file follows the convention of [`../issue-33/ci-template-comparison.md`](../issue-33/ci-template-comparison.md)
and [`../issue-35/ci-template-comparison.md`](../issue-35/ci-template-comparison.md):
a file-by-file inventory of each template, marking each entry as
**adopted**, **adapted**, or **deferred**.

## JS template — `link-foundation/js-ai-driven-development-pipeline-template`

### Workflows (`.github/workflows/`)

| Template file | Adopted in PR #38 | Notes |
| --- | --- | --- |
| `release.yml` | **adapted** as `release.yml` | Subsetted to: detect-changes, lint, test, build, npm-publish, docker-publish (gated on `vars.DOCKERHUB_IMAGE`), changeset-pr. Manual-release and instant-release branches kept; matrix reduced to Node 20 x ubuntu (the project's only supported runtime). |
| `links.yml` | **deferred** | The current `js.yml` already runs lychee; running a second workflow would double-bill. |
| `pages.yml` | **n/a** | The template publishes to npm, not Pages. `js.yml` handles Pages. |
| `auto-merge.yml` | **deferred** | Not needed yet. |
| `bom-check.yml` | **deferred** | Project has no software bill of materials yet. |

### `scripts/` (24 mjs / sh)

| Template script | Adopted in PR #38 | Notes |
| --- | --- | --- |
| `check-mjs-syntax.mjs` | **adopted previously** in PR #36 | Used by `js.yml`. |
| `check-web-archive.mjs` | **adopted previously** | Used by `js.yml`. |
| `detect-code-changes.mjs` | **adapted** | Trimmed to the file paths we ship (no Bun/Deno matrix yet). |
| `check-version.mjs` | **adopted** | Required by `release.yml`. |
| `validate-changeset.mjs` | **adopted** | Required by changeset-pr job. |
| `merge-changesets.mjs` | **adopted** | Required by changeset-pr job. |
| `setup-npm.mjs` | **adopted** | OIDC trusted-publishing setup. |
| `publish-to-npm.mjs` | **adopted** | Drop-in. |
| `wait-for-npm.mjs` | **adopted** | Used by docker-publish job. |
| `check-docker-publish.mjs` | **adopted** | Gates docker-publish job on `vars.DOCKERHUB_IMAGE`. |
| `create-github-release.mjs` | **adopted** | After successful npm publish. |
| `format-github-release.mjs` | **adopted** | Companion. |
| `version-and-commit.mjs` | **adopted** | Companion. |
| `check-file-line-limits.sh` | **deferred** | The project has files >1500 lines (`app.html`, generated `api-patterns.json`); adopting this gate would require a sweep that is out-of-scope. |
| `simulate-fresh-merge.sh` | **deferred** | Local dev aid; not needed in CI. |

### ESLint flat config

**Deferred.** Adopting the template's flat config would surface ~30
ESLint violations in `js/src/transformation/text-to-qp-transformer.js`
and the SPA mode files that predate the rules. PR #38 does not lint.
Tracked as a follow-up.

## Rust template — `link-foundation/rust-ai-driven-development-pipeline-template`

### Workflows

| Template file | Adopted in PR #38 | Notes |
| --- | --- | --- |
| `release.yml` | **adapted** as `rust.yml` | Subsetted to: detect-changes, lint, test matrix (ubuntu-latest only in PR #38, matrix to widen in a follow-up), build, manual-release. Coverage (`cargo-llvm-cov` + Codecov) is wired but the Codecov upload step needs a `CODECOV_TOKEN` secret and is set to `continue-on-error: true`. |
| `auto-merge.yml` | **deferred** | Not needed yet. |
| `bom-check.yml` | **deferred** | |

### `scripts/` (16 rust-script `.rs` files)

| Template script | Adopted in PR #38 | Notes |
| --- | --- | --- |
| `detect-changes.rs` | **adapted** | Smaller diff scope. |
| `check-version.rs` | **adopted** | |
| `lint.rs` | **adopted** | Calls `cargo fmt --check` and `cargo clippy --all-targets --all-features`. |
| `file-size-check.rs` | **deferred** | Same reason as the JS counterpart. |
| `publish-crate.rs` | **adopted** | Used by manual-release. |
| `wait-for-crate.rs` | **adopted** | Used by docker-publish. |
| `changelog-fragment-check.rs` | **adopted** | Used by changeset-pr job; placeholder fragment under `rust/changelog.d/` ships in PR #38. |

### `Cargo.toml`

The template's lint set (`clippy::pedantic + nursery`, `unsafe_code = "forbid"`)
is adopted. The release profile tuning (`lto = true`,
`codegen-units = 1`, `strip = true`) is adopted.

The `dependencies` block in the template depends on
`lino-arguments = "0.3"` + `clap`. PR #38 keeps both. The template
also depends on `serde + serde_json` for output formatting; we keep
both because the HTTP path uses them.

## Composite actions (`.github/actions/`)

Both templates ship reusable composite actions
(`setup-npm-publish/`, `setup-rust-toolchain/`, `publish-dockerhub/`).
In PR #38 we **inline** the steps rather than create the composite
actions: the inlined version is shorter than the wrapper for a single
caller. The composite actions will be extracted once `release.yml`
gains a second caller (e.g. a Rust+JS combined release flow).

## Summary of jobs in PR #38

`/.github/workflows/`:

- `js.yml` — unchanged (gates Pages deploy).
- `release.yml` — new: npm publish + optional Docker publish.
- `rust.yml` — new: Rust lint + test + (manual) crates.io publish.

## Upstream gaps reported back to templates

Captured in [`external-research.md#upstream-gaps-issues-to-file`](./external-research.md#upstream-gaps-issues-to-file).
