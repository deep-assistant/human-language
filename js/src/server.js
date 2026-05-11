// HTTP microservice that exposes the public `human-language` API.
//
// The server has no third-party HTTP dependencies — it uses Node's
// built-in `http` module. That keeps the published tarball and the
// Docker image lean (the only runtime dependency is Node itself).
//
// Routes:
//   GET  /healthz                          -> { ok: true }
//   GET  /version                          -> { name, version }
//   POST /transform                        -> body { text, options? }
//   GET  /entity/:id                       -> Wikidata entity
//   GET  /property/:id                     -> Wikidata property
//   GET  /search?q=…&type=item|property    -> disambiguation results
//
// Response format negotiation: `Accept: text/plain;codec=lino` selects
// the Links Notation serializer for `POST /transform`. All other paths
// always reply with JSON.

import { createServer as createNodeServer } from 'node:http';
import { URL } from 'node:url';

import { resolveConfig } from './config.js';
import { TextToQPTransformer } from './transformation/text-to-qp-transformer.js';
import { formatTransformResultAsLino } from './transformation/lino-format.js';
import { WikidataAPIClient, WikidataSearchUtility } from './wikidata-api.js';
import { name, version } from './version.js';

const MAX_BODY_BYTES = 1024 * 1024; // 1 MiB request bodies are plenty.

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('request body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw) return resolve({});
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(Object.assign(new Error('invalid JSON'), { status: 400, cause: err }));
      }
    });
    req.on('error', reject);
  });
}

function reply(res, status, body, headers = {}) {
  const isString = typeof body === 'string';
  const payload = isString ? body : JSON.stringify(body);
  const baseHeaders = {
    'content-type': isString ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  };
  res.writeHead(status, { ...baseHeaders, ...headers });
  res.end(payload);
}

function wantsLino(req) {
  const accept = req.headers['accept'] || '';
  return accept.toLowerCase().includes('codec=lino');
}

function pickClient({ wikidataClient, config }) {
  if (wikidataClient) return wikidataClient;
  const client = new WikidataAPIClient(config.cacheType, { cacheDir: config.cacheDir });
  return client;
}

/**
 * Build (but do not listen on) an HTTP server that exposes the public API.
 *
 * @param {object} [opts]
 * @param {ReturnType<typeof resolveConfig>} [opts.config] - Resolved configuration.
 * @param {InstanceType<typeof TextToQPTransformer>} [opts.transformer] - Injected transformer (tests).
 * @param {InstanceType<typeof WikidataAPIClient>} [opts.wikidataClient] - Injected client (tests).
 * @returns {import('node:http').Server}
 */
export function createServer(opts = {}) {
  const config = opts.config || resolveConfig({ env: process.env });
  const transformer = opts.transformer || new TextToQPTransformer();
  const handler = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    try {
      // Health + version
      if (req.method === 'GET' && url.pathname === '/healthz') {
        return reply(res, 200, { ok: true });
      }
      if (req.method === 'GET' && url.pathname === '/version') {
        return reply(res, 200, { name, version });
      }
      if (req.method === 'GET' && url.pathname === '/') {
        return reply(res, 200, {
          name,
          version,
          endpoints: ['/healthz', '/version', '/transform', '/entity/:id', '/property/:id', '/search'],
        });
      }

      // POST /transform
      if (req.method === 'POST' && url.pathname === '/transform') {
        const body = await readJsonBody(req);
        if (!body || typeof body.text !== 'string') {
          return reply(res, 400, { error: 'body.text is required and must be a string' });
        }
        const result = await transformer.transform(body.text, body.options || {});
        if (wantsLino(req)) {
          return reply(res, 200, formatTransformResultAsLino(result), {
            'content-type': 'text/plain;codec=lino; charset=utf-8',
          });
        }
        return reply(res, 200, result);
      }

      // GET /entity/:id and /property/:id and /search
      const entityMatch = req.method === 'GET' && url.pathname.match(/^\/entity\/(Q\d+)$/i);
      if (entityMatch) {
        const client = pickClient({ wikidataClient: opts.wikidataClient, config });
        const data = await client.fetchEntity(entityMatch[1].toUpperCase());
        return reply(res, 200, data);
      }
      const propertyMatch = req.method === 'GET' && url.pathname.match(/^\/property\/(P\d+)$/i);
      if (propertyMatch) {
        const client = pickClient({ wikidataClient: opts.wikidataClient, config });
        const data = await client.fetchProperty(propertyMatch[1].toUpperCase());
        return reply(res, 200, data);
      }
      if (req.method === 'GET' && url.pathname === '/search') {
        const q = url.searchParams.get('q');
        if (!q) return reply(res, 400, { error: 'query parameter `q` is required' });
        const type = url.searchParams.get('type') || 'both';
        const limit = Number(url.searchParams.get('limit') || '10');
        const client = pickClient({ wikidataClient: opts.wikidataClient, config });
        const util = new WikidataSearchUtility(client, null, null);
        const data = await util.disambiguateSearch(q, 'en', limit, type);
        return reply(res, 200, data);
      }

      return reply(res, 404, { error: `no route for ${req.method} ${url.pathname}` });
    } catch (err) {
      const status = err && typeof err.status === 'number' ? err.status : 500;
      return reply(res, status, { error: err?.message || String(err) });
    }
  };

  return createNodeServer(handler);
}

const isMain = (() => {
  if (typeof process === 'undefined' || !process.argv?.[1]) return false;
  try {
    const url = new URL(import.meta.url);
    return url.pathname === process.argv[1] || url.pathname.endsWith(process.argv[1]);
  } catch { return false; }
})();

if (isMain) {
  const config = resolveConfig({ argv: process.argv.slice(2), env: process.env });
  const srv = createServer({ config });
  srv.listen(config.port, config.host, () => {
    const addr = srv.address();
    const host = addr && typeof addr === 'object' ? addr.address : config.host;
    const port = addr && typeof addr === 'object' ? addr.port : config.port;
    process.stdout.write(`human-language listening on http://${host}:${port}\n`);
  });
}
