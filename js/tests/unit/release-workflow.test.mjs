import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const workflow = await readFile('.github/workflows/js.yml', 'utf8');

test('Docker images build on native amd64 and arm64 runners', () => {
  assert.match(workflow, /platform: linux\/amd64\s+runner: ubuntu-latest/);
  assert.match(workflow, /platform: linux\/arm64\s+runner: ubuntu-24\.04-arm/);
  assert.match(workflow, /runs-on: \$\{\{ matrix\.runner \}\}/);
  assert.doesNotMatch(workflow, /setup-qemu-action/);
});

test('architecture builds use isolated GitHub Actions caches and publish digests', () => {
  assert.match(workflow, /cache-from: type=gha,scope=docker-\$\{\{ matrix\.arch \}\}/);
  assert.match(workflow, /cache-to: type=gha,scope=docker-\$\{\{ matrix\.arch \}\},mode=max/);
  assert.match(workflow, /outputs: type=image,name=ghcr\.io\/\$\{\{ github\.repository_owner \}\}\/human-language,push-by-digest=true,name-canonical=true,push=true/);
  assert.match(workflow, /steps\.build\.outputs\.digest/);
});

test('published digests are merged and the multi-platform manifest is verified', () => {
  assert.match(workflow, /needs: \[detect-version-bump, publish-docker\]/);
  assert.match(workflow, /docker buildx imagetools create/);
  assert.match(workflow, /docker buildx imagetools inspect/);
  assert.match(workflow, /linux\/amd64/);
  assert.match(workflow, /linux\/arm64/);
});
