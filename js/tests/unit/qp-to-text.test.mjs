import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  englishIndefiniteArticle,
  romanceIndefiniteArticle,
  fillTemplate,
  validateConstructor,
  buildConstructor,
  CONSTRUCTORS,
  UN6_LANGUAGES,
} from '../../src/generation/constructors.js';
import { QPRenderer } from '../../src/generation/qp-to-text.js';
import { TextToQPTransformer } from '../../src/transformation/text-to-qp-transformer.js';

// A small offline label dictionary so the renderer never touches the network.
const LABELS = {
  en: { Q64: 'Berlin', Q515: 'city', Q183: 'Germany', Q1: 'island', P50: 'author', Q571: 'book' },
  es: { Q64: 'Berlín', Q515: 'ciudad', Q183: 'Alemania', Q571: 'libro' },
  fr: { Q64: 'Berlin', Q515: 'ville', Q183: 'Allemagne', Q571: 'livre' },
  ru: { Q64: 'Берлин', Q515: 'город', Q183: 'Германия' },
  zh: { Q64: '柏林', Q515: '城市', Q183: '德国' },
  ar: { Q64: 'برلين', Q515: 'مدينة', Q183: 'ألمانيا' },
};

const labelProvider = async (_ids, lang) => LABELS[lang] || {};

// ---------------------------------------------------------------------------
// Phonotactics
// ---------------------------------------------------------------------------

test('englishIndefiniteArticle picks "an" before a vowel and "a" otherwise', () => {
  assert.equal(englishIndefiniteArticle('island'), 'an');
  assert.equal(englishIndefiniteArticle('apple'), 'an');
  assert.equal(englishIndefiniteArticle('city'), 'a');
  assert.equal(englishIndefiniteArticle(''), 'a');
  assert.equal(englishIndefiniteArticle(undefined), 'a');
});

test('romanceIndefiniteArticle agrees with gender and falls back to masculine', () => {
  assert.equal(romanceIndefiniteArticle('es', 'feminine'), 'una');
  assert.equal(romanceIndefiniteArticle('es', 'f'), 'una');
  assert.equal(romanceIndefiniteArticle('es', 'masculine'), 'un');
  assert.equal(romanceIndefiniteArticle('es', undefined), 'un'); // documented fallback
  assert.equal(romanceIndefiniteArticle('fr', 'feminine'), 'une');
  assert.equal(romanceIndefiniteArticle('fr', undefined), 'un');
  assert.equal(romanceIndefiniteArticle('de', 'feminine'), ''); // unsupported language
});

// ---------------------------------------------------------------------------
// Constructor validation
// ---------------------------------------------------------------------------

test('validateConstructor accepts a well-formed constructor', () => {
  assert.equal(validateConstructor({ type: 'instance_of', subject: 'Q64', object: 'Q515' }), true);
});

test('validateConstructor rejects unknown types and missing roles', () => {
  assert.throws(() => validateConstructor({ type: 'nope', subject: 'Q1' }), /Unknown constructor/);
  assert.throws(() => validateConstructor({ type: 'instance_of', subject: 'Q64' }), /missing role "object"/);
  assert.throws(() => validateConstructor(null), /must be an object/);
});

test('buildConstructor merges roles and modifiers', () => {
  const c = buildConstructor('instance_of', { subject: 'Q64', object: 'Q515' }, { negated: true });
  assert.deepEqual(c, { type: 'instance_of', subject: 'Q64', object: 'Q515', negated: true });
});

// ---------------------------------------------------------------------------
// fillTemplate (pure)
// ---------------------------------------------------------------------------

test('fillTemplate applies English a/an phonotactics', () => {
  const spec = CONSTRUCTORS.instance_of;
  const tpl = spec.templates.en;
  assert.equal(
    fillTemplate(spec, tpl, { type: 'instance_of', subject: 'Q64', object: 'Q515' }, LABELS.en),
    'Berlin is a city',
  );
  assert.equal(
    fillTemplate(spec, tpl, { type: 'instance_of', subject: 'Q64', object: 'Q1' }, LABELS.en),
    'Berlin is an island',
  );
});

