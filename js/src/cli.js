#!/usr/bin/env node
// `human-language` command-line entry point.
//
// Usage:
//   human-language transform "Albert Einstein was born in Ulm"
//   human-language transform --format lino "Cats love fish"
//   human-language entity Q42
//   human-language property P31
//   human-language search "Einstein"
//   human-language serve --port 8080
//   human-language version
//
// Arguments / env precedence follows `lino-arguments` (see ./config.js).

import { resolveConfig } from './config.js';
import { name, version } from './version.js';

const USAGE = `\
Usage: human-language <command> [options] [args]

Commands:
  transform <text>     Convert English text into a Q/P sequence
  entity <id>          Fetch a Wikidata entity (e.g. Q42)
  property <id>        Fetch a Wikidata property (e.g. P31)
  search <query>       Search Wikidata for entities / properties
  serve                Start the HTTP microservice
  version              Print the version
  help                 Print this message

Options (apply where relevant):
  --format json|lino   Output format (default: json)
  --port <n>           Server port (default: 8080)
  --host <h>           Server host (default: 0.0.0.0)
  --cache-dir <p>      Directory for the file cache
  --cache-type <t>     'auto' | 'file' | 'indexeddb' | 'none'

All options can also be set via HUMAN_LANGUAGE_* environment variables.`;

function printJson(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

function parseFormatFlag(argv) {
  let format = 'json';
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--format') { format = argv[++i] || 'json'; continue; }
    if (argv[i].startsWith('--format=')) { format = argv[i].slice('--format='.length); continue; }
    rest.push(argv[i]);
  }
  return { format, rest };
}

async function commandTransform(argv) {
  const { format, rest } = parseFormatFlag(argv);
  const text = rest.join(' ');
  if (!text) {
    process.stderr.write('error: `transform` requires a text argument\n');
    process.exit(2);
  }
  const { TextToQPTransformer } = await import('./transformation/text-to-qp-transformer.js');
  const transformer = new TextToQPTransformer();
  const result = await transformer.transform(text);
  if (format === 'lino') {
    const { formatTransformResultAsLino } = await import('./transformation/lino-format.js');
    process.stdout.write(formatTransformResultAsLino(result));
  } else {
    printJson(result);
  }
}

async function commandEntity(argv, config) {
  const id = argv[0];
  if (!id) {
    process.stderr.write('error: `entity` requires an id (e.g. Q42)\n');
    process.exit(2);
  }
  const { WikidataAPIClient } = await import('./wikidata-api.js');
  const client = new WikidataAPIClient(config.cacheType, { cacheDir: config.cacheDir });
  const data = await client.fetchEntity(id);
  printJson(data);
}

async function commandProperty(argv, config) {
  const id = argv[0];
  if (!id) {
    process.stderr.write('error: `property` requires an id (e.g. P31)\n');
    process.exit(2);
  }
  const { WikidataAPIClient } = await import('./wikidata-api.js');
  const client = new WikidataAPIClient(config.cacheType, { cacheDir: config.cacheDir });
  const data = await client.fetchProperty(id);
  printJson(data);
}

async function commandSearch(argv, config) {
  const query = argv.join(' ');
  if (!query) {
    process.stderr.write('error: `search` requires a query\n');
    process.exit(2);
  }
  const { WikidataAPIClient, WikidataSearchUtility } = await import('./wikidata-api.js');
  const client = new WikidataAPIClient(config.cacheType, { cacheDir: config.cacheDir });
  const util = new WikidataSearchUtility(client, null, null);
  const data = await util.disambiguateSearch(query);
  printJson(data);
}

async function commandServe(config) {
  // Lazy-load so `human-language transform …` doesn't pay the server cost.
  const { createServer } = await import('./server.js');
  const srv = createServer({ config });
  await new Promise((resolve) => srv.listen(config.port, config.host, resolve));
  const addr = srv.address();
  const host = addr && typeof addr === 'object' ? addr.address : config.host;
  const port = addr && typeof addr === 'object' ? addr.port : config.port;
  process.stdout.write(`human-language listening on http://${host}:${port}\n`);
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help' || argv[0] === '-h') {
    process.stdout.write(USAGE + '\n');
    return;
  }
  if (argv[0] === 'version' || argv[0] === '--version' || argv[0] === '-V') {
    process.stdout.write(`${name} ${version}\n`);
    return;
  }

  const command = argv[0];
  const tail = argv.slice(1);

  // Resolve config from env + the post-command argv. This means `--port`
  // and friends can appear after the command.
  const config = resolveConfig({ argv: tail, env });
  const positional = config._;

  switch (command) {
    case 'transform':  return commandTransform(positional);
    case 'entity':     return commandEntity(positional, config);
    case 'property':   return commandProperty(positional, config);
    case 'search':     return commandSearch(positional, config);
    case 'serve':      return commandServe(config);
    default:
      process.stderr.write(`error: unknown command '${command}'\n\n${USAGE}\n`);
      process.exit(2);
  }
}

// When invoked as a script, run main().
const isMain = (() => {
  if (typeof process === 'undefined' || !process.argv?.[1]) return false;
  try {
    const url = new URL(import.meta.url);
    return url.pathname === process.argv[1] || url.pathname.endsWith(process.argv[1]);
  } catch { return false; }
})();

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`error: ${err?.message || err}\n`);
    process.exit(1);
  });
}
