// Generation mode (reverse: Q/P → text).
//
// The mirror image of the Transformer mode. Where the transformer does
// analysis (English text → a sequence of Wikidata Q/P), this mode does
// generation: a typed constructor (subject / predicate / object, plus
// negation and tense modifiers) is rendered into natural-language
// sentences across the six official UN languages — exactly the
// "templatic renderer" pattern Abstract Wikipedia uses.
//
// The underlying renderer (`generation/qp-to-text.js`) is reused verbatim.
// Role values may be either Wikidata ids (Q64, P31, …), which are resolved
// to labels in each language, or plain text, which passes through
// unchanged — so the mode demonstrates end-to-end without a network call.

(function attachGeneration() {
  // Read everything from `window.HumanLanguageApp` — Babel-standalone
  // rewrites dynamic `import()` to `require()`, which is undefined in the
  // browser (issue #35). app.html exposes the symbols we need.
  const {
    TestsPanel,
    QPRenderer,
    CONSTRUCTORS,
    UN6_LANGUAGES,
    LANGUAGE_NAMES,
    buildConstructor,
    validateConstructor,
    flagMap,
  } = window.HumanLanguageApp;

  // Example constructors. Values are plain labels so the demo renders with
  // no Wikidata round-trip; swap in Q/P ids to exercise label resolution.
  const EXAMPLES = [
    { title: 'Berlin is a city',        type: 'instance_of', subject: 'Berlin',   object: 'city' },
    { title: 'Einstein is a scientist', type: 'instance_of', subject: 'Einstein', object: 'scientist' },
    { title: 'Paris is in France',      type: 'located_in',  subject: 'Paris',    object: 'France' },
    { title: 'An apple is a fruit',     type: 'instance_of', subject: 'apple',    object: 'fruit' },
    { title: 'Whale is not a fish',     type: 'instance_of', subject: 'Whale',    object: 'fish', negated: true },
    { title: 'Berlin is a city (fem.)', type: 'instance_of', subject: 'Berlin',   object: 'ciudad', gender: 'feminine' },
    { title: 'Einstein wrote books',    type: 'relation',    subject: 'Einstein', predicate: 'wrote', object: 'books', tense: 'past' },
    { title: 'Everest is 8848 m tall',  type: 'quantity',    subject: 'Mount Everest', value: '8848', unit: 'meters' },
  ];

  const TENSES = ['present', 'past', 'future'];
  const GENDERS = ['masculine', 'feminine'];

  function GenerationMode() {
    const [type, setType]           = React.useState('instance_of');
    const [subject, setSubject]     = React.useState('Berlin');
    const [predicate, setPredicate] = React.useState('');
    const [object, setObject]       = React.useState('city');
    const [value, setValue]         = React.useState('');
    const [unit, setUnit]           = React.useState('');
    const [gender, setGender]       = React.useState('masculine');
    const [negated, setNegated]     = React.useState(false);
    const [tense, setTense]         = React.useState('present');
    const [result, setResult]       = React.useState(null);
    const [busy, setBusy]           = React.useState(false);
    const [error, setError]         = React.useState('');
    const [renderer, setRenderer]   = React.useState(null);

    React.useEffect(() => {
      try {
        if (!QPRenderer) throw new Error('QPRenderer not loaded by app.html');
        setRenderer(new QPRenderer());
      } catch (e) {
        setError(`Failed to load renderer: ${e?.message || e}`);
      }
    }, []);

    const spec = CONSTRUCTORS[type];
    const roleSet = spec?.roles || [];
    const usesPredicate = roleSet.includes('predicate');
    const usesObject = roleSet.includes('object');
    const usesValue = roleSet.includes('value');
    const usesUnit = roleSet.includes('unit');
    // Gender only drives the Romance indefinite article, which only appears
    // in templates that interpolate `{article}` (today: instance_of).
    const usesGender = !!spec && Object.values(spec.templates || {})
      .some((t) => JSON.stringify(t).includes('{article}'));

    const buildCurrent = () => {
      const roles = { subject };
      if (usesObject) roles.object = object;
      if (usesPredicate) roles.predicate = predicate;
      if (usesValue) roles.value = value;
      if (usesUnit) roles.unit = unit;
      const modifiers = { negated, tense };
      if (usesGender) modifiers.gender = gender;
      return buildConstructor(type, roles, modifiers);
    };

    const onGenerate = async (e) => {
      e?.preventDefault();
      if (!renderer) return;
      setBusy(true);
      setError('');
      setResult(null);
      try {
        const constructor = buildCurrent();
        validateConstructor(constructor);
        const sentences = await renderer.renderAll(constructor, UN6_LANGUAGES);
        setResult({ constructor, sentences });
      } catch (err) {
        setError(err?.message || String(err));
      } finally {
        setBusy(false);
      }
    };

    const onClear = () => {
      setSubject(''); setPredicate(''); setObject(''); setValue(''); setUnit('');
      setGender('masculine'); setNegated(false); setTense('present');
      setResult(null); setError('');
    };

    const loadExample = (ex) => {
      setType(ex.type);
      setSubject(ex.subject || '');
      setPredicate(ex.predicate || '');
      setObject(ex.object || '');
      setValue(ex.value || '');
      setUnit(ex.unit || '');
      setGender(ex.gender || 'masculine');
      setNegated(!!ex.negated);
      setTense(ex.tense || 'present');
    };

    const onRandom = () => loadExample(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);

    const fieldStyle = {
      background: 'var(--background)',
      color: 'var(--text)',
      border: '1px solid var(--rule)',
      borderRadius: '4px',
      padding: '8px',
      fontFamily: 'inherit',
      fontSize: '1rem',
    };

    const testRunners = [
      {
        label: 'Render the UN 6 languages',
        run: async () => {
          const r = new QPRenderer();
          const c = buildConstructor('instance_of', { subject: 'Berlin', object: 'city' });
          const out = await r.renderAll(c, UN6_LANGUAGES);
          for (const lang of UN6_LANGUAGES) {
            console.log(`${lang}: ${out[lang]}`);
          }
        },
      },
      {
        label: 'Render negation + located_in',
        run: async () => {
          const r = new QPRenderer();
          console.log('positive:', await r.render(buildConstructor('located_in', { subject: 'Paris', object: 'France' }), 'en'));
          console.log('negative:', await r.render(buildConstructor('instance_of', { subject: 'Whale', object: 'fish' }, { negated: true }), 'en'));
        },
      },
      {
        label: 'Romance gender agreement (un / una · un / une)',
        run: async () => {
          const r = new QPRenderer();
          const masc = buildConstructor('instance_of', { subject: 'Berlín', object: 'pueblo' }, { gender: 'masculine' });
          const fem = buildConstructor('instance_of', { subject: 'Berlín', object: 'ciudad' }, { gender: 'feminine' });
          console.log('es masculine:', await r.render(masc, 'es'));
          console.log('es feminine:', await r.render(fem, 'es'));
          console.log('fr feminine:', await r.render(buildConstructor('instance_of', { subject: 'Berlin', object: 'ville' }, { gender: 'feminine' }), 'fr'));
        },
      },
      {
        label: 'Render a quantity (measurement) across the UN 6',
        run: async () => {
          const r = new QPRenderer();
          const c = buildConstructor('quantity', { subject: 'Mount Everest', value: '8848', unit: 'meters' });
          const out = await r.renderAll(c, UN6_LANGUAGES);
          for (const lang of UN6_LANGUAGES) {
            console.log(`${lang}: ${out[lang]}`);
          }
        },
      },
    ];

    return (
      <section aria-label="Generation">
        <h1>Generation</h1>
        <p>
          Render a typed constructor (subject · predicate · object — or a
          subject · value · unit measurement — with negation, tense and
          Romance gender agreement) into natural-language sentences across the
          six official UN languages — the reverse of the Transformer. Role
          values may be Wikidata ids (resolved to labels per language) or plain
          text.
        </p>

        <form className="toolbar" onSubmit={onGenerate} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <label>
              Constructor{' '}
              <select value={type} onChange={(e) => setType(e.target.value)} style={fieldStyle}>
                {Object.keys(CONSTRUCTORS).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <span style={{ color: 'var(--description-text)' }}>{spec?.description}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <label>Subject <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Berlin or Q64" style={fieldStyle} /></label>
            {usesPredicate ? (
              <label>Predicate <input value={predicate} onChange={(e) => setPredicate(e.target.value)} placeholder="wrote or P800" style={fieldStyle} /></label>
            ) : null}
            {usesObject ? (
              <label>Object <input value={object} onChange={(e) => setObject(e.target.value)} placeholder="city or Q515" style={fieldStyle} /></label>
            ) : null}
            {usesValue ? (
              <label>Value <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="8848" style={fieldStyle} /></label>
            ) : null}
            {usesUnit ? (
              <label>Unit <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="meters" style={fieldStyle} /></label>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <label>
              <input type="checkbox" checked={negated} onChange={(e) => setNegated(e.target.checked)} /> Negated
            </label>
            <label>
              Tense{' '}
              <select value={tense} onChange={(e) => setTense(e.target.value)} style={fieldStyle}>
                {TENSES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            {usesGender ? (
              <label title="Drives Romance indefinite-article agreement (es un/una, fr un/une)">
                Object gender{' '}
                <select value={gender} onChange={(e) => setGender(e.target.value)} style={fieldStyle}>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="submit" disabled={busy || !renderer}>{busy ? 'Generating…' : 'Generate'}</button>
            <button type="button" onClick={onClear}>Clear</button>
            <button type="button" onClick={onRandom}>Load example</button>
          </div>
        </form>

        {error ? <p style={{ color: 'var(--badge-ambiguous)' }}>{error}</p> : null}

        {result ? (
          <div className="dictionary-result">
            <h2>Sentences</h2>
            <div className="statement-card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {UN6_LANGUAGES.map((lang) => (
                    <tr key={lang}>
                      <td style={{ padding: '6px 12px 6px 0', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        <span style={{ marginRight: '6px' }}>{flagMap[lang] || ''}</span>
                        <strong>{LANGUAGE_NAMES[lang] || lang}</strong>
                      </td>
                      <td style={{ padding: '6px 0' }} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        {result.sentences[lang]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2>Constructor</h2>
            <div className="statement-card">
              <code style={{ wordBreak: 'break-word' }}>{JSON.stringify(result.constructor)}</code>
            </div>
          </div>
        ) : null}

        <h2 style={{ marginTop: '24px' }}>Example constructors</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.title}
              type="button"
              onClick={() => loadExample(ex)}
              style={{
                textAlign: 'left',
                padding: '10px',
                border: '1px solid var(--rule)',
                background: 'var(--accent-bg)',
                color: 'var(--text)',
                borderRadius: '6px',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <strong style={{ display: 'block' }}>{ex.title}</strong>
              <em style={{ color: 'var(--description-text)' }}>{ex.type}</em>
            </button>
          ))}
        </div>

        <TestsPanel title="Run renderer demos" runners={testRunners} />
      </section>
    );
  }

  window.HumanLanguageApp.modes = window.HumanLanguageApp.modes || {};
  window.HumanLanguageApp.modes.generation = GenerationMode;
})();
