# Rust crate changesets

Each pull request that touches `rust/` should drop a Markdown file here
describing the change. The release workflow (`.github/workflows/rust.yml`
— follow-up) merges these into `CHANGELOG.md` at release time.

## Format

```md
# patch | minor | major

A one-line description of the user-facing change.

## Why

Optional rationale.
```

The first heading is the semver bump level. Empty files are ignored.

## Examples

`pr-XYZ.md`:

```md
# patch

`tokenize` now strips ASCII sentence punctuation `.,!?;:` to match
`js/src/transformation/text-to-qp-transformer.js`.
```
