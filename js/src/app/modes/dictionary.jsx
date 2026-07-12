// Dictionary mode.
//
// Looks up a word across multiple publicly-accessible dictionaries and merges
// the result by part of speech. Two backends ship with this PR:
//
//   - Free Dictionary API (https://api.dictionaryapi.dev/).
//   - Wiktionary REST API (https://en.wiktionary.org/api/rest_v1/).
//
// Both are CORS-enabled so no proxy is required. Results from each backend are
// presented in the same list with a small badge naming the source.
//
// A "Show in IPA" toggle re-renders every example / definition through the IPA
// service. The headword stays in its original orthography per the issue text.

(function attachDictionary() {
  const { toIpa } = window.HumanLanguageApp.ipa;

  async function fetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function lookupFreeDict(word, lang) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(lang)}/${encodeURIComponent(word)}`;
    const json = await fetchJson(url);
    if (!Array.isArray(json)) return [];
    const out = [];
    for (const entry of json) {
      if (!Array.isArray(entry.meanings)) continue;
      for (const meaning of entry.meanings) {
        const definitions = (meaning.definitions || []).map((d) => ({
          definition: d.definition || '',
          example: d.example || '',
        }));
        out.push({
          source: 'Free Dictionary',
          partOfSpeech: meaning.partOfSpeech || '—',
          phonetic: entry.phonetic || (Array.isArray(entry.phonetics) ? (entry.phonetics.find((p) => p?.text)?.text) : '') || '',
          definitions,
        });
      }
    }
    return out;
  }

  async function lookupWiktionary(word, lang) {
    const host = `${encodeURIComponent(lang)}.wiktionary.org`;
    const url = `https://${host}/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
    const json = await fetchJson(url);
    if (!json || typeof json !== 'object') return [];
    const out = [];
    for (const [langCode, sections] of Object.entries(json)) {
      if (!Array.isArray(sections)) continue;
      for (const section of sections) {
        if (!Array.isArray(section.definitions)) continue;
        const definitions = section.definitions.map((d) => ({
          definition: (d.definition || '').replace(/<[^>]*>/g, ''),
          example: Array.isArray(d.examples) && d.examples.length ? d.examples[0].replace(/<[^>]*>/g, '') : '',
        }));
        out.push({
          source: `Wiktionary (${langCode})`,
          partOfSpeech: section.partOfSpeech || '—',
          phonetic: '',
          definitions,
        });
      }
    }
    return out;
  }

  function DictionaryMode({ params }) {
    const { language, navigate } = React.useContext(window.HumanLanguageApp.AppContext);
    const [word, setWord] = React.useState(params.word || '');
    const [defLang, setDefLang] = React.useState(params.lang || language || 'en');
    const [showIpa, setShowIpa] = React.useState(params.ipa === '1');
    const [results, setResults] = React.useState(null);
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [ipaCache, setIpaCache] = React.useState({});

    const runLookup = React.useCallback(async (target) => {
      if (!target) return;
      setBusy(true);
      setError('');
      setResults(null);
      try {
        const [free, wikti] = await Promise.all([
          lookupFreeDict(target, defLang),
          lookupWiktionary(target, defLang),
        ]);
        const merged = [...free, ...wikti];
        if (!merged.length) {
          setError('No definitions found.');
        }
        setResults(merged);
      } finally {
        setBusy(false);
      }
    }, [defLang]);

    React.useEffect(() => {
      if (params.word) {
        runLookup(params.word);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSubmit = (e) => {
      e.preventDefault();
      const target = word.trim();
      if (!target) return;
      navigate('dictionary', { word: target, lang: defLang, ipa: showIpa ? '1' : '' });
      runLookup(target);
    };

    const renderText = (text) => {
      if (!showIpa || !text) return text;
      const cached = ipaCache[`${defLang}:${text}`];
      if (cached) return <span className="ipa-token">{cached}</span>;
      // Fire-and-forget IPA fetch, render plaintext while resolving.
      toIpa(text, defLang).then((value) => {
        setIpaCache((prev) => ({ ...prev, [`${defLang}:${text}`]: value || text }));
      });
      return text;
    };

    return (
      <section aria-label="Dictionary">
        <h1>Dictionary</h1>
        <form className="toolbar" onSubmit={onSubmit}>
          <input
            type="search"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Type a word…"
            aria-label="Word"
            style={{ flex: 1, minWidth: '180px' }}
          />
          <label>
            Lang{' '}
            <select value={defLang} onChange={(e) => setDefLang(e.target.value)} aria-label="Definition language">
              {['en','fr','de','es','it','pt','ru','nl','pl','sv','tr','ar','ja','zh','ko','hi'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={showIpa ? 'active' : ''}
            onClick={() => setShowIpa((v) => !v)}
            title="Render definitions through the IPA service"
          >
            {showIpa ? '✓ IPA' : 'Show in IPA'}
          </button>
          <button type="submit" disabled={busy}>{busy ? 'Looking up…' : 'Look up'}</button>
        </form>

        {error ? <p>{error}</p> : null}

        {Array.isArray(results) ? (
          <div className="dictionary-result">
            <div className="dictionary-headword">{word}</div>
            {results.length === 0 ? null : results.map((r, idx) => (
              <div className="dictionary-pos" key={idx}>
                <h3>
                  {r.partOfSpeech}
                  <span className="dictionary-source">{r.source}</span>
                  {r.phonetic ? <span className="ipa-token" style={{ marginLeft: '8px' }}>{r.phonetic}</span> : null}
                </h3>
                {r.definitions.map((d, j) => (
                  <div key={j}>
                    <div className="dictionary-definition">{renderText(d.definition)}</div>
                    {d.example ? <div className="dictionary-example">“{renderText(d.example)}”</div> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  window.HumanLanguageApp.modes = window.HumanLanguageApp.modes || {};
  window.HumanLanguageApp.modes.dictionary = DictionaryMode;
})();
