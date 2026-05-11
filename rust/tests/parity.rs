//! Cross-language parity tests. The expected outputs here are kept in lockstep
//! with the JavaScript test suites under `js/tests/unit/`.
//!
//! When you change a contract, update both sides in the same commit. The PR
//! reviewer should be able to read this file as a spec for "what each
//! pure helper does, in both languages."

use human_language::{
    flag_for_language, generate_ngrams, is_property_indicator, is_stop_word, lino, parse_hash,
    quotes_for_language, serialize_hash, tokenize, ParsedHash,
};

#[test]
fn tokenize_matches_js_basic_case() {
    // Mirrors js/tests/unit/* expectations: punctuation removed, whitespace
    // collapsed, casing preserved.
    let got = tokenize("Albert Einstein was born in Ulm.");
    assert_eq!(got, vec!["Albert", "Einstein", "was", "born", "in", "Ulm"]);
}

#[test]
fn stop_words_match_js_list() {
    for w in ["the", "a", "an", "and", "or", "but", "of"] {
        assert!(is_stop_word(w), "expected `{w}` to be a stop word");
    }
    assert!(!is_stop_word("Einstein"));
}

#[test]
fn property_indicators_include_multiword() {
    assert!(is_property_indicator("instance of"));
    assert!(is_property_indicator("born"));
    assert!(!is_property_indicator("the"));
}

#[test]
fn ngrams_match_js_shape() {
    let tokens = vec![
        "Albert".into(),
        "Einstein".into(),
        "was".into(),
        "born".into(),
    ];
    let got = generate_ngrams(&tokens, 3);
    assert_eq!(got.len(), 3);
    assert_eq!(got[0].1.len(), 4); // unigrams
    assert_eq!(
        got[1].1,
        vec!["Albert Einstein", "Einstein was", "was born"]
    );
    assert_eq!(got[2].1, vec!["Albert Einstein was", "Einstein was born"]);
}

#[test]
fn parse_hash_legacy_forms() {
    // Pinned against js/tests/unit/routing.test.mjs expectations.
    let parsed = parse_hash("#Q35120");
    assert_eq!(parsed.mode, "entity");
    assert_eq!(parsed.get("id"), Some("Q35120"));

    let parsed = parse_hash("#P31");
    assert_eq!(parsed.mode, "property");
    assert_eq!(parsed.get("id"), Some("P31"));
}

#[test]
fn parse_hash_keyed_form() {
    let parsed = parse_hash("#mode=dictionary&word=cat&lang=en");
    assert_eq!(parsed.mode, "dictionary");
    assert_eq!(parsed.get("word"), Some("cat"));
    assert_eq!(parsed.get("lang"), Some("en"));
}

#[test]
fn serialize_hash_skips_empty_values() {
    let parsed = ParsedHash {
        mode: "entity".into(),
        params: vec![("id".into(), "Q42".into()), ("note".into(), "".into())],
    };
    assert_eq!(serialize_hash(&parsed), "#mode=entity&id=Q42");
}

#[test]
fn quotes_for_language_matches_js_table() {
    assert_eq!(quotes_for_language("fr").open, "\u{00AB}");
    assert_eq!(quotes_for_language("de").open, "\u{201E}");
    assert_eq!(quotes_for_language("en-US").open, "\u{201C}");
    assert_eq!(quotes_for_language("xx").open, "\"");
}

#[test]
fn flag_for_language_falls_back_to_globe() {
    assert_eq!(flag_for_language("en"), "\u{1F1EC}\u{1F1E7}");
    assert_eq!(flag_for_language("xx"), "\u{1F310}");
}

#[test]
fn lino_format_matches_js_output() {
    let seq: Vec<lino::SeqItem> = vec!["Q35120".into(), "P31".into(), "Q5".into()];
    assert_eq!(
        lino::format_sequence_as_lino(&seq),
        "sequence:\n  ((Q35120) (P31) (Q5))\n"
    );

    let seq = vec![
        lino::SeqItem::Id("Q5".into()),
        lino::SeqItem::Ambiguous(vec!["Q42".into(), "Q1".into()]),
    ];
    assert_eq!(
        lino::format_sequence_as_lino(&seq),
        "sequence:\n  ((Q5) [Q42 or Q1])\n"
    );
}
