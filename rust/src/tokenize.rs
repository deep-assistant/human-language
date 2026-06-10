//! Tokenization, n-gram generation, and the small word lists used by the
//! text-to-Q/P transformer. Mirrors `js/src/transformation/text-to-qp-transformer.js`.

/// Default maximum n-gram length used by the transformer.
pub const NGRAMS_DEFAULT_MAX: usize = 3;

/// Words that the JS transformer skips entirely.
pub const STOP_WORDS: &[&str] = &[
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
];

/// Single-token or short-phrase indicators of a Wikidata *property*.
///
/// Multi-word entries are matched after tokenization by checking joined
/// n-grams (see [`is_property_indicator`]).
pub const PROPERTY_INDICATORS: &[&str] = &[
    "is",
    "was",
    "are",
    "were",
    "has",
    "have",
    "had",
    "born",
    "died",
    "located",
    "created",
    "founded",
    "married",
    "wrote",
    "directed",
    "invented",
    "discovered",
    "contains",
    "belongs",
    "relates",
    "connects",
    "instance of",
    "part of",
    "member of",
    "capital of",
    "owned by",
    "child of",
    "parent of",
    "spouse of",
    "sibling of",
];

/// Split `text` into lowercase-preserving tokens.
///
/// Drops ASCII sentence punctuation (`.,!?;:`) and collapses any whitespace
/// run. Returns an empty `Vec` for an empty input.
pub fn tokenize(text: &str) -> Vec<String> {
    text.chars()
        .map(|c| {
            if matches!(c, '.' | ',' | '!' | '?' | ';' | ':') {
                ' '
            } else {
                c
            }
        })
        .collect::<String>()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect()
}

/// Returns true if the (already lowercase-folded) word is in [`STOP_WORDS`].
pub fn is_stop_word(word: &str) -> bool {
    let lowered = word.to_lowercase();
    STOP_WORDS.iter().any(|w| *w == lowered)
}

/// Returns true if the (already lowercase-folded) phrase appears in
/// [`PROPERTY_INDICATORS`]. Multi-word indicators are matched as a single
/// space-joined string.
pub fn is_property_indicator(phrase: &str) -> bool {
    let lowered = phrase.to_lowercase();
    PROPERTY_INDICATORS.iter().any(|w| *w == lowered)
}

/// Build every contiguous n-gram of size 1..=`max_size` from `tokens`,
/// grouped by size. Keys are the n-gram sizes; values are the join-by-space
/// strings (so callers can search Wikidata for the joined phrase).
///
/// Equivalent to the JS `generateNgrams` with the same `maxNgramSize`.
pub fn generate_ngrams(tokens: &[String], max_size: usize) -> Vec<(usize, Vec<String>)> {
    let mut out: Vec<(usize, Vec<String>)> = Vec::new();
    if tokens.is_empty() || max_size == 0 {
        return out;
    }
    let max = max_size.min(tokens.len());
    for size in 1..=max {
        let mut bucket = Vec::with_capacity(tokens.len().saturating_sub(size - 1));
        for window in tokens.windows(size) {
            bucket.push(window.join(" "));
        }
        out.push((size, bucket));
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokenize_strips_punctuation_and_splits_whitespace() {
        let got = tokenize("Hello, world! How are you?");
        assert_eq!(got, vec!["Hello", "world", "How", "are", "you"]);
    }

    #[test]
    fn tokenize_returns_empty_for_blank_input() {
        assert!(tokenize("").is_empty());
        assert!(tokenize("   \t\n").is_empty());
    }

    #[test]
    fn stop_words_are_case_insensitive() {
        assert!(is_stop_word("the"));
        assert!(is_stop_word("THE"));
        assert!(!is_stop_word("Einstein"));
    }

    #[test]
    fn property_indicators_match_phrases() {
        assert!(is_property_indicator("instance of"));
        assert!(is_property_indicator("Instance Of"));
        assert!(!is_property_indicator("of"));
    }

    #[test]
    fn ngrams_window_correctly() {
        let tokens = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let got = generate_ngrams(&tokens, 3);
        assert_eq!(got[0], (1, vec!["a".into(), "b".into(), "c".into()]));
        assert_eq!(got[1], (2, vec!["a b".into(), "b c".into()]));
        assert_eq!(got[2], (3, vec!["a b c".into()]));
    }

    #[test]
    fn ngrams_caps_at_token_length() {
        let tokens = vec!["a".to_string(), "b".to_string()];
        let got = generate_ngrams(&tokens, 5);
        assert_eq!(got.len(), 2);
        assert_eq!(got[1], (2, vec!["a b".into()]));
    }
}
