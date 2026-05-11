#!/usr/bin/env node
// Walks every `.mjs` and plain `.js` module (excluding `node_modules`,
// `.jsx`, and the babel-standalone-rendered files) and runs
// `node --check` on it. Catches syntax errors before they hit the
// browser. Adopted from the JS pipeline template's `check-mjs-syntax.sh`,
// rewritten in Node so we don't need Bash on every runner.

import { readdir, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.github', 'data', 'playwright-report',
  'test-results', '_site', '.playwright-mcp',
]);

const SKIP_FILES = new Set([
  // Babel-standalone-compiled in the browser, not Node-parseable.
  // (Listed by basename — these live in js/src/ but we match on basename.)
  'loading.jsx', 'statements.jsx',
]);

async function walk(dir, out = []) {
  for (const name of await readdir(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) await walk(full, out);
    else if (['.js', '.mjs'].includes(extname(name))) out.push(full);
  }
  return out;
}

const files = (await walk(ROOT)).filter((f) => !SKIP_FILES.has(f.split('/').pop()));
let failed = 0;
for (const f of files) {
  const rel = relative(ROOT, f);
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`✗ ${rel}`);
    if (r.stderr) console.error(r.stderr.trim());
    failed++;
  } else {
    console.log(`✓ ${rel}`);
  }
}
if (failed) {
  console.error(`\n${failed} file(s) failed syntax check.`);
  process.exit(1);
}
console.log(`\nAll ${files.length} files passed syntax check.`);
