import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

const execFileAsync = promisify(execFile);
const script = 'scripts/verify-ghcr-visibility.sh';

async function runProbe(
  status,
  image = 'ghcr.io/link-assistant/human-language',
  token = 'super-secret-pull-token',
) {
  const sandbox = await mkdtemp(join(tmpdir(), 'human-language-ghcr-'));
  const fakeCurl = join(sandbox, 'curl');
  await writeFile(fakeCurl, `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$SANDBOX/calls.log"
output=''
while [ "$#" -gt 0 ]; do
  if [ "$1" = '-o' ]; then output="$2"; shift; fi
  shift
done
if [ -n "$output" ]; then
  printf '{"token":"%s"}\\n' "$FAKE_CURL_TOKEN" > "$output"
fi
if [ "$FAKE_CURL_STATUS" = transport ]; then exit 7; fi
printf '%s' "$FAKE_CURL_STATUS"
`);
  await chmod(fakeCurl, 0o755);

  let result;
  try {
    result = await execFileAsync('bash', [script], {
      env: {
        ...process.env,
        PATH: `${sandbox}${delimiter}${process.env.PATH}`,
        SANDBOX: sandbox,
        FAKE_CURL_STATUS: status,
        FAKE_CURL_TOKEN: token,
        GHCR_IMAGE: image,
        VERIFY_GHCR_VISIBILITY_DELAY: '0',
      },
    });
  } catch (error) {
    result = error;
  }

  const calls = await readFile(join(sandbox, 'calls.log'), 'utf8').catch(() => '');
  await rm(sandbox, { recursive: true, force: true });
  return { ...result, calls };
}

test('HTTP 200 proves anonymous pull access without exposing the token', async () => {
  const result = await runProbe('200');

  assert.equal(result.code, undefined, result.stderr);
  assert.match(result.stdout, /is public/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /super-secret-pull-token/);
  assert.equal(result.calls.trim().split('\n').length, 1);
  assert.match(result.calls, /^-q -sS /);
  assert.doesNotMatch(result.calls, /Authorization|GITHUB_TOKEN|--user|-u /);
  assert.match(
    result.calls,
    /https:\/\/ghcr\.io\/token\?service=ghcr\.io&scope=repository:link-assistant\/human-language:pull/,
  );
});

test('tag and digest suffixes are excluded from the repository scope', async () => {
  for (const image of [
    'ghcr.io/link-assistant/human-language:0.2.1',
    'ghcr.io/link-assistant/human-language@sha256:0123456789abcdef',
  ]) {
    const result = await runProbe('200', image);
    assert.match(
      result.calls,
      /scope=repository:link-assistant\/human-language:pull/,
    );
  }
});

test('HTTP 200 without a pull token fails closed', async () => {
  const result = await runProbe('200', undefined, '');

  assert.equal(result.code, 1);
  assert.match(result.stdout, /without an anonymous pull token/);
});

test('HTTP 401 fails closed and explains the one-time visibility bootstrap', async () => {
  const result = await runProbe('401');

  assert.equal(result.code, 1);
  assert.match(result.stdout, /PRIVATE/);
  assert.match(result.stdout, /Change visibility/);
});

test('HTTP 403 fails as missing or denied', async () => {
  const result = await runProbe('403');

  assert.equal(result.code, 1);
  assert.match(result.stdout, /DENIED/);
  assert.doesNotMatch(result.stdout, /PRIVATE/);
});

for (const status of ['503', 'transport']) {
  test(`${status} failures exhaust the bounded retry budget`, async () => {
    const result = await runProbe(status);

    assert.equal(result.code, 1);
    assert.equal(result.calls.trim().split('\n').length, 3);
    assert.match(result.stdout, /after 3 attempt/);
  });
}

test('unexpected statuses fail instead of passing by default', async () => {
  const result = await runProbe('418');

  assert.equal(result.code, 1);
  assert.match(result.stdout, /Unexpected HTTP 418/);
});

test('an unset image cannot silently pass', async () => {
  const result = await runProbe('200', '');

  assert.equal(result.code, 1);
  assert.match(result.stdout, /GHCR_IMAGE is not set/);
  assert.equal(result.calls, '');
});

test('the probe is valid Bash', async () => {
  await execFileAsync('bash', ['-n', script]);
});

test('the executable probe contains no credential plumbing', async () => {
  const contents = await readFile(script, 'utf8');
  const executable = contents
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');

  for (const credential of ['Authorization', 'GITHUB_TOKEN', '--user', '-u ']) {
    assert.doesNotMatch(executable, new RegExp(credential));
  }
});

test('the manifest publishing path verifies visibility and source metadata', async () => {
  const workflow = await readFile('.github/workflows/js.yml', 'utf8');
  const manifestJob = workflow.split('\n  merge-docker-manifest:')[1]
    .split('\n  create-release:')[0];
  const createOffset = manifestJob.indexOf('- name: Create manifest list and push');
  const verifyOffset = manifestJob.indexOf('bash scripts/verify-ghcr-visibility.sh');

  assert.ok(createOffset >= 0);
  assert.ok(verifyOffset > createOffset, 'anonymous verification must follow manifest creation');
  assert.match(manifestJob, /actions\/checkout@v6/);
  assert.match(
    workflow,
    /org\.opencontainers\.image\.source=https:\/\/github\.com\/link-assistant\/human-language/,
  );
});
