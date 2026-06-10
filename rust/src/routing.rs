//! Hash-route parser / serializer. Mirrors `js/src/app/routing.js`.

use percent_encoding::{percent_decode_str, utf8_percent_encode, AsciiSet, CONTROLS};

const FRAGMENT: &AsciiSet = &CONTROLS
    .add(b' ')
    .add(b'"')
    .add(b'<')
    .add(b'>')
    .add(b'`')
    .add(b'#')
    .add(b'&')
    .add(b'=')
    .add(b'+');

/// All recognised SPA modes, in declaration order.
pub const MODES: &[&str] = &[
    "alphabet",
    "dictionary",
    "ontology",
    "entity",
    "property",
    "transformer",
];

/// The mode the SPA falls back to when the hash is empty / unknown.
pub const DEFAULT_MODE: &str = "entity";

/// Parsed `#mode=…&…` form.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedHash {
    pub mode: String,
    pub params: Vec<(String, String)>,
}

impl ParsedHash {
    pub fn get(&self, key: &str) -> Option<&str> {
        self.params
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
    }
}

fn is_q_id(s: &str) -> bool {
    let mut chars = s.chars();
    matches!(chars.next(), Some('Q') | Some('q'))
        && !s[1..].is_empty()
        && s[1..].chars().all(|c| c.is_ascii_digit())
}

fn is_p_id(s: &str) -> bool {
    let mut chars = s.chars();
    matches!(chars.next(), Some('P') | Some('p'))
        && !s[1..].is_empty()
        && s[1..].chars().all(|c| c.is_ascii_digit())
}

/// Parse a hash string (with or without the leading `#`) into a
/// [`ParsedHash`]. Handles the legacy bare-`Q\d+` / bare-`P\d+` shorthands.
pub fn parse_hash(hash: &str) -> ParsedHash {
    let cleaned = hash.strip_prefix('#').unwrap_or(hash);
    if cleaned.is_empty() {
        return ParsedHash {
            mode: DEFAULT_MODE.into(),
            params: Vec::new(),
        };
    }
    if is_q_id(cleaned) {
        return ParsedHash {
            mode: "entity".into(),
            params: vec![("id".into(), cleaned.to_ascii_uppercase())],
        };
    }
    if is_p_id(cleaned) {
        return ParsedHash {
            mode: "property".into(),
            params: vec![("id".into(), cleaned.to_ascii_uppercase())],
        };
    }

    let mut mode: Option<String> = None;
    let mut params: Vec<(String, String)> = Vec::new();
    for pair in cleaned.split('&') {
        if pair.is_empty() {
            continue;
        }
        let (raw_key, raw_value) = match pair.find('=') {
            Some(idx) => (&pair[..idx], &pair[idx + 1..]),
            None => (pair, ""),
        };
        let key = percent_decode_str(raw_key).decode_utf8_lossy().into_owned();
        if key.is_empty() {
            continue;
        }
        let value = percent_decode_str(&raw_value.replace('+', " "))
            .decode_utf8_lossy()
            .into_owned();
        if key == "mode" {
            mode = Some(value);
        } else {
            params.push((key, value));
        }
    }
    let mode = match mode {
        Some(m) if MODES.iter().any(|x| *x == m) => m,
        _ => DEFAULT_MODE.into(),
    };
    ParsedHash { mode, params }
}

/// Serialize `parsed` back into a hash string. Empty params are skipped.
/// The output always begins with `#`.
pub fn serialize_hash(parsed: &ParsedHash) -> String {
    let mut out = String::from("#mode=");
    out.push_str(&utf8_percent_encode(&parsed.mode, FRAGMENT).to_string());
    for (k, v) in &parsed.params {
        if v.is_empty() {
            continue;
        }
        out.push('&');
        out.push_str(&utf8_percent_encode(k, FRAGMENT).to_string());
        out.push('=');
        out.push_str(&utf8_percent_encode(v, FRAGMENT).to_string());
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_empty_hash_defaults_to_entity() {
        let got = parse_hash("");
        assert_eq!(got.mode, "entity");
        assert!(got.params.is_empty());
    }

    #[test]
    fn parse_legacy_q_id() {
        let got = parse_hash("#Q35120");
        assert_eq!(got.mode, "entity");
        assert_eq!(got.get("id"), Some("Q35120"));
    }

    #[test]
    fn parse_legacy_p_id_uppercases() {
        let got = parse_hash("#p31");
        assert_eq!(got.mode, "property");
        assert_eq!(got.get("id"), Some("P31"));
    }

    #[test]
    fn parse_keyed_form() {
        let got = parse_hash("#mode=dictionary&word=cat&lang=en");
        assert_eq!(got.mode, "dictionary");
        assert_eq!(got.get("word"), Some("cat"));
        assert_eq!(got.get("lang"), Some("en"));
    }

    #[test]
    fn parse_unknown_mode_falls_back() {
        let got = parse_hash("#mode=cats&id=Q1");
        assert_eq!(got.mode, "entity");
        assert_eq!(got.get("id"), Some("Q1"));
    }

    #[test]
    fn serialize_skips_empty_params() {
        let parsed = ParsedHash {
            mode: "entity".into(),
            params: vec![("id".into(), "Q42".into()), ("note".into(), "".into())],
        };
        assert_eq!(serialize_hash(&parsed), "#mode=entity&id=Q42");
    }

    #[test]
    fn roundtrip_through_parse_then_serialize() {
        let original = "#mode=dictionary&word=cat&lang=en";
        let serialized = serialize_hash(&parse_hash(original));
        assert_eq!(serialized, original);
    }
}
