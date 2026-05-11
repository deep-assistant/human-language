// Entity mode.
//
// Wikidata entity browser (Q-ids). Behaviour is preserved from the original
// `entities.html`; the new additions:
//
//   - An "IPA" toggle in the toolbar that re-renders labels and descriptions
//     through the IPA service. The replacement is memoised per language.
//   - A "Run tests" disclosure that mounts the browser-side test runner
//     inline below the content (today's `run-tests.html`).

(function attachEntity() {
  const { toIpa, toIpaForEntity } = window.HumanLanguageApp.ipa;
  const { TestsPanel } = window.HumanLanguageApp;

  function EntityMode({ params }) {
    const { language, setLanguage, navigate } = React.useContext(window.HumanLanguageApp.AppContext);
    const entityId = (params.id && /^Q\d+$/i.test(params.id)) ? params.id.toUpperCase() : 'Q35120';

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

          let cached = await cacheManager.getFromCache(cacheManager.stores.ENTITIES, entityId);
          let entityData;
          if (!cached || !cacheManager.isCachedDataComplete(cached, languages)) {
            entityData = await apiClient.fetchEntity(entityId, languages);
            if (entityData) {
              await cacheManager.saveToCache(cacheManager.stores.ENTITIES, entityId, entityData);
            }
          } else {
            entityData = cached.data;
          }

          if (cancelled) return;
          if (!entityData) {
            setLabels({}); setDescriptions({}); setStatements({}); setAvailableLanguages([]);
            setIsLoading(false);
            return;
          }
          setLabels(entityData.labels || {});
          setDescriptions(entityData.descriptions || {});
          setStatements(entityData.claims || {});
          const langSet = new Set([
            ...Object.keys(entityData.labels || {}),
            ...Object.keys(entityData.descriptions || {}),
          ]);
          setAvailableLanguages(Array.from(langSet).sort());
          if (!langSet.has(language)) {
            const fallback = preferredLangs.find((l) => langSet.has(l)) || 'en';
            setLanguage(fallback);
          }
          const { propertyLabels: pl, entityLabels: el } =
            await labelManager.loadAllLabels(entityData.claims || {}, languages);
          if (!cancelled) {
            setPropertyLabels(pl);
            setEntityLabels(el);
            setIsLoading(false);
          }
        } catch (e) {
          if (!cancelled) {
            setLabels({}); setDescriptions({}); setStatements({}); setAvailableLanguages([]);
            setIsLoading(false);
          }
        }
      })();
      return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    // Recompute IPA whenever the toggle, language, or entity changes.
    React.useEffect(() => {
      if (!showIpa) {
        setIpaLabel('');
        setIpaDesc('');
        return;
      }
      let cancelled = false;
      (async () => {
        const baseLabel = labels?.[language]?.value || labels?.en?.value || '';
        const baseDesc = descriptions?.[language]?.value || descriptions?.en?.value || '';
        const entity = { labels, descriptions, claims: statements };
        const [ipa1, ipa2] = await Promise.all([
          toIpaForEntity(entity, language),
          baseDesc ? toIpa(baseDesc, language) : Promise.resolve(''),
        ]);
        if (cancelled) return;
        setIpaLabel(ipa1 || baseLabel);
        setIpaDesc(ipa2 || baseDesc);
      })();
      return () => { cancelled = true; };
    }, [showIpa, language, entityId, labels, descriptions, statements]);

    const currentLabel = labels?.[language]?.value || 'No label available';
    const otherLabels = (availableLanguages || [])
      .filter((l) => l !== language && labels?.[l]?.value)
      .slice(0, 5);
    const descriptionsList = [language, ...otherLabels]
      .map((l) => descriptions?.[l]?.value).filter(Boolean);

    const getLabel = labelManager.createGetLabelFunction
      ? labelManager.createGetLabelFunction(entityId, labels, entityLabels, propertyLabels, language)
      : (id) => id;

    const StatementsSection = window.StatementComponents?.StatementsSection;
    const LoadingComponent = window.LoadingComponents?.LoadingComponent;

    if (isLoading && LoadingComponent) {
      return <LoadingComponent />;
    }

    const testRunners = [
      {
        label: 'Quick smoke',
        run: async () => {
          console.log('Fetching Q35120 (entity)…');
          const data = await apiClient.fetchEntity('Q35120', 'en');
          console.log('Got labels.en =', data?.labels?.en?.value);
          console.log('Cache hit on second call:');
          const cached = await cacheManager.getFromCache(cacheManager.stores.ENTITIES, 'Q35120');
          console.log(cached ? 'OK' : 'no cache yet');
        },
      },
    ];

    return (
      <section aria-label="Entity browser">
        <div className="toolbar">
          <span>Entity: <strong>{entityId}</strong></span>
          <button
            type="button"
            className={showIpa ? 'active' : ''}
            onClick={() => setShowIpa((v) => !v)}
            title="Render labels and descriptions through the IPA service"
          >
            {showIpa ? '✓ IPA' : 'Show in IPA'}
          </button>
          <a
            className="entity-info"
            style={{ marginLeft: 'auto' }}
            href={`https://www.wikidata.org/wiki/${entityId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Wikidata ↗
          </a>
        </div>

        <h1>{showIpa && ipaLabel ? <span className="ipa-token">{ipaLabel}</span> : currentLabel}</h1>
        {otherLabels.map((l) => (
          <h2 key={l}>{labels[l].value}</h2>
        ))}
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
            subjectId={entityId}
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
  window.HumanLanguageApp.modes.entity = EntityMode;
})();
