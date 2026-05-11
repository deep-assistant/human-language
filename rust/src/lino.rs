//! Render Q/P sequences as Links Notation. Mirrors
//! `js/src/transformation/lino-format.js`.

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
}
