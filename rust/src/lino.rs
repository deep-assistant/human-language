//! Render Q/P sequences as Links Notation. Mirrors
//! `js/src/transformation/lino-format.js`.

use lino_objects_codec::{decode, encode, CodecError, LinoValue};

/// An item in the rendered sequence.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SeqItem {
    /// A resolved atom, e.g. `Q42`.
    Id(String),
    /// An ambiguous slot. Renders as `[A or B or C]`.
    Ambiguous(Vec<String>),
    /// A blank slot. Renders as `()`.
    Empty,
}

impl<S: AsRef<str>> From<S> for SeqItem {
    fn from(value: S) -> Self {
        SeqItem::Id(value.as_ref().to_string())
    }
}

const HEADER: &str = "sequence:";

/// Render a sequence in Links Notation. An empty sequence produces just
/// the bare header, matching the JS implementation.
pub fn format_sequence_as_lino(sequence: &[SeqItem]) -> String {
    if sequence.is_empty() {
        return format!("{HEADER}\n");
    }
    let atoms: Vec<String> = sequence
        .iter()
        .map(|item| match item {
            SeqItem::Id(s) => format!("({s})"),
            SeqItem::Ambiguous(ids) => {
                let filtered: Vec<&str> = ids
                    .iter()
                    .map(String::as_str)
                    .filter(|s| !s.is_empty())
                    .collect();
                format!("[{}]", filtered.join(" or "))
            }
            SeqItem::Empty => "()".into(),
        })
        .collect();
    format!("{HEADER}\n  ({})\n", atoms.join(" "))
}

/// Encode string key/value configuration or state pairs with the upstream
/// `lino-objects-codec` crate.
pub fn encode_string_pairs_as_lino<I, K, V>(pairs: I) -> String
where
    I: IntoIterator<Item = (K, V)>,
    K: Into<String>,
    V: Into<String>,
{
    let value = LinoValue::object(
        pairs
            .into_iter()
            .map(|(key, value)| (key.into(), LinoValue::String(value.into()))),
    );
    encode(&value)
}

/// Decode string key/value pairs produced by [`encode_string_pairs_as_lino`].
pub fn decode_string_pairs_from_lino(notation: &str) -> Result<Vec<(String, String)>, CodecError> {
    let value = decode(notation)?;
    let object = value
        .as_object()
        .ok_or_else(|| CodecError::DecodeError("expected object".into()))?;

    object
        .iter()
        .map(|(key, value)| {
            value
                .as_str()
                .map(|value| (key.clone(), value.to_string()))
                .ok_or_else(|| CodecError::DecodeError(format!("expected string value for {key}")))
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_renders_bare_header() {
        assert_eq!(format_sequence_as_lino(&[]), "sequence:\n");
    }

    #[test]
    fn strings_render_as_atoms() {
        let seq: Vec<SeqItem> = vec!["Q35120".into(), "P31".into(), "Q5".into()];
        assert_eq!(
            format_sequence_as_lino(&seq),
            "sequence:\n  ((Q35120) (P31) (Q5))\n"
        );
    }

    #[test]
    fn ambiguous_uses_bracket_or_syntax() {
        let seq = vec![
            SeqItem::Id("Q5".into()),
            SeqItem::Ambiguous(vec!["Q42".into(), "Q1".into()]),
        ];
        assert_eq!(
            format_sequence_as_lino(&seq),
            "sequence:\n  ((Q5) [Q42 or Q1])\n"
        );
    }

    #[test]
    fn string_pairs_roundtrip_through_lino_objects_codec() {
        let encoded = encode_string_pairs_as_lino([("host", "0.0.0.0"), ("port", "8080")]);
        let decoded = decode_string_pairs_from_lino(&encoded).unwrap();
        assert_eq!(
            decoded,
            vec![
                ("host".to_string(), "0.0.0.0".to_string()),
                ("port".to_string(), "8080".to_string())
            ]
        );
    }
}