// ---------------------------------------------------------------------------
// QPRenderer.renderWithLabels — multi-language + negation
// ---------------------------------------------------------------------------

test('renderWithLabels renders instance_of across the UN 6 languages', () => {
  const r = new QPRenderer();
  // ciudad/ville are feminine, so the Romance article agrees: una/une.
  const c = { type: 'instance_of', subject: 'Q64', object: 'Q515', gender: 'feminine' };
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin is a city');
  assert.equal(r.renderWithLabels(c, LABELS.es, 'es'), 'Berlín es una ciudad');
  assert.equal(r.renderWithLabels(c, LABELS.fr, 'fr'), 'Berlin est une ville');
  assert.equal(r.renderWithLabels(c, LABELS.ru, 'ru'), 'Берлин — город');
  assert.equal(r.renderWithLabels(c, LABELS.zh, 'zh'), '柏林是城市');
  assert.equal(r.renderWithLabels(c, LABELS.ar, 'ar'), 'برلين مدينة');
});

test('renderWithLabels agrees the Romance indefinite article with grammatical gender', () => {
  const r = new QPRenderer();
  // Feminine object -> una / une.
  const fem = { type: 'instance_of', subject: 'Q64', object: 'Q515', gender: 'feminine' };
  assert.equal(r.renderWithLabels(fem, LABELS.es, 'es'), 'Berlín es una ciudad');
  assert.equal(r.renderWithLabels(fem, LABELS.fr, 'fr'), 'Berlin est une ville');
  // Masculine object (libro/livre) -> un / un.
  const masc = { type: 'instance_of', subject: 'Q64', object: 'Q571', gender: 'masculine' };
  assert.equal(r.renderWithLabels(masc, LABELS.es, 'es'), 'Berlín es un libro');
  assert.equal(r.renderWithLabels(masc, LABELS.fr, 'fr'), 'Berlin est un livre');
  // No gender supplied -> documented masculine fallback (un), not a crash.
  const dflt = { type: 'instance_of', subject: 'Q64', object: 'Q571' };
  assert.equal(r.renderWithLabels(dflt, LABELS.es, 'es'), 'Berlín es un libro');
  assert.equal(r.renderWithLabels(dflt, LABELS.fr, 'fr'), 'Berlin est un livre');
});

test('renderWithLabels honours the negated flag', () => {
  const r = new QPRenderer();
  const c = { type: 'instance_of', subject: 'Q64', object: 'Q515', negated: true };
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin is not a city');
  assert.equal(r.renderWithLabels(c, LABELS.zh, 'zh'), '柏林不是城市');
  assert.equal(r.renderWithLabels(c, LABELS.ru, 'ru'), 'Берлин — не город');
});

test('renderWithLabels inflects tense on the copula where it is grammatical', () => {
  const r = new QPRenderer();
  // instance_of: en/es/fr inflect; ru/zh/ar keep the present copula form.
  const past = { type: 'instance_of', subject: 'Q64', object: 'Q515', tense: 'past', gender: 'feminine' };
  assert.equal(r.renderWithLabels(past, LABELS.en, 'en'), 'Berlin was a city');
  assert.equal(r.renderWithLabels(past, LABELS.es, 'es'), 'Berlín era una ciudad');
  assert.equal(r.renderWithLabels(past, LABELS.fr, 'fr'), 'Berlin était une ville');
  assert.equal(r.renderWithLabels(past, LABELS.ru, 'ru'), 'Берлин — город'); // graceful fallback
  const future = { type: 'instance_of', subject: 'Q64', object: 'Q1', tense: 'future' };
  assert.equal(r.renderWithLabels(future, LABELS.en, 'en'), 'Berlin will be an island');
});

