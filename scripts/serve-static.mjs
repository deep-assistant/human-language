#!/usr/bin/env node
// Lightweight static server used by the e2e harness.
//
// The repo is already a static site (the deployed artifact is just
// `app.html` + sibling assets). For local development and CI we need
// *something* that serves it over HTTP so dynamic `import()` and
// `<script type="module">` resolve correctly. We deliberately don't pull in
// `serve`/`http-server` — Node ships everything we need.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, normalize } from 'node:path';

const ROOT = resolve(process.argv[2] || '.');
const PORT = Number(process.env.PORT || 8000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.jsx':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.md':   'text/markdown; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    // Strip leading slash and prevent path traversal.
    let pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    if (!pathname) pathname = 'index.html';
    const filePath = normalize(join(ROOT, pathname));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    let target = filePath;
    try {
      const s = await stat(target);
      if (s.isDirectory()) target = join(target, 'index.html');
    } catch {
      // fall through to readFile, which will surface ENOENT
    }
    const data = await readFile(target);
    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server error: ${err.message}`);
    }
  }
});

server.on('error', (err) => {
  // EADDRINUSE shouldn't crash the harness — print a clear message and exit
  // non-zero so the caller (`run-e2e-local.mjs`) can decide what to do.
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use; not starting a second server.`);
    process.exit(2);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} on http://localhost:${PORT}`);
});
