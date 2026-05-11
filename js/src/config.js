// In-tree shim that reproduces the precedence rules of
// `link-foundation/lino-arguments`:
//
//   1. Explicit `argv` (CLI flags, including short aliases).
//   2. Environment variables, prefixed `HUMAN_LANGUAGE_…`.
//   3. Built-in defaults (`CONFIG_DEFAULTS`).
//
// The shim is intentionally tiny: < 100 LOC, no external dependency. The
// real `lino-arguments` npm package will replace it once its published
// tarball stops doing eager `node:fs` imports — tracked in
// docs/case-studies/issue-37/external-research.md.

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
  const config = { ...CONFIG_DEFAULTS, ...defaults };

  // Read env vars (precedence: env over defaults).
  for (const item of SPEC) {
    const raw = env[item.env];
    if (raw !== undefined && raw !== '') {
      config[item.key] = item.parse(raw);
    }
  }

  // Walk argv (precedence: CLI flags over env).
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--' ) {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const name = eq === -1 ? a.slice(2) : a.slice(2, eq);
      const item = SPEC.find((s) => s.long === name);
      if (!item) {
        throw new Error(`unknown flag --${name}`);
      }
      let raw;
      if (eq !== -1) raw = a.slice(eq + 1);
      else {
        raw = argv[++i];
        if (raw === undefined) throw new Error(`flag --${name} expects a value`);
      }
      config[item.key] = item.parse(raw);
    } else if (a.startsWith('-') && a.length > 1) {
      const name = a.slice(1);
      const item = SPEC.find((s) => s.short === name);
      if (!item) {
        throw new Error(`unknown flag -${name}`);
      }
      const raw = argv[++i];
      if (raw === undefined) throw new Error(`flag -${name} expects a value`);
      config[item.key] = item.parse(raw);
    } else {
      positional.push(a);
    }
  }

  config._ = positional;
  return config;
}
