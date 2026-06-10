// Unit tests for js/src/app/routing.js — pure, no DOM required.
//
// We use Node's built-in `node:test` so the suite has zero dependencies. Run
// with `node js/tests/unit/routing.test.mjs` or via `js/scripts/run-unit-tests.mjs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseHash, serializeHash, MODES, DEFAULT_MODE } from '../../src/app/routing.js';

test('parseHash: empty hash returns DEFAULT_MODE with no params', () => {
  for (const h of ['', '#', undefined, null]) {
    assert.deepEqual(parseHash(h), { mode: DEFAULT_MODE, params: {} });
  }
});

test('parseHash: legacy Q-id and P-id forms route to entity/property', () => {
  assert.deepEqual(parseHash('#Q35120'), { mode: 'entity', params: { id: 'Q35120' } });
  assert.deepEqual(parseHash('Q42'),     { mode: 'entity', params: { id: 'Q42' } });
  assert.deepEqual(parseHash('#P31'),    { mode: 'property', params: { id: 'P31' } });
  assert.deepEqual(parseHash('p279'),    { mode: 'property', params: { id: 'P279' } });
});

test('parseHash: explicit mode + params', () => {
  assert.deepEqual(
    parseHash('#mode=alphabet&letter=A'),
    { mode: 'alphabet', params: { letter: 'A' } },
  );
  assert.deepEqual(
    parseHash('#mode=dictionary&word=cat&lang=en&ipa=1'),
    { mode: 'dictionary', params: { word: 'cat', lang: 'en', ipa: '1' } },
  );
});

test('parseHash: unknown modes fall back to DEFAULT_MODE', () => {
  assert.equal(parseHash('#mode=nope').mode, DEFAULT_MODE);
});

test('parseHash: decodes URI-encoded values and `+` as space', () => {
  assert.deepEqual(
    parseHash('#mode=dictionary&word=hello+world'),
    { mode: 'dictionary', params: { word: 'hello world' } },
  );
  assert.deepEqual(
    parseHash('#mode=dictionary&word=caf%C3%A9'),
    { mode: 'dictionary', params: { word: 'café' } },
  );
});

test('serializeHash: round-trips with parseHash', () => {
  for (const mode of MODES) {
    const hash = serializeHash({ mode, params: { a: '1', b: 'two words' } });
    const parsed = parseHash(hash);
    assert.equal(parsed.mode, mode);
    assert.deepEqual(parsed.params, { a: '1', b: 'two words' });
  }
});

test('serializeHash: drops empty / nullish params', () => {
  const hash = serializeHash({ mode: 'entity', params: { id: 'Q1', empty: '', skip: null, also: undefined } });
  assert.equal(hash, '#mode=entity&id=Q1');
});

test('MODES contains exactly the seven expected modes', () => {
  assert.deepEqual([...MODES].sort(), [
    'alphabet', 'dictionary', 'entity', 'generation', 'ontology', 'property', 'transformer',
  ]);
});
