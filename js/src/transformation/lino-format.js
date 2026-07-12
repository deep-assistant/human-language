// Serialise transformer output as a Links Notation (LiNo) string.
//
// The on-wire shape we emit looks like:
//
//   sequence:
//     ((Q35120) (P31) (Q5) (P21) (Q6581097))
//
// where each parenthesised atom is a Wikidata Q-id or P-id. Ambiguous
// matches use the `[A or B or C]` syntax that already appears in the
// transformer's `formatted` field, e.g. `[Q1 or Q2 or Q3]`.
//
// This is a deterministic, dependency-free serializer. The upstream
// `links-notation` parser is a candidate to *consume* LiNo documents on
// input — that path is tracked as a follow-up issue (R8 in the issue-37
// case study).

const LINO_HEADER = 'sequence:';

/**
 * @param {Array<string|{type:string,alternatives:Array<{id:string}>}>} sequence
 * @returns {string}
 */
export function formatSequenceAsLino(sequence) {
  if (!Array.isArray(sequence)) return `${LINO_HEADER}\n`;
  const atoms = sequence.map((item) => {
    if (typeof item === 'string') return `(${item})`;
    if (item && item.type === 'ambiguous' && Array.isArray(item.alternatives)) {
      const ids = item.alternatives.map((alt) => alt.id).filter(Boolean);
      return `[${ids.join(' or ')}]`;
    }
    if (item && item.id) return `(${item.id})`;
    return '()';
  });
  if (atoms.length === 0) return `${LINO_HEADER}\n`;
  return `${LINO_HEADER}\n  (${atoms.join(' ')})\n`;
}

/**
 * @param {object} result - The return value of `TextToQPTransformer#transform`.
 * @returns {string}
 */
export function formatTransformResultAsLino(result) {
  if (!result || typeof result !== 'object') return '';
  return formatSequenceAsLino(result.sequence);
}

export default { formatSequenceAsLino, formatTransformResultAsLino };
