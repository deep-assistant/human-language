// Transformer mode.
//
// Re-skins `transformation/index.html` with the unified theme tokens and
// embeds it as a React mode. The underlying transformer
// (`transformation/text-to-qp-transformer.js`) is reused verbatim. A "Run
// tests" disclosure mounts the existing `text-transformer-test.js` driver
// inline.

(function attachTransformer() {
  // We deliberately read everything from `window.HumanLanguageApp` instead of
  // using dynamic `import()` — Babel-standalone (which compiles this file in
  // the browser) rewrites `import('./x.js')` to `require('./x.js')`, and
  // `require` is not defined, so the load fails with
  // "Failed to load transformer: require is not defined" (issue #35).
  const { TestsPanel, TextToQPTransformer, TextTransformerTest, demonstrateTransformer } =
    window.HumanLanguageApp;

  const EXAMPLES = [
    { title: 'Person and Birthplace',  text: 'Barack Obama was born in Hawaii' },
    { title: 'Scientific Discovery',   text: 'Albert Einstein discovered the theory of relativity' },
    { title: 'Geographic Relation',    text: 'Paris is the capital of France' },
    { title: 'Creative Work',          text: 'Shakespeare wrote Romeo and Juliet' },
    { title: 'Company Founding',       text: 'Steve Jobs founded Apple in California' },
    { title: 'Historical Event',       text: 'World War II ended in 1945' },
    { title: 'Family Relation',        text: 'Queen Elizabeth II was the mother of Prince Charles' },
    { title: 'Scientific Classification', text: 'A dolphin is a mammal that lives in the ocean' },
  ];

  function TransformerMode({ params }) {
    const [text, setText]                 = React.useState(params.text || '');
    const [includeLabels, setIncludeLabels] = React.useState(false);
    const [preferProperties, setPreferProperties] = React.useState(false);
    const [maxCandidates, setMaxCandidates] = React.useState(3);
    const [searchLimit, setSearchLimit]   = React.useState(10);
    const [maxNgramSize, setMaxNgramSize] = React.useState(3);
    const [result, setResult]             = React.useState(null);
    const [busy, setBusy]                 = React.useState(false);
    const [error, setError]               = React.useState('');
    const [transformer, setTransformer]   = React.useState(null);

    React.useEffect(() => {
      try {
        if (!TextToQPTransformer) {
          throw new Error('TextToQPTransformer not loaded by app.html');
        }
        setTransformer(new TextToQPTransformer());
      } catch (e) {
        setError(`Failed to load transformer: ${e?.message || e}`);
      }
    }, []);

    const onTransform = async (e) => {
      e?.preventDefault();
      if (!transformer || !text.trim()) return;
      setBusy(true);
      setError('');
      setResult(null);
      try {
        const res = await transformer.transform(text, {
          includeLabels,
          preferProperties,
          maxCandidates,
          searchLimit,
          maxNgramSize,
        });
        setResult(res);
      } catch (err) {
        setError(err?.message || String(err));
      } finally {
        setBusy(false);
      }
    };

    const onClear = () => { setText(''); setResult(null); setError(''); };

    const onRandom = () => {
      const pick = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
      setText(pick.text);
    };

    const renderSequence = (sequence) => sequence.map((item, idx) => {
      if (!item) return null;
      const cls =
        item.type === 'property' ? 'badge badge-property' :
        item.type === 'entity'   ? 'badge badge-entity' :
                                    'badge badge-ambiguous';
      let body;
      if (item.type === 'ambiguous') {
        const ids = (item.id || '').match(/[QP]\d+/g) || [];
        body = ids.map((id, j) => (
          <React.Fragment key={id}>
            {j > 0 ? ' or ' : ''}
            <a
              href={`#mode=${id.startsWith('Q') ? 'entity' : 'property'}&id=${id}`}
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              {id}
            </a>
          </React.Fragment>
        ));
      } else {
        body = (
          <a
            href={`#mode=${item.id.startsWith('Q') ? 'entity' : 'property'}&id=${item.id}`}
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            {item.id}
          </a>
        );
      }
      return (
        <span key={idx} className={cls}>
          {body}
          {includeLabels && item.label ? ` (${item.label})` : ''}
        </span>
      );
    });

    const testRunners = [
      {
        label: 'Run all transformer tests',
        run: async () => {
          const suite = new TextTransformerTest();
          const summary = await suite.runAllTests();
          console.log(`Result: ${summary?.passed}/${summary?.total} passed (${summary?.successRate?.toFixed?.(1)}%)`);
        },
      },
      {
        label: 'Run feature tests',
        run: async () => {
          const suite = new TextTransformerTest();
          await suite.testSpecificFeatures();
          console.log('Feature tests completed.');
        },
      },
      {
        label: 'Run demo',
        run: async () => {
          await demonstrateTransformer();
          console.log('Demo completed.');
        },
      },
    ];

    return (
      <section aria-label="Transformer">
        <h1>Transformer</h1>
        <p>Transform English text into a sequence of Wikidata entities (Q) and properties (P).</p>

        <form className="toolbar" onSubmit={onTransform} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: Barack Obama was born in Hawaii"
            style={{
              width: '100%',
              minHeight: '120px',
              background: 'var(--background)',
              color: 'var(--text)',
              border: '1px solid var(--rule)',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'inherit',
              fontSize: '1rem',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <label>
              <input type="checkbox" checked={includeLabels} onChange={(e) => setIncludeLabels(e.target.checked)} /> Include labels
            </label>
            <label>
              <input type="checkbox" checked={preferProperties} onChange={(e) => setPreferProperties(e.target.checked)} /> Prefer properties
            </label>
            <label>Max candidates <input type="number" min="1" max="10" value={maxCandidates} onChange={(e) => setMaxCandidates(+e.target.value)} style={{ width: '60px' }} /></label>
            <label>Search limit <input type="number" min="5" max="50" value={searchLimit} onChange={(e) => setSearchLimit(+e.target.value)} style={{ width: '60px' }} /></label>
            <label>Max n-gram <input type="number" min="1" max="5" value={maxNgramSize} onChange={(e) => setMaxNgramSize(+e.target.value)} style={{ width: '60px' }} /></label>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="submit" disabled={busy || !transformer}>{busy ? 'Transforming…' : 'Transform'}</button>
            <button type="button" onClick={onClear}>Clear</button>
            <button type="button" onClick={onRandom}>Load example</button>
          </div>
        </form>

        {error ? <p style={{ color: 'var(--badge-ambiguous)' }}>{error}</p> : null}

        {result ? (
          <div className="dictionary-result">
            <h2>Q/P Sequence</h2>
            <div className="statement-card">
              <code style={{ wordBreak: 'break-word' }}>
                {result.formatted || 'No matches found'}
              </code>
            </div>
            {result.sequence?.length ? (
              <>
                <h2>Visual</h2>
                <div className="statement-card">
                  {renderSequence(result.sequence)}
                </div>
              </>
            ) : null}
            <h2>Tokens</h2>
            <div className="statement-card">
              {result.tokens?.map((t, i) => (
                <span key={i} className="badge" style={{ background: 'var(--mode-tab-bg-active)', color: 'var(--text)' }}>{t}</span>
              ))}
            </div>
          </div>
        ) : null}

        <h2 style={{ marginTop: '24px' }}>Example texts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.title}
              type="button"
              onClick={() => setText(ex.text)}
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
              <em style={{ color: 'var(--description-text)' }}>“{ex.text}”</em>
            </button>
          ))}
        </div>

        <TestsPanel title="Run tests" runners={testRunners} />
      </section>
    );
  }

  window.HumanLanguageApp.modes = window.HumanLanguageApp.modes || {};
  window.HumanLanguageApp.modes.transformer = TransformerMode;
})();
