// Typed constructors and multi-language templates for the reverse
// generation service (Q/P → text).
//
// This is the data layer that mirrors Abstract Wikipedia's "constructors"
// (typed containers with named argument roles) and the per-constructor,
// per-language "templatic renderers" that turn one constructor into a
// sentence. We deliberately start small — a handful of high-value
// constructors across the six official UN languages — following Abstract
// Wikipedia's own lesson: start with simple, high-value fragments and grow
// the grammar incrementally.
//
// Everything here is pure and dependency-free so it can be unit-tested
// offline (no Wikidata round-trip) and reused in both Node and the browser.

/**
 * The six official languages of the United Nations — the same demonstration
 * set Abstract Wikipedia uses for its first natural-language-generation
 * "semantic fragments".
 */
export const UN6_LANGUAGES = ['en', 'ar', 'es', 'fr', 'ru', 'zh'];

/** Human-readable names for the supported languages. */
export const LANGUAGE_NAMES = {
  en: 'English',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  ru: 'Russian',
  zh: 'Chinese',
};

/**
 * English indefinite-article phonotactics (a / an). This is the first
 * grammatical feature of the renderer. It is a documented heuristic — it
 * keys off the first letter and so does not yet handle silent-h ("an hour")
 * or vowel-letter/consonant-sound words ("a university"). Abstract
 * Wikipedia models the full phonological rule set; this is the seed.
 *
 * @param {string} word - The word the article precedes
 * @returns {string} - 'a' or 'an'
 */
export function englishIndefiniteArticle(word) {
  if (!word) return 'a';
  const first = word.trim().charAt(0).toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}

/**
 * Constructor catalogue. Each constructor is a typed container with named
 * argument roles and one templatic renderer per supported language.
 *
 * Template placeholders:
 *   {subject} {predicate} {object} - replaced by the role's resolved label
 *   {article}                      - replaced by the language's indefinite
 *                                    article (English a/an phonotactics)
 *
 * A template provides a `positive` pattern and, where the language differs,
 * a `negative` pattern used when the constructor carries `negated: true`.
 */
export const CONSTRUCTORS = {
  // X is an instance of Y — Wikidata P31. Mirrors Abstract Wikipedia's
  // Z26039 "Berlin is a city" semantic fragment.
  instance_of: {
    roles: ['subject', 'object'],
    description: 'X is an instance of Y (Wikidata P31)',
    templates: {
      en: { positive: '{subject} is {article} {object}', negative: '{subject} is not {article} {object}', article: 'en-indefinite' },
      es: { positive: '{subject} es un {object}', negative: '{subject} no es un {object}' },
      fr: { positive: '{subject} est un {object}', negative: "{subject} n'est pas un {object}" },
      ru: { positive: '{subject} — {object}', negative: '{subject} — не {object}' },
      zh: { positive: '{subject}是{object}', negative: '{subject}不是{object}' },
      ar: { positive: '{subject} {object}', negative: '{subject} ليس {object}' },
    },
  },

  // X is located in Y — Wikidata P131 / P276.
  located_in: {
    roles: ['subject', 'object'],
    description: 'X is located in Y (Wikidata P131/P276)',
    templates: {
      en: { positive: '{subject} is in {object}', negative: '{subject} is not in {object}' },
      es: { positive: '{subject} está en {object}', negative: '{subject} no está en {object}' },
      fr: { positive: '{subject} est en {object}', negative: "{subject} n'est pas en {object}" },
      ru: { positive: '{subject} находится в {object}', negative: '{subject} не находится в {object}' },
      zh: { positive: '{subject}在{object}', negative: '{subject}不在{object}' },
      ar: { positive: '{subject} في {object}', negative: '{subject} ليس في {object}' },
    },
  },

  // Generic fallback: subject — predicate — object, where the predicate is
  // itself a (property) label. This lets the round-trip render *any*
  // text → Q/P result, not only the two specialised constructors above.
  relation: {
    roles: ['subject', 'predicate', 'object'],
    description: 'Generic subject–predicate–object relation',
    templates: {
      en: { positive: '{subject} {predicate} {object}', negative: '{subject} does not {predicate} {object}' },
      es: { positive: '{subject} {predicate} {object}', negative: '{subject} no {predicate} {object}' },
      fr: { positive: '{subject} {predicate} {object}', negative: '{subject} ne {predicate} pas {object}' },
      ru: { positive: '{subject} {predicate} {object}', negative: '{subject} не {predicate} {object}' },
      zh: { positive: '{subject}{predicate}{object}', negative: '{subject}不{predicate}{object}' },
      ar: { positive: '{subject} {predicate} {object}', negative: '{subject} لا {predicate} {object}' },
    },
  },
};

/**
 * Build a typed constructor object.
 *
 * @param {string} type - A key of CONSTRUCTORS (e.g. 'instance_of')
 * @param {Object} roles - Role → value map, e.g. { subject: 'Q64', object: 'Q515' }
 * @param {Object} [modifiers] - Optional flags, e.g. { negated: true, tense: 'past' }
 * @returns {Object} - The constructor
 */
export function buildConstructor(type, roles = {}, modifiers = {}) {
  return { type, ...roles, ...modifiers };
}

/**
 * Validate a constructor against the catalogue.
 *
 * @param {Object} constructor
 * @throws {Error} if the type is unknown or a required role is missing
 */
export function validateConstructor(constructor) {
  if (!constructor || typeof constructor !== 'object') {
    throw new Error('Constructor must be an object');
  }
  const spec = CONSTRUCTORS[constructor.type];
  if (!spec) {
    const known = Object.keys(CONSTRUCTORS).join(', ');
    throw new Error(`Unknown constructor type "${constructor.type}" (known: ${known})`);
  }
  for (const role of spec.roles) {
    if (constructor[role] == null || constructor[role] === '') {
      throw new Error(`Constructor "${constructor.type}" is missing role "${role}"`);
    }
  }
  return true;
}

/**
 * Fill a single language template from a constructor and a `{ id: label }`
 * map. Pure and synchronous — the async `QPRenderer.render` is a thin
 * wrapper that resolves labels first, then calls this.
 *
 * @param {Object} spec - The constructor spec (with `roles`)
 * @param {Object} template - The per-language template (positive/negative/article)
 * @param {Object} constructor - The constructor instance
 * @param {Object} labels - Map of `{ id: label }`
 * @returns {string}
 */
export function fillTemplate(spec, template, constructor, labels) {
  const pattern = constructor.negated
    ? (template.negative || template.positive)
    : template.positive;

  let out = pattern;
  for (const role of spec.roles) {
    const value = constructor[role];
    const label = (labels && labels[value]) || value || '';
    out = out.split(`{${role}}`).join(label);
  }

  if (out.includes('{article}')) {
    const objectLabel = (labels && labels[constructor.object]) || constructor.object || '';
    const article = template.article === 'en-indefinite'
      ? englishIndefiniteArticle(objectLabel)
      : '';
    out = out.split('{article}').join(article);
  }

  // Collapse any double spaces an empty article may have left behind.
  return out.replace(/\s{2,}/g, ' ').trim();
}

export default {
  UN6_LANGUAGES,
  LANGUAGE_NAMES,
  CONSTRUCTORS,
  englishIndefiniteArticle,
  buildConstructor,
  validateConstructor,
  fillTemplate,
};
