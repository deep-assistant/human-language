// Reads the package name and version from package.json at runtime so the
// library, the CLI and the HTTP server always agree on what they report.
//
// `readFileSync` is used (instead of an `import … assert { type: 'json' }`)
// because the latter is still gated behind an experimental flag in some
// Node 20 minor releases and Bun versions we want to support.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

function loadPackageJson() {
  // js/src/version.js → ../../package.json
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgPath = resolve(here, '..', '..', 'package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf8'));
}

let cached;
function pkg() {
  if (!cached) cached = loadPackageJson();
  return cached;
}

export const name = pkg().name;
export const version = pkg().version;
