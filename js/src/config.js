// Configuration backed by `link-foundation/lino-arguments`.
//
// Precedence:
//   1. Explicit `argv` (CLI flags, including short aliases).
//   2. Environment variables, prefixed `HUMAN_LANGUAGE_...`.
//   3. Built-in defaults (`CONFIG_DEFAULTS`).
//
// `resolveConfig` accepts an injected `env` object so unit tests and callers can
// resolve config without mutating the process environment permanently.

import { makeConfig } from 'lino-arguments';

export const CONFIG_DEFAULTS = Object.freeze({
  port: 8080,
  host: '0.0.0.0',
  cacheDir: './data/wikidata-cache',
  cacheType: 'auto',
  userAgent: 'human-language',
  // The default Wikidata API endpoint. Override for self-hosted Wikibase
  // instances.
  wikidataApiBase: 'https://www.wikidata.org/w/api.php',
});

// Spec: each key has a long flag (matches the camelCase config key in
// kebab-case), an optional short alias, an env var name and a parser.
const SPEC = [
  { key: 'port',           long: 'port',             short: 'p', env: 'HUMAN_LANGUAGE_PORT',             parse: parseInteger },
  { key: 'host',           long: 'host',             short: 'h', env: 'HUMAN_LANGUAGE_HOST',             parse: identity   },
  { key: 'cacheDir',       long: 'cache-dir',        short: null,env: 'HUMAN_LANGUAGE_CACHE_DIR',        parse: identity   },
  { key: 'cacheType',      long: 'cache-type',       short: null,env: 'HUMAN_LANGUAGE_CACHE_TYPE',       parse: identity   },
  { key: 'userAgent',      long: 'user-agent',       short: null,env: 'HUMAN_LANGUAGE_USER_AGENT',       parse: identity   },
  { key: 'wikidataApiBase',long: 'wikidata-api-base',short: null,env: 'HUMAN_LANGUAGE_WIKIDATA_API_BASE',parse: identity   },
];

function identity(v) {
  return v;
}

function parseInteger(v) {
  const n = Number(v);
  if (!Number.isInteger(n)) {
    throw new TypeError(`expected an integer, got ${JSON.stringify(v)}`);
  }
  return n;
}

function collectPositionals(argv) {
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith('--')) {
      if (!arg.includes('=')) i += 1;
      continue;
    }
    if (arg.startsWith('-') && arg.length > 1) {
      i += 1;
      continue;
    }
    positional.push(arg);
  }
  return positional;
}

function withInjectedEnv(env, fn) {
  if (env === process.env) return fn();
  const keys = new Set([...SPEC.map((item) => item.env), ...Object.keys(env)]);
  const previous = new Map();
  for (const key of keys) {
    previous.set(key, process.env[key]);
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

/**
 * Resolve configuration with `lino-arguments` precedence.
 *
 * @param {object} [opts]
 * @param {string[]} [opts.argv]     - CLI args (typically `process.argv.slice(2)`).
 * @param {Record<string,string|undefined>} [opts.env] - Environment object.
 * @param {Partial<typeof CONFIG_DEFAULTS>} [opts.defaults] - Override defaults.
 * @returns {typeof CONFIG_DEFAULTS & { _: string[] }}
 *   The resolved config plus `_`, the array of positional arguments.
 */
export function resolveConfig({ argv = [], env = {}, defaults = {} } = {}) {
  const mergedDefaults = { ...CONFIG_DEFAULTS, ...defaults };

  return withInjectedEnv(env, () => {
    const parsed = makeConfig({
      argv: ['node', 'human-language', ...argv],
      lenv: { enabled: false },
      env: { enabled: false },
      yargs: ({ yargs, getenv }) => {
        let builder = yargs
          .help(false)
          .version(false)
          .exitProcess(false)
          .showHelpOnFail(false)
          .fail((message, error) => {
            const text = error?.message || message || 'argument parsing failed';
            if (/Unknown argument/.test(text)) {
              throw new Error(`unknown flag: ${text}`);
            }
            throw error || new Error(text);
          })
          .strictOptions();

        for (const item of SPEC) {
          builder = builder.option(item.long, {
            alias: item.short || undefined,
            type: item.key === 'port' ? 'number' : 'string',
            default: getenv(item.env, mergedDefaults[item.key]),
          });
        }
        return builder;
      },
    });

    const config = { ...mergedDefaults };
    for (const item of SPEC) {
      if (parsed[item.key] !== undefined && parsed[item.key] !== '') {
        config[item.key] = item.parse(parsed[item.key]);
      }
    }
    config._ = collectPositionals(argv);
    return config;
  });
}
