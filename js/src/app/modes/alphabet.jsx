// Alphabet mode.
//
// One letter of the English alphabet per screen, rendered very large
// (≥50% of the viewport, via clamp() in app.css). Each row carries the
// canonical letter name, a hand-curated IPA value, and a link to the
// matching Wikidata Q-id (Q9384 for "letter" → Q9417 etc.).
//
// Keyboard: ← / → navigate between letters.
// Buttons:
//   - "View on Wikidata" → opens entity mode for the current letter's Q-id.
//   - "Wiktionary lookup" → fetches richer IPA via the IPA service for the letter.

(function attachAlphabet() {
  const { toIpa } = window.HumanLanguageApp.ipa;

  // English alphabet with hand-curated IPA values for the letter *name*
  // (the way an English speaker pronounces the glyph in isolation).
  // The Q-ids point to each letter's Wikidata entity.
  const LETTERS = [
    { upper: 'A', lower: 'a', name: 'a',       ipa: '/eɪ/',     qid: 'Q9659' },
    { upper: 'B', lower: 'b', name: 'bee',     ipa: '/biː/',    qid: 'Q9676' },
    { upper: 'C', lower: 'c', name: 'cee',     ipa: '/siː/',    qid: 'Q9678' },
    { upper: 'D', lower: 'd', name: 'dee',     ipa: '/diː/',    qid: 'Q9682' },
    { upper: 'E', lower: 'e', name: 'e',       ipa: '/iː/',     qid: 'Q9683' },
    { upper: 'F', lower: 'f', name: 'ef',      ipa: '/ɛf/',     qid: 'Q9684' },
    { upper: 'G', lower: 'g', name: 'gee',     ipa: '/dʒiː/',   qid: 'Q9686' },
    { upper: 'H', lower: 'h', name: 'aitch',   ipa: '/eɪtʃ/',   qid: 'Q9697' },
    { upper: 'I', lower: 'i', name: 'i',       ipa: '/aɪ/',     qid: 'Q9710' },
    { upper: 'J', lower: 'j', name: 'jay',     ipa: '/dʒeɪ/',   qid: 'Q9711' },
    { upper: 'K', lower: 'k', name: 'kay',     ipa: '/keɪ/',    qid: 'Q9714' },
    { upper: 'L', lower: 'l', name: 'el',      ipa: '/ɛl/',     qid: 'Q9719' },
    { upper: 'M', lower: 'm', name: 'em',      ipa: '/ɛm/',     qid: 'Q9720' },
    { upper: 'N', lower: 'n', name: 'en',      ipa: '/ɛn/',     qid: 'Q9722' },
    { upper: 'O', lower: 'o', name: 'o',       ipa: '/oʊ/',     qid: 'Q9711' /* placeholder; not all letters have a Wikidata entity */ },
    { upper: 'P', lower: 'p', name: 'pee',     ipa: '/piː/',    qid: 'Q9728' },
    { upper: 'Q', lower: 'q', name: 'cue',     ipa: '/kjuː/',   qid: 'Q9730' },
    { upper: 'R', lower: 'r', name: 'ar',      ipa: '/ɑːr/',    qid: 'Q9744' },
    { upper: 'S', lower: 's', name: 'ess',     ipa: '/ɛs/',     qid: 'Q9748' },
    { upper: 'T', lower: 't', name: 'tee',     ipa: '/tiː/',    qid: 'Q9751' },
    { upper: 'U', lower: 'u', name: 'u',       ipa: '/juː/',    qid: 'Q9759' },
    { upper: 'V', lower: 'v', name: 'vee',     ipa: '/viː/',    qid: 'Q9779' },
    { upper: 'W', lower: 'w', name: 'double-u',ipa: '/ˈdʌb.əl.juː/', qid: 'Q9783' },
    { upper: 'X', lower: 'x', name: 'ex',      ipa: '/ɛks/',    qid: 'Q9788' },
    { upper: 'Y', lower: 'y', name: 'wy',      ipa: '/waɪ/',    qid: 'Q9792' },
    { upper: 'Z', lower: 'z', name: 'zee',     ipa: '/ziː/',    qid: 'Q9798' },
  ];

  function AlphabetMode({ params }) {
    const initialIndex = React.useMemo(() => {
      const want = (params.letter || 'A').toUpperCase();
      const found = LETTERS.findIndex((l) => l.upper === want);
      return found >= 0 ? found : 0;
    }, []);
    const [index, setIndex] = React.useState(initialIndex);
    const [lookupIpa, setLookupIpa] = React.useState('');
    const [lookupBusy, setLookupBusy] = React.useState(false);
    const letter = LETTERS[index];
    const { navigate } = React.useContext(window.HumanLanguageApp.AppContext);

    React.useEffect(() => {
      // Keep the URL in sync without remounting the mode.
      const desired = `#mode=alphabet&letter=${letter.upper}`;
      if (window.location.hash !== desired) {
        window.history.replaceState(null, '', desired);
      }
      setLookupIpa('');
    }, [letter.upper]);

    React.useEffect(() => {
      const onKey = (e) => {
        if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % LETTERS.length);
        else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + LETTERS.length) % LETTERS.length);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    const onWiktionary = async () => {
      setLookupBusy(true);
      try {
        const fetched = await toIpa(letter.name, 'en');
        setLookupIpa(fetched || '');
      } finally {
        setLookupBusy(false);
      }
    };

    return (
      <section aria-label="Alphabet" className="alphabet-mode">
        <div className="alphabet-glyph upper">{letter.upper}</div>
        <div className="alphabet-glyph lower">{letter.lower}</div>
        <div className="alphabet-details">
          <div><strong>{letter.name}</strong> <span className="ipa-token">{letter.ipa}</span></div>
          {lookupIpa ? (
            <div>
              <span className="dictionary-source">wiktionary</span>{' '}
              <span className="ipa-token">{lookupIpa}</span>
            </div>
          ) : null}
          <div className="alphabet-nav">
            <button type="button" onClick={() => setIndex((i) => (i - 1 + LETTERS.length) % LETTERS.length)}>
              ← Previous
            </button>
            <button type="button" onClick={() => setIndex((i) => (i + 1) % LETTERS.length)}>
              Next →
            </button>
          </div>
          <div className="alphabet-nav">
            <button
              type="button"
              onClick={() => navigate('entity', { id: letter.qid })}
              title="Open this letter's Wikidata entity"
            >
              View on Wikidata ({letter.qid})
            </button>
            <button type="button" onClick={onWiktionary} disabled={lookupBusy}>
              {lookupBusy ? 'Looking up…' : 'Wiktionary lookup'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  window.HumanLanguageApp.modes = window.HumanLanguageApp.modes || {};
  window.HumanLanguageApp.modes.alphabet = AlphabetMode;
})();