test('renderWithLabels combines tense and negation', () => {
  const r = new QPRenderer();
  const c = { type: 'instance_of', subject: 'Q64', object: 'Q515', tense: 'past', negated: true, gender: 'feminine' };
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin was not a city');
  assert.equal(r.renderWithLabels(c, LABELS.fr, 'fr'), "Berlin n'était pas une ville");
});

test('renderWithLabels inflects located_in tense across en/es/fr/ru/ar', () => {
  const r = new QPRenderer();
  const past = { type: 'located_in', subject: 'Q64', object: 'Q183', tense: 'past' };
  assert.equal(r.renderWithLabels(past, LABELS.en, 'en'), 'Berlin was in Germany');
  assert.equal(r.renderWithLabels(past, LABELS.es, 'es'), 'Berlín estaba en Alemania');
  assert.equal(r.renderWithLabels(past, LABELS.fr, 'fr'), 'Berlin était en Allemagne');
  assert.equal(r.renderWithLabels(past, LABELS.ru, 'ru'), 'Берлин находился в Германия');
  const future = { type: 'located_in', subject: 'Q64', object: 'Q183', tense: 'future' };
  assert.equal(r.renderWithLabels(future, LABELS.en, 'en'), 'Berlin will be in Germany');
});

test('renderWithLabels treats an explicit present tense like the default', () => {
  const r = new QPRenderer();
  const c = { type: 'instance_of', subject: 'Q64', object: 'Q515', tense: 'present' };
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin is a city');
});

test('renderWithLabels supports the located_in constructor', () => {
  const r = new QPRenderer();
  const c = { type: 'located_in', subject: 'Q64', object: 'Q183' };
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin is in Germany');
  assert.equal(r.renderWithLabels(c, LABELS.fr, 'fr'), 'Berlin est en Allemagne');
});

test('renderWithLabels supports the generic relation constructor with a predicate label', () => {
  const r = new QPRenderer();
  const c = { type: 'relation', subject: 'Q64', predicate: 'P50', object: 'Q571' };
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin author book');
});

test('renderWithLabels throws for an unsupported language', () => {
  const r = new QPRenderer();
  assert.throws(
    () => r.renderWithLabels({ type: 'instance_of', subject: 'Q64', object: 'Q515' }, LABELS.en, 'de'),
    /No "de" renderer/,
  );
});

// ---------------------------------------------------------------------------
// QPRenderer.render / renderAll — async, label-provider injected (offline)
// ---------------------------------------------------------------------------

test('render resolves labels via the injected provider', async () => {
  const r = new QPRenderer({ labelProvider });
  const sentence = await r.render({ type: 'instance_of', subject: 'Q64', object: 'Q515', gender: 'feminine' }, 'es');
  assert.equal(sentence, 'Berlín es una ciudad');
});

test('renderAll renders every UN 6 language', async () => {
  const r = new QPRenderer({ labelProvider });
  const all = await r.renderAll({ type: 'instance_of', subject: 'Q64', object: 'Q515' });
  assert.deepEqual(Object.keys(all).sort(), [...UN6_LANGUAGES].sort());
  assert.equal(all.en, 'Berlin is a city');
  assert.equal(all.ru, 'Берлин — город');
});

test('render resolves id-shaped roles through an injected apiClient.getLabels', async () => {
  const calls = [];
  const apiClient = {
    async getLabels(ids, lang) {
      calls.push({ ids: [...ids], lang });
      return LABELS[lang] || {};
    },
  };
  const r = new QPRenderer({ apiClient });
  const sentence = await r.render({ type: 'instance_of', subject: 'Q64', object: 'Q515' }, 'en');
  assert.equal(sentence, 'Berlin is a city');
  // Only id-shaped roles (Q64, Q515) are looked up — not plain text.
  assert.deepEqual(calls, [{ ids: ['Q64', 'Q515'], lang: 'en' }]);
});

