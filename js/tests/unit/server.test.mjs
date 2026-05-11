import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { createServer } from '../../src/server.js';

// Minimal in-memory transformer stub. The server's contract for
// `transform` is: it calls `transformer.transform(text, options)` and
// returns the resolved value as JSON (or LiNo if requested).
class StubTransformer {
  constructor() {
    this.calls = [];
  }
  async transform(text, options) {
    this.calls.push({ text, options });
    return {
      original: text,
      tokens: text.split(/\s+/).filter(Boolean),
      sequence: ['Q35120', 'P31', 'Q5'],
      formatted: 'Q35120 P31 Q5',
      alternatives: [],
    };
  }
}

class StubWikidataClient {
  async fetchEntity(id) {
    return { id, labels: { en: { value: `stub-${id}` } } };
  }
  async fetchProperty(id) {
    return { id, labels: { en: { value: `stub-${id}` } } };
  }
}

async function startServer() {
  const transformer = new StubTransformer();
  const wikidataClient = new StubWikidataClient();
  const srv = createServer({ transformer, wikidataClient });
  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  return {
    srv, port, transformer,
    url: (p) => `http://127.0.0.1:${port}${p}`,
    close: () => new Promise((resolve) => srv.close(resolve)),
  };
}

test('GET /healthz returns ok', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/healthz'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { ok: true });
});

test('GET /version returns name and version', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/version'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, 'human-language');
  assert.match(body.version, /^\d+\.\d+\.\d+/);
});

test('POST /transform returns JSON by default', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/transform'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Einstein' }),
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
  const body = await res.json();
  assert.equal(body.original, 'Einstein');
  assert.deepEqual(body.tokens, ['Einstein']);
});

test('POST /transform returns LiNo when Accept: codec=lino', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/transform'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'text/plain;codec=lino',
    },
    body: JSON.stringify({ text: 'Einstein' }),
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /codec=lino/);
  const body = await res.text();
  assert.match(body, /^sequence:\n {2}\(\(Q35120\) \(P31\) \(Q5\)\)\n$/);
});

test('POST /transform without text returns 400', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/transform'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /body\.text is required/);
});

test('GET /entity/:id proxies to the wikidata client', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/entity/Q42'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, 'Q42');
  assert.equal(body.labels.en.value, 'stub-Q42');
});

test('GET /property/:id proxies to the wikidata client', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/property/P31'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, 'P31');
});

test('GET /entity/bogus returns 404', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/entity/bogus'));
  assert.equal(res.status, 404);
});

test('GET /search without q returns 400', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/search'));
  assert.equal(res.status, 400);
});

test('GET / (root) lists endpoints', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.endpoints));
  assert.ok(body.endpoints.includes('/transform'));
});

test('unknown method on /transform falls through to 404', async () => {
  const ctx = await startServer();
  after(() => ctx.close());
  const res = await fetch(ctx.url('/transform'));
  assert.equal(res.status, 404);
});
