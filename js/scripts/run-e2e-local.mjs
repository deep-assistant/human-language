#!/usr/bin/env node
// Spawns the static server, waits for it to accept connections, then runs
// the Playwright suite against http://localhost:8000. Used by the
// `js.yml` "PR e2e" job *and* by `npm run test:e2e:local` for developers.
//
// The server is killed in `finally`, so a failing test never leaves a
// dangling process behind on a developer machine.

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8000);
const URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url + '/app.html');
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await sleep(250);
  }
  throw new Error(`Static server did not start within ${timeoutMs}ms`);
}

async function alreadyServing(url) {
  try {
    const res = await fetch(url + '/app.html');
    return res.ok;
  } catch {
    return false;
  }
}

let serverProc;
let exitCode = 1;
try {
  // If something is already serving on PORT (e.g. a developer left the
  // dev server running, or CI reused a sidecar), re-use it instead of
  // crashing with EADDRINUSE.
  if (await alreadyServing(URL)) {
    console.log(`Re-using existing server at ${URL}`);
  } else {
    serverProc = spawn(
      process.execPath,
      ['js/scripts/serve-static.mjs'],
      { stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, PORT: String(PORT) } },
    );
    await waitForServer(URL);
  }
  const playwright = spawn(
    'npx',
    ['playwright', 'test', '--config', 'js/tests/e2e/playwright.config.mjs'],
    { stdio: 'inherit', env: { ...process.env, BASE_URL: URL } },
  );
  exitCode = await new Promise((res) => playwright.on('exit', res));
} finally {
  if (serverProc && !serverProc.killed) serverProc.kill('SIGTERM');
  process.exit(exitCode);
}