test('render skips label lookup entirely for plain-text roles', async () => {
  let called = false;
  const apiClient = { async getLabels() { called = true; return {}; } };
  const r = new QPRenderer({ apiClient });
  const sentence = await r.render({ type: 'instance_of', subject: 'Berlin', object: 'city' }, 'en');
  assert.equal(sentence, 'Berlin is a city');
  assert.equal(called, false);
});

test('QPRenderer exposes its languages and constructor types', () => {
  const r = new QPRenderer();
  assert.deepEqual(r.languages, UN6_LANGUAGES);
  assert.ok(r.constructorTypes.includes('instance_of'));
  assert.ok(r.constructorTypes.includes('relation'));
});

// ---------------------------------------------------------------------------
// Transformer: modifier extraction + typed constructor (offline, pure logic)
// ---------------------------------------------------------------------------

test('extractModifiers detects negation', () => {
  const t = new TextToQPTransformer();
  assert.equal(t.extractModifiers('Einstein did not discover gravity').negated, true);
  assert.equal(t.extractModifiers("Berlin isn't a village").negated, true);
  assert.equal(t.extractModifiers('Einstein never slept').negated, true);
  assert.equal(t.extractModifiers('Berlin is a city').negated, false);
});

test('extractModifiers detects tense', () => {
  const t = new TextToQPTransformer();
  assert.equal(t.extractModifiers('Berlin is a city').tense, 'present');
  assert.equal(t.extractModifiers('Einstein discovered radium').tense, 'past');
  assert.equal(t.extractModifiers('Caesar was a general').tense, 'past');
  assert.equal(t.extractModifiers('She will travel').tense, 'future');
});

test('toConstructor builds an instance_of constructor preserving negation', () => {
  const t = new TextToQPTransformer();
  const result = {
    original: 'Berlin is not a village',
    sequence: [{ id: 'Q64' }, { id: 'P31' }, { id: 'Q532' }],
  };
  const c = t.toConstructor(result);
  assert.equal(c.type, 'instance_of');
  assert.equal(c.subject, 'Q64');
  assert.equal(c.object, 'Q532');
  assert.equal(c.negated, true);
});

test('toConstructor falls back to a generic relation', () => {
  const t = new TextToQPTransformer();
  const result = {
    original: 'Einstein wrote books',
    sequence: [{ id: 'Q937' }, { id: 'P50' }, { id: 'Q571' }],
  };
  const c = t.toConstructor(result);
  assert.equal(c.type, 'relation');
  assert.equal(c.predicate, 'P50');
  assert.equal(c.tense, 'past');
});

test('toConstructor resolves ambiguous matches to their first candidate', () => {
  const t = new TextToQPTransformer();
  const result = {
    original: 'Berlin is a city',
    sequence: [
      { type: 'ambiguous', alternatives: [{ id: 'Q64' }, { id: 'Q4115712' }] },
      { id: 'P31' },
      { id: 'Q515' },
    ],
  };
  const c = t.toConstructor(result);
  assert.equal(c.subject, 'Q64');
  assert.equal(c.type, 'instance_of');
});

test('round-trip: a transformer constructor renders back to text', () => {
  const t = new TextToQPTransformer();
  const r = new QPRenderer();
  const result = {
    original: 'Berlin is a city',
    sequence: [{ id: 'Q64' }, { id: 'P31' }, { id: 'Q515' }],
  };
  const c = t.toConstructor(result);
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin is a city');
  assert.equal(r.renderWithLabels(c, LABELS.ru, 'ru'), 'Берлин — город');
});

test('round-trip: past tense survives text → Q/P → text', () => {
  const t = new TextToQPTransformer();
  const r = new QPRenderer();
  const result = {
    original: 'Berlin was a city',
    sequence: [{ id: 'Q64' }, { id: 'P31' }, { id: 'Q515' }],
  };
  const c = t.toConstructor(result);
  assert.equal(c.type, 'instance_of');
  assert.equal(c.tense, 'past');
  assert.equal(r.renderWithLabels(c, LABELS.en, 'en'), 'Berlin was a city');
});
