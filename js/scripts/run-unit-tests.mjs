#!/usr/bin/env node
// Runs every Node-runnable unit/integration test in the repo, in a
// well-defined order, with a per-test timeout so a hung suite can't pin
// down CI. The script returns non-zero if any *fast, deterministic* suite
// fails. The integration suites that hit the live Wikidata API are
// allowed to fail — their value is the rich console output, not a green
// build.

import { spawn } from 'node:child_process';

const FAST_SUITES = [
  // Pure-JS suites with no network dependency. Failures here gate the build.
  'js/tests/unit/routing.test.mjs',
  'js/tests/unit/ipa.test.mjs',
  'js/tests/unit/config.test.mjs',
  'js/tests/unit/lino-format.test.mjs',
  'js/tests/unit/persistent-cache.test.mjs',
  'js/tests/unit/server.test.mjs',
  'js/tests/unit/cli.test.mjs',
  'js/tests/unit/qp-to-text.test.mjs',
  'js/tests/unit/release-workflow.test.mjs',
  'js/tests/unit/ghcr-visibility.test.mjs',
];

const INTEGRATION_SUITES = [
  // Hit the live Wikidata API. Reported but non-gating.
  { file: 'js/scripts/run-tests.mjs',          label: 'transformer suite' },
  { file: 'js/scripts/cache-test.mjs',         label: 'cache sanity' },
  { file: 'js/scripts/unified-cache-test.mjs', label: 'unified cache' },
];

const TIMEOUT_MS = 5 * 60 * 1000;

function run(file, { gating }) {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn(process.execPath, [file], { stdio: 'inherit' });
    const timer = setTimeout(() => {
      console.error(`::error::${file} exceeded ${TIMEOUT_MS / 1000}s — killing.`);
      proc.kill('SIGKILL');
    }, TIMEOUT_MS);
    proc.on('exit', (code) => {
      clearTimeout(timer);
      const ms = Date.now() - start;
      const ok = code === 0;
      console.log(`${ok ? '✓' : '✗'} ${file} (${ms}ms) ${gating ? '[gating]' : '[informational]'}`);
      resolve({ ok, gating });
    });
  });
}

let anyGatingFailed = false;

for (const suite of FAST_SUITES) {
  try {
    await import('node:fs').then((m) => m.promises.access(suite));
  } catch {
    // The unit suites are added incrementally; missing files are OK as
    // long as we exercise the ones that exist.
    console.log(`- ${suite} (skipped: file missing)`);
    continue;
  }
  const { ok } = await run(suite, { gating: true });
  if (!ok) anyGatingFailed = true;
}

for (const { file, label } of INTEGRATION_SUITES) {
  try {
    await import('node:fs').then((m) => m.promises.access(file));
  } catch {
    console.log(`- ${label} (${file}) (skipped: file missing)`);
    continue;
  }
  await run(file, { gating: false });
}

if (anyGatingFailed) {
  console.error('\nOne or more gating unit suites failed.');
  process.exit(1);
}
console.log('\nAll gating suites passed.');
