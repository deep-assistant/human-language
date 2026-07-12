// Unit tests for js/src/app/ipa.js.
//
// `toIpa` calls out to network backends, so we stub `globalThis.fetch` to
// make the tests deterministic and offline. `toIpaForEntity` is exercised
// with a synthetic entity payload — no network at all.

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const { toIpa, toIpaForEntity } = await import('../../src/app/ipa.js');

function stubFetch(plan) {
  // `plan` is an object whose keys are URL substrings and values are the
  // JSON payloads to return. Anything that doesn't match returns 404.
  return mock.fn(async (url) => {
    for (const [needle, body] of Object.entries(plan)) {
      if (String(url).includes(needle)) {
        return new Response(JSON.stringify(body), { status: 200 });
      }
    }
    return new Response('not found', { status: 404 });
  });
}

test('toIpa returns "" for empty / non-string input', async () => {
  assert.equal(await toIpa(''), '');
  assert.equal(await toIpa(null), '');
  assert.equal(await toIpa(undefined), '');
  assert.equal(await toIpa(42), '');
});

test('toIpa: preserves whitespace and punctuation between tokens', async () => {
  globalThis.fetch = stubFetch({
    '/api/v2/entries/en/hello':  [{ phonetic: '/həˈloʊ/' }],
    '/api/v2/entries/en/world':  [{ phonetic: '/wɜːrld/' }],
  });
  const out = await toIpa('hello, world!');
  assert.match(out, /həˈloʊ/);
  assert.match(out, /wɜːrld/);
  assert.match(out, /,\s/); // comma and space preserved
  assert.ok(out.endsWith('!'), `expected trailing "!" in ${JSON.stringify(out)}`);
});

test('toIpa: tokens with no backend hit are flagged with [?]', async () => {
  globalThis.fetch = stubFetch({}); // nothing matches
  const out = await toIpa('xyzzy', 'en');
  assert.match(out, /\[\?\]xyzzy/);
});

test('toIpaForEntity: uses P898 claim when present', async () => {
  const entity = {
    claims: {
      P898: [{ mainsnak: { datavalue: { value: { text: 'kæt' } } } }],
    },
    labels: { en: { value: 'cat' } },
  };
  const out = await toIpaForEntity(entity, 'en');
  assert.equal(out, '/kæt/');
});

test('toIpaForEntity: keeps existing slashes in P898 value', async () => {
  const entity = {
    claims: {
      P898: [{ mainsnak: { datavalue: { value: '/ˈleɪbəl/' } } }],
    },
  };
  const out = await toIpaForEntity(entity, 'en');
  assert.equal(out, '/ˈleɪbəl/');
});

test('toIpaForEntity: prefers the P898 transcription matching the display language', async () => {
  const entity = {
    claims: {
      P898: [
        { mainsnak: { datavalue: { value: { text: 'kæt', language: 'en' } } } },
        { mainsnak: { datavalue: { value: { text: 'ʃa', language: 'fr' } } } },
      ],
    },
  };
  assert.equal(await toIpaForEntity(entity, 'fr-FR'), '/ʃa/');
});

test('toIpaForEntity: falls back to label-driven toIpa when no P898', async () => {
  globalThis.fetch = stubFetch({
    '/api/v2/entries/en/cat': [{ phonetic: '/kæt/' }],
  });
  const entity = { labels: { en: { value: 'cat' } } };
  const out = await toIpaForEntity(entity, 'en');
  assert.match(out, /kæt/);
});

test('toIpaForEntity: empty entity returns ""', async () => {
  assert.equal(await toIpaForEntity({}, 'en'), '');
  assert.equal(await toIpaForEntity(null, 'en'), '');
});
