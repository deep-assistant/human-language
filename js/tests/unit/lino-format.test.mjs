import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatSequenceAsLino,
  formatTransformResultAsLino,
} from '../../src/transformation/lino-format.js';

test('empty sequence renders the bare header', () => {
  assert.equal(formatSequenceAsLino([]), 'sequence:\n');
});

test('non-array input is treated as empty', () => {
  assert.equal(formatSequenceAsLino(null), 'sequence:\n');
  assert.equal(formatSequenceAsLino(undefined), 'sequence:\n');
});

test('string sequence renders as parenthesized atoms', () => {
  const out = formatSequenceAsLino(['Q35120', 'P31', 'Q5']);
  assert.equal(out, 'sequence:\n  ((Q35120) (P31) (Q5))\n');
});

test('ambiguous candidates render with bracket+`or` syntax', () => {
  const out = formatSequenceAsLino([
    'Q5',
    { type: 'ambiguous', alternatives: [{ id: 'Q42' }, { id: 'Q1' }] },
  ]);
  assert.equal(out, 'sequence:\n  ((Q5) [Q42 or Q1])\n');
});

test('object items with id render as parenthesized atoms', () => {
  const out = formatSequenceAsLino([{ id: 'Q100' }]);
  assert.equal(out, 'sequence:\n  ((Q100))\n');
});

test('formatTransformResultAsLino accepts the full result shape', () => {
  const result = {
    original: 'cats',
    tokens: ['cats'],
    sequence: ['Q146'],
    formatted: 'Q146',
    alternatives: [],
  };
  assert.equal(formatTransformResultAsLino(result), 'sequence:\n  ((Q146))\n');
});

test('formatTransformResultAsLino returns "" for a falsy result', () => {
  assert.equal(formatTransformResultAsLino(null), '');
  assert.equal(formatTransformResultAsLino(undefined), '');
});
