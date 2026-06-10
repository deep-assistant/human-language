import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolveConfig, CONFIG_DEFAULTS } from '../../src/config.js';

test('defaults are returned when no argv/env are given', () => {
  const config = resolveConfig();
  assert.equal(config.port, CONFIG_DEFAULTS.port);
  assert.equal(config.host, CONFIG_DEFAULTS.host);
  assert.equal(config.cacheDir, CONFIG_DEFAULTS.cacheDir);
  assert.equal(config.cacheType, CONFIG_DEFAULTS.cacheType);
  assert.deepEqual(config._, []);
});

test('env vars override defaults', () => {
  const config = resolveConfig({
    env: {
      HUMAN_LANGUAGE_PORT: '9000',
      HUMAN_LANGUAGE_HOST: 'example.test',
      HUMAN_LANGUAGE_CACHE_DIR: '/var/cache',
    },
  });
  assert.equal(config.port, 9000);
  assert.equal(config.host, 'example.test');
  assert.equal(config.cacheDir, '/var/cache');
});

test('argv overrides env', () => {
  const config = resolveConfig({
    argv: ['--port', '7777'],
    env: { HUMAN_LANGUAGE_PORT: '9000' },
  });
  assert.equal(config.port, 7777);
});

test('--key=value form works for long flags', () => {
  const config = resolveConfig({ argv: ['--cache-type=none'] });
  assert.equal(config.cacheType, 'none');
});

test('short flags resolve via alias table', () => {
  const config = resolveConfig({ argv: ['-p', '12345', '-h', 'localhost'] });
  assert.equal(config.port, 12345);
  assert.equal(config.host, 'localhost');
});

test('positional arguments are collected', () => {
  const config = resolveConfig({ argv: ['transform', '--port', '1', 'foo', 'bar'] });
  assert.deepEqual(config._, ['transform', 'foo', 'bar']);
});

test('arguments after `--` go to positionals', () => {
  const config = resolveConfig({ argv: ['--', '--port', '1', 'foo'] });
  assert.deepEqual(config._, ['--port', '1', 'foo']);
  // The double-dash form should not change the port default:
  assert.equal(config.port, CONFIG_DEFAULTS.port);
});

test('unknown flag throws', () => {
  assert.throws(() => resolveConfig({ argv: ['--no-such-flag', '1'] }), /unknown flag/);
});

test('non-integer port throws', () => {
  assert.throws(() => resolveConfig({ argv: ['--port', 'abc'] }), /expected an integer/);
});

test('defaults are deep-frozen (mutation throws in strict mode)', () => {
  assert.throws(() => {
    // @ts-expect-error - deliberately mutating a frozen object
    CONFIG_DEFAULTS.port = 1;
  });
});

test('opts.defaults overrides built-in defaults but is still beaten by env', () => {
  const config = resolveConfig({
    defaults: { port: 1234 },
    env: { HUMAN_LANGUAGE_PORT: '5678' },
  });
  assert.equal(config.port, 5678);
});
