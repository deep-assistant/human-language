#!/usr/bin/env node
// Detects whether `rust/Cargo.toml`'s package version changed in the
// current commit relative to its parent. Writes `should_publish=…` and
// `version=…` to $GITHUB_OUTPUT so the release workflow can gate
// `cargo publish` on a real version bump.
//
// Exit status is always 0 — a missing previous version is treated as
// "no publish needed" rather than a CI failure.

import { spawnSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';

function readCurrentVersion() {
  const text = readFileSync('rust/Cargo.toml', 'utf8');
  const m = text.match(/^\s*\[package\][^[]*?^\s*version\s*=\s*"([^"]+)"/ms);
  if (!m) throw new Error('Could not find [package].version in rust/Cargo.toml');
  return m[1];
}

function readPreviousVersion() {
  const result = spawnSync('git', ['show', 'HEAD~1:rust/Cargo.toml'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const m = result.stdout.match(/^\s*\[package\][^[]*?^\s*version\s*=\s*"([^"]+)"/ms);
  return m ? m[1] : null;
}

function setOutput(key, value) {
  const path = process.env.GITHUB_OUTPUT;
  const line = `${key}=${value}\n`;
  if (path) appendFileSync(path, line);
  else process.stdout.write(line);
}

const current = readCurrentVersion();
const previous = readPreviousVersion();

setOutput('version', current);
if (previous && previous !== current) {
  console.log(`Rust crate version: ${previous} -> ${current}; publishing.`);
  setOutput('should_publish', 'true');
} else if (!previous) {
  console.log(`Rust crate version: ${current} (no previous Cargo.toml); skipping publish.`);
  setOutput('should_publish', 'false');
} else {
  console.log(`Rust crate version unchanged at ${current}; skipping publish.`);
  setOutput('should_publish', 'false');
}
