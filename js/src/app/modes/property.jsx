// Property mode.
//
// Wikidata property browser (P-ids). Mirrors `entity.jsx` but routes to the
// property cache store and ID space (P31, P279, …). Adds the same IPA toggle
// and inline tests panel.

(function attachProperty() {
  const { toIpa, toIpaForEntity } = window.HumanLanguageApp.ipa;
  const { TestsPanel } = window.HumanLanguageApp;

  function PropertyMode({ params }) {
    const { language, setLanguage, navigate } = React.useContext(window.HumanLanguageApp.AppContext);
    const propertyId = (params.id && /^P\d+$/i.test(params.id)) ? params.id.toUpperCase() : 'P31';

    const [labels, setLabels] = React.useState({});
    const [descriptions, setDescriptions] = React.useState({});
    const [statements, setStatements] = React.useState({});
    const [availableLanguages, setAvailableLanguages] = React.useState([]);
    const [propertyLabels, setPropertyLabels] = React.useState({});
    const [entityLabels, setEntityLabels] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(true);
    const [showIpa, setShowIpa] = React.useState(params.ipa === '1');
    const [ipaLabel, setIpaLabel] = React.useState('');
    const [ipaDesc, setIpaDesc] = React.useState('');

    const { apiClient, cacheManager, labelManager } = window;

    React.useEffect(() => {
      let cancelled = false;
      (async () => {
        setIsLoading(true);
        setIpaLabel('');
        setIpaDesc('');
        try {
          const preferredLangs = [...new Set([
            ...(navigator.languages || []).map((l) => l.split('-')[0]),
            'en',
          ])];
          const commonLanguages = ['en','fr','de','es','it','pt','ru','zh','ja','ko','ar','hi','bn','ta','te','ml','ur','fa','tr','vi'];
          const allLanguages = [...new Set([...preferredLangs, ...commonLanguages])];
          const languages = allLanguages.join('|');

          let cached = await cacheManager.getFromCache(cacheManager.stores.PROPERTIES, propertyId);
          let data;
          if (!cached || !cacheManager.isCachedDataComplete(cached, languages)) {
            data = await apiClient.fetchProperty(propertyId, languages);
            if (data) await cacheManager.saveToCache(cacheManager.stores.PROPERTIES, propertyId, data);
          } else {
            data = cached.data;
          }
          if (cancelled) return;
          if (!data) {
            setLabels({}); setDescriptions({}); setStatements({}); setAvailableLanguages([]);
            setIsLoading(false);
            return;
          }
          setLabels(data.labels || {});
          setDescriptions(data.descriptions || {});
          setStatements(data.claims || {});
          const langSet = new Set([
            ...Object.keys(data.labels || {}),
            ...Object.keys(data.descriptions || {}),
          ]);
          setAvailableLanguages(Array.from(langSet).sort());
          if (!langSet.has(language)) {
            const fallback = preferredLangs.find((l) => langSet.has(l)) || 'en';
            setLanguage(fallback);
          }
          const { propertyLabels: pl, entityLabels: el } =
            await labelManager.loadAllLabels(data.claims || {}, languages);
          if (!cancelled) {
            setPropertyLabels(pl);
            setEntityLabels(el);
            setIsLoading(false);
          }
        } catch {
          if (!cancelled) {
            setLabels({}); setDescriptions({}); setStatements({}); setAvailableLanguages([]);
            setIsLoading(false);
          }
        }
      })();
      return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId]);

    React.useEffect(() => {
      if (!showIpa) {
        setIpaLabel('');
        setIpaDesc('');
        return;
      }
      let cancelled = false;
      (async () => {
        const baseDesc = descriptions?.[language]?.value || descriptions?.en?.value || '';
        const entity = { labels, descriptions, claims: statements };
        const [ipa1, ipa2] = await Promise.all([
          toIpaForEntity(entity, language),
          baseDesc ? toIpa(baseDesc, language) : Promise.resolve(''),
        ]);
        if (cancelled) return;
        setIpaLabel(ipa1 || '');
        setIpaDesc(ipa2 || '');
      })();
      return () => { cancelled = true; };
    }, [showIpa, language, propertyId, labels, descriptions, statements]);

    const currentLabel = labels?.[language]?.value || 'No label available';
    const otherLabels = (availableLanguages || [])
      .filter((l) => l !== language && labels?.[l]?.value)
      .slice(0, 5);
    const descriptionsList = [language, ...otherLabels]
      .map((l) => descriptions?.[l]?.value).filter(Boolean);

    const getLabel = labelManager.createGetLabelFunction
      ? labelManager.createGetLabelFunction(propertyId, labels, entityLabels, propertyLabels, language)
      : (id) => id;

    const StatementsSection = window.StatementComponents?.StatementsSection;
    const LoadingComponent = window.LoadingComponents?.LoadingComponent;

    if (isLoading && LoadingComponent) return <LoadingComponent />;

    const testRunners = [
      {
        label: 'Quick smoke',
        run: async () => {
          console.log('Fetching P31 (instance of)…');
          const data = await apiClient.fetchProperty('P31', 'en');
          console.log('Got labels.en =', data?.labels?.en?.value);
        },
      },
    ];

    return (
      <section aria-label="Property browser">
        <div className="toolbar">
          <span>Property: <strong>{propertyId}</strong></span>
          <button
            type="button"
            className={showIpa ? 'active' : ''}
            onClick={() => setShowIpa((v) => !v)}
          >
            {showIpa ? '✓ IPA' : 'Show in IPA'}
          </button>
          <a
            className="entity-info"
            style={{ marginLeft: 'auto' }}
            href={`https://www.wikidata.org/wiki/Property:${propertyId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Wikidata ↗
          </a>
        </div>

        <h1>{showIpa && ipaLabel ? <span className="ipa-token">{ipaLabel}</span> : currentLabel}</h1>
        {otherLabels.map((l) => <h2 key={l}>{labels[l].value}</h2>)}
        {descriptionsList.length > 0 ? (
          descriptionsList.map((d, i) => (
            <p key={i}>{i === 0 && showIpa && ipaDesc ? <span className="ipa-token">{ipaDesc}</span> : d}</p>
          ))
        ) : (
          <p>No description available.</p>
        )}

        {StatementsSection ? (
          <StatementsSection
            statements={statements}
            subjectId={propertyId}
            getLabel={getLabel}
            onEntityClick={(id) => navigate('entity', { id })}
            onPropertyClick={(id) => navigate('property', { id })}
            selectedLanguage={language}
          />
        ) : null}

        <TestsPanel title="Run tests" runners={testRunners} />
      </section>
    );
  }

  window.HumanLanguageApp.modes = window.HumanLanguageApp.modes || {};
  window.HumanLanguageApp.modes.property = PropertyMode;
})();
