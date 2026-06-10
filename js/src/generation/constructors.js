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
 * Grammatical-gender agreement for the Romance indefinite article — the
 * second grammatical feature of the renderer. Spanish and French inflect the
 * indefinite article for the *object* noun's gender (es *un/una*, fr
 * *un/une*), so "Berlín es un ciudad" is ungrammatical: *ciudad* is feminine
 * and requires *una*.
 *
 * The gender of a Wikidata noun ultimately comes from its Lexeme's
 * grammatical-gender statement (Wikidata P5185), the same source Abstract
 * Wikipedia uses; until that integration lands (tracked in `research/`), the
 * caller supplies it via the constructor's `gender` modifier. When no gender
 * is given we fall back to masculine — the unmarked default in both languages
 * — and document that as a known approximation rather than emit nothing.
 *
 * @param {string} lang - 'es' or 'fr'
 * @param {string} [gender] - 'feminine' | 'f' | 'masculine' | 'm' (default masculine)
 * @returns {string} - The indefinite article, or '' for an unsupported language
 */
export function romanceIndefiniteArticle(lang, gender) {
  const feminine = gender === 'feminine' || gender === 'f';
  if (lang === 'es') return feminine ? 'una' : 'un';
  if (lang === 'fr') return feminine ? 'une' : 'un';
  return '';
}

/**
 * Constructor catalogue. Each constructor is a typed container with named
 * argument roles and one templatic renderer per supported language.
 *
 * Template placeholders:
 *   {subject} {predicate} {object} - replaced by the role's resolved label
 *   {article}                      - replaced by the language's indefinite
 *                                    article (English a/an phonotactics; the
 *                                    gender-agreeing Romance un/una, un/une
 *                                    keyed off the constructor's `gender`)
 *
 * A template provides a `positive` pattern and, where the language differs,
 * a `negative` pattern used when the constructor carries `negated: true`.
 *
 * Tense (`past` / `future`) is optional and inflects the verb only. We add
 * a tense variant *only* where it is grammatically correct without the noun
 * morphology this renderer does not yet have (that awaits the Wikidata
 * Lexeme integration tracked in `research/`). Concretely:
 *   - copula tense (en/es/fr "is→was→will be") leaves the predicate noun
 *     unchanged, so it is safe;
 *   - Russian/Arabic *instance_of* past needs case changes on the noun
 *     (instrumental / accusative), so those fall back to the present copula;
 *   - Chinese copulas (是 / 在) do not inflect for tense, so the present form
 *     is already correct for every tense and needs no variant.
 * When a language has no variant for the requested tense, `fillTemplate`
 * falls back to the (always-present) `positive`/`negative` patterns.
 */
