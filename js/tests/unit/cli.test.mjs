import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(HERE, '..', '..', 'src', 'cli.js');

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 10_000,
  });
}

test('`help` prints usage and exits 0', () => {
  const r = runCli(['help']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage: human-language/);
  assert.match(r.stdout, /transform/);
  assert.match(r.stdout, /serve/);
});

test('no args prints usage', () => {
  const r = runCli([]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage: human-language/);
});

test('`version` prints package name and version', () => {
  const r = runCli(['version']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^human-language \d+\.\d+\.\d+/);
});

test('unknown command exits non-zero with a hint', () => {
  const r = runCli(['no-such-command']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /unknown command/);
});

test('`transform` without text exits 2', () => {
  const r = runCli(['transform']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /requires a text argument/);
});

test('`entity` without id exits 2', () => {
  const r = runCli(['entity']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /requires an id/);
});
