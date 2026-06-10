//! Locale-aware quotes + flag emoji per BCP-47 language tag.
//! Mirrors `js/src/settings.js`. The flag map is intentionally compact —
//! only the language tags actually used by the SPA are listed; the
//! JavaScript table is broader and is the source of truth for the browser
//! (this module is for crates.io / CLI consumers).

/// Pair of opening / closing quote characters used by a locale.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct QuotePair {
    pub open: &'static str,
    pub close: &'static str,
}

const QUOTES: &[(&str, QuotePair)] = &[
    (
        "en",
        QuotePair {
            open: "\u{201C}",
            close: "\u{201D}",
        },
    ),
    (
        "de",
        QuotePair {
            open: "\u{201E}",
            close: "\u{201C}",
        },
    ),
    (
        "fr",
        QuotePair {
            open: "\u{00AB}",
            close: "\u{00BB}",
        },
    ),
    (
        "ru",
        QuotePair {
            open: "\u{00AB}",
            close: "\u{00BB}",
        },
    ),
    (
        "pl",
        QuotePair {
            open: "\u{201E}",
            close: "\u{201D}",
        },
    ),
    (
        "es",
        QuotePair {
            open: "\u{00AB}",
            close: "\u{00BB}",
        },
    ),
    (
        "it",
        QuotePair {
            open: "\u{00AB}",
            close: "\u{00BB}",
        },
    ),
    (
        "zh",
        QuotePair {
            open: "\u{201C}",
            close: "\u{201D}",
        },
    ),
    (
        "ja",
        QuotePair {
            open: "\u{300C}",
            close: "\u{300D}",
        },
    ),
    (
        "ko",
        QuotePair {
            open: "\u{201C}",
            close: "\u{201D}",
        },
    ),
    (
        "uk",
        QuotePair {
            open: "\u{00AB}",
            close: "\u{00BB}",
        },
    ),
    (
        "cs",
        QuotePair {
            open: "\u{201E}",
            close: "\u{201C}",
        },
    ),
    (
        "sk",
        QuotePair {
            open: "\u{201E}",
            close: "\u{201C}",
        },
    ),
];

const DEFAULT_QUOTES: QuotePair = QuotePair {
    open: "\"",
    close: "\"",
};

/// Look up the quote pair for a language. Falls back through `xx-yy → xx`
/// before returning ASCII double quotes.
pub fn quotes_for_language(tag: &str) -> QuotePair {
    let lowered = tag.to_lowercase();
    if let Some(pair) = QUOTES.iter().find(|(k, _)| *k == lowered).map(|(_, v)| *v) {
        return pair;
    }
    if let Some(base) = lowered.split('-').next() {
        if let Some(pair) = QUOTES.iter().find(|(k, _)| *k == base).map(|(_, v)| *v) {
            return pair;
        }
    }
    DEFAULT_QUOTES
}

const FLAGS: &[(&str, &str)] = &[
    ("en", "\u{1F1EC}\u{1F1E7}"),
    ("de", "\u{1F1E9}\u{1F1EA}"),
    ("fr", "\u{1F1EB}\u{1F1F7}"),
    ("es", "\u{1F1EA}\u{1F1F8}"),
    ("it", "\u{1F1EE}\u{1F1F9}"),
    ("pt", "\u{1F1F5}\u{1F1F9}"),
    ("ru", "\u{1F1F7}\u{1F1FA}"),
    ("nl", "\u{1F1F3}\u{1F1F1}"),
    ("pl", "\u{1F1F5}\u{1F1F1}"),
    ("zh", "\u{1F1E8}\u{1F1F3}"),
    ("ja", "\u{1F1EF}\u{1F1F5}"),
    ("ko", "\u{1F1F0}\u{1F1F7}"),
    ("uk", "\u{1F1FA}\u{1F1E6}"),
    ("ar", "\u{1F1F8}\u{1F1E6}"),
    ("hi", "\u{1F1EE}\u{1F1F3}"),
    ("he", "\u{1F1EE}\u{1F1F1}"),
];

const DEFAULT_FLAG: &str = "\u{1F310}";

/// Returns the flag emoji for a BCP-47 tag, falling back through `xx-yy → xx`
/// and finally to the globe emoji.
pub fn flag_for_language(tag: &str) -> &'static str {
    let lowered = tag.to_lowercase();
    if let Some(flag) = FLAGS.iter().find(|(k, _)| *k == lowered).map(|(_, v)| *v) {
        return flag;
    }
    if let Some(base) = lowered.split('-').next() {
        if let Some(flag) = FLAGS.iter().find(|(k, _)| *k == base).map(|(_, v)| *v) {
            return flag;
        }
    }
    DEFAULT_FLAG
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quotes_direct_lookup() {
        assert_eq!(quotes_for_language("fr").open, "\u{00AB}");
    }

    #[test]
    fn quotes_fallback_through_base_tag() {
        assert_eq!(quotes_for_language("en-US").open, "\u{201C}");
    }

    #[test]
    fn quotes_default_to_ascii() {
        assert_eq!(
            quotes_for_language("xx-YY"),
            QuotePair {
                open: "\"",
                close: "\""
            }
        );
    }

    #[test]
    fn flags_direct_lookup() {
        assert_eq!(flag_for_language("ja"), "\u{1F1EF}\u{1F1F5}");
    }

    #[test]
    fn flags_fallback_through_base_tag() {
        assert_eq!(flag_for_language("en-GB"), "\u{1F1EC}\u{1F1E7}");
    }

    #[test]
    fn flags_default_to_globe() {
        assert_eq!(flag_for_language("zxx"), "\u{1F310}");
    }
}