export const CONSTRUCTORS = {
  // X is an instance of Y — Wikidata P31. Mirrors Abstract Wikipedia's
  // Z26039 "Berlin is a city" semantic fragment.
  instance_of: {
    roles: ['subject', 'object'],
    description: 'X is an instance of Y (Wikidata P31)',
    templates: {
      en: {
        positive: '{subject} is {article} {object}', negative: '{subject} is not {article} {object}', article: 'en-indefinite',
        past: { positive: '{subject} was {article} {object}', negative: '{subject} was not {article} {object}' },
        future: { positive: '{subject} will be {article} {object}', negative: '{subject} will not be {article} {object}' },
      },
      es: {
        positive: '{subject} es {article} {object}', negative: '{subject} no es {article} {object}', article: 'es-indefinite',
        past: { positive: '{subject} era {article} {object}', negative: '{subject} no era {article} {object}' },
        future: { positive: '{subject} será {article} {object}', negative: '{subject} no será {article} {object}' },
      },
      fr: {
        positive: '{subject} est {article} {object}', negative: "{subject} n'est pas {article} {object}", article: 'fr-indefinite',
        past: { positive: '{subject} était {article} {object}', negative: "{subject} n'était pas {article} {object}" },
        future: { positive: '{subject} sera {article} {object}', negative: '{subject} ne sera pas {article} {object}' },
      },
      // ru/ar instance_of past needs noun case morphology we lack — fall back
      // to the present copula rather than emit ungrammatical case.
      ru: { positive: '{subject} — {object}', negative: '{subject} — не {object}' },
      zh: { positive: '{subject}是{object}', negative: '{subject}不是{object}' },
      ar: { positive: '{subject} {object}', negative: '{subject} ليس {object}' },
    },
  },

  // X is located in Y — Wikidata P131 / P276. Here the object stays in the
  // same case across tenses in every language below, so tense is safe to
  // inflect on the verb everywhere it inflects.
  located_in: {
    roles: ['subject', 'object'],
    description: 'X is located in Y (Wikidata P131/P276)',
    templates: {
      en: {
        positive: '{subject} is in {object}', negative: '{subject} is not in {object}',
        past: { positive: '{subject} was in {object}', negative: '{subject} was not in {object}' },
        future: { positive: '{subject} will be in {object}', negative: '{subject} will not be in {object}' },
      },
      es: {
        positive: '{subject} está en {object}', negative: '{subject} no está en {object}',
        past: { positive: '{subject} estaba en {object}', negative: '{subject} no estaba en {object}' },
        future: { positive: '{subject} estará en {object}', negative: '{subject} no estará en {object}' },
      },
      fr: {
        positive: '{subject} est en {object}', negative: "{subject} n'est pas en {object}",
        past: { positive: '{subject} était en {object}', negative: "{subject} n'était pas en {object}" },
        future: { positive: '{subject} sera en {object}', negative: '{subject} ne sera pas en {object}' },
      },
      ru: {
        positive: '{subject} находится в {object}', negative: '{subject} не находится в {object}',
        past: { positive: '{subject} находился в {object}', negative: '{subject} не находился в {object}' },
        future: { positive: '{subject} будет в {object}', negative: '{subject} не будет в {object}' },
      },
      zh: { positive: '{subject}在{object}', negative: '{subject}不在{object}' },
      ar: {
        positive: '{subject} في {object}', negative: '{subject} ليس في {object}',
        past: { positive: '{subject} كان في {object}', negative: '{subject} لم يكن في {object}' },
        future: { positive: '{subject} سيكون في {object}', negative: '{subject} لن يكون في {object}' },
      },
    },
  },

  // X measures VALUE UNIT — a quantity/measurement statement. Mirrors a
  // Wikidata quantity claim (e.g. P2048 height, P2052 speed) carrying a
  // numeric value and a unit. This closes the "numerical values lost in
  // transformation" limitation: the transformer's extractQuantities() feeds
  // { value, unit } straight into this constructor. The verb is the canonical
  // measurement verb per language (en copula "is", es "mide", fr "mesure"),
  // documented as a generic seed the way the other templates are.
  quantity: {
    roles: ['subject', 'value', 'unit'],
    description: 'X measures VALUE UNIT (Wikidata quantity claim)',
    templates: {
      en: { positive: '{subject} is {value} {unit}', negative: '{subject} is not {value} {unit}' },
      es: { positive: '{subject} mide {value} {unit}', negative: '{subject} no mide {value} {unit}' },
      fr: { positive: '{subject} mesure {value} {unit}', negative: '{subject} ne mesure pas {value} {unit}' },
      ru: { positive: '{subject} — {value} {unit}', negative: '{subject} — не {value} {unit}' },
      zh: { positive: '{subject}是{value}{unit}', negative: '{subject}不是{value}{unit}' },
      ar: { positive: '{subject} يساوي {value} {unit}', negative: '{subject} لا يساوي {value} {unit}' },
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
  // Select the verb forms for the requested tense, falling back to the
  // always-present (present-tense) patterns when a language has no variant.
  const tense = constructor.tense;
  const forms = (tense && tense !== 'present' && template[tense]) || template;
  const pattern = constructor.negated
    ? (forms.negative || forms.positive)
    : forms.positive;

  let out = pattern;
  for (const role of spec.roles) {
    const value = constructor[role];
    const label = (labels && labels[value]) || value || '';
    out = out.split(`{${role}}`).join(label);
  }

  if (out.includes('{article}')) {
    const objectLabel = (labels && labels[constructor.object]) || constructor.object || '';
    let article = '';
    switch (template.article) {
      case 'en-indefinite':
        article = englishIndefiniteArticle(objectLabel);
        break;
      case 'es-indefinite':
        article = romanceIndefiniteArticle('es', constructor.gender);
        break;
      case 'fr-indefinite':
        article = romanceIndefiniteArticle('fr', constructor.gender);
        break;
    }
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
  romanceIndefiniteArticle,
  buildConstructor,
  validateConstructor,
  fillTemplate,
};
