# human-language (Rust)

Rust crate that mirrors the pure-function helpers of the JavaScript package
[`human-language`](https://www.npmjs.com/package/human-language). It powers the
Rust CLI, future WASM builds for the SPA, and any downstream consumer that
needs to tokenize text, parse the SPA hash, or render a Q/P sequence as
[Links Notation](https://github.com/link-foundation/links-notation)
without spinning up a Node runtime.

The crate is published to [crates.io](https://crates.io/crates/human-language)
in lockstep with the npm package: bumping `Cargo.toml` and `package.json`
together is part of the release checklist (`docs/case-studies/issue-37/timeline.md`).

## What ships

- `human_language::tokenize::{tokenize, generate_ngrams, is_stop_word, is_property_indicator}`
- `human_language::routing::{parse_hash, serialize_hash, ParsedHash, MODES, DEFAULT_MODE}`
- `human_language::settings::{quotes_for_language, flag_for_language, QuotePair}`
- `human_language::lino::{format_sequence_as_lino, SeqItem}`
- `human-language` binary with `tokenize`, `parse-hash`, `lino-sequence`,
  `version`, `help` subcommands.

## What's deferred

The network-backed parts of the transformer (Wikidata API client,
search/disambiguation, file/IndexedDB cache) currently live only in
JavaScript. Tracked under R3 in
`../docs/case-studies/issue-37/solution-plans.md`.

## Development

```sh
# from the repo root
cd rust
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

## Parity with JavaScript

`tests/parity.rs` pins the Rust output against the JavaScript test suite
under `../js/tests/unit/`. When either side changes a contract, update both
in the same commit.

## License

MIT — see [`../LICENSE`](../LICENSE).
