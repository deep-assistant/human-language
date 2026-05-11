//! Pure-function helpers shared by the npm package, the Docker microservice,
//! and the browser SPA. The contracts mirror the JavaScript modules under
//! `js/src/` so parity tests (`rust/tests/parity.rs`) can pin both sides.
//!
//! Modules:
//! - [`tokenize`]: English-text tokenizer + n-gram generator + stop-word and
//!   property-indicator predicates.
//! - [`routing`]: `#mode=…&…` hash parser / serializer for the SPA.
//! - [`settings`]: Locale quote pairs + a (compact) flag map for the
//!   language switcher.
//! - [`lino`]: Renders Q/P sequences into the
//!   [Links Notation](https://github.com/linksplatform/Documentation/blob/main/doc/LinksNotation.md)
//!   form used by the API and the CLI.

pub mod lino;
pub mod routing;
pub mod settings;
pub mod tokenize;

pub use routing::{parse_hash, serialize_hash, ParsedHash, DEFAULT_MODE, MODES};
pub use settings::{flag_for_language, quotes_for_language, QuotePair};
pub use tokenize::{
    generate_ngrams, is_property_indicator, is_stop_word, tokenize, NGRAMS_DEFAULT_MAX,
};

/// Package name shipped on crates.io.
pub const NAME: &str = "human-language";

/// Package version. Matches `Cargo.toml`; bumped together with `package.json`
/// by the release pipeline.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
