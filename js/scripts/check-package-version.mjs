#!/usr/bin/env node
// Detects whether package.json's version changed in the current commit
// relative to its parent. Writes `should_publish=…` and `version=…` to
// $GITHUB_OUTPUT so the release workflow can gate `npm publish` on a
// real version bump.
//
// Honours $FORCE_PUBLISH=true (set by workflow_dispatch) to skip the diff.
//
// Exit status is always 0 — a missing previous version is treated as
// "no publish needed" rather than a CI failure.

import { spawnSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';

function readCurrentVersion() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (!pkg.version) throw new Error('package.json missing `version`');
  return pkg.version;
}

function readPreviousVersion() {
  const result = spawnSync('git', ['show', 'HEAD~1:package.json'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout).version || null;
  } catch {
    return null;
  }
}

function setOutput(key, value) {
  const path = process.env.GITHUB_OUTPUT;
  const line = `${key}=${value}\n`;
  if (path) appendFileSync(path, line);
  else process.stdout.write(line);
}

const current = readCurrentVersion();
setOutput('version', current);

if (process.env.FORCE_PUBLISH === 'true') {
  console.log(`Force publish requested for ${current}.`);
  setOutput('should_publish', 'true');
  process.exit(0);
}

const previous = readPreviousVersion();
if (previous && previous !== current) {
  console.log(`npm package version: ${previous} -> ${current}; publishing.`);
  setOutput('should_publish', 'true');
} else if (!previous) {
  console.log(`npm package version: ${current} (no previous package.json); skipping publish.`);
  setOutput('should_publish', 'false');
} else {
  console.log(`npm package version unchanged at ${current}; skipping publish.`);
  setOutput('should_publish', 'false');
}
