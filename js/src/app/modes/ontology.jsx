// Ontology mode.
//
// Browses the Wikidata class tree rooted at Q35120 ("entity"). Each node is a
// `<details>` element; expansion lazily fetches direct subclasses via SPARQL
// (P279 = subclass of). A `Set<Q-id>` of ancestors is propagated through the
// recursion so cycles render an "↺ already shown" badge instead of expanding.
//
// Clicking a node title navigates to the entity browser (`#mode=entity&id=…`).

(function attachOntology() {
  const ROOT = 'Q35120';
  const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

  async function fetchSubclasses(qid, lang) {
    const query = `
      SELECT ?child ?childLabel WHERE {
        ?child wdt:P279 wd:${qid} .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang || 'en'},en". }
      }
      ORDER BY ?childLabel
      LIMIT 200
    `;
    const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/sparql-results+json' } });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.results?.bindings || []).map((b) => ({
        id: (b.child?.value || '').split('/').pop(),
        label: b.childLabel?.value || (b.child?.value || '').split('/').pop(),
      })).filter((c) => /^Q\d+$/.test(c.id));
    } catch {
      return [];
    }
  }

  function OntologyNode({ id, label, ancestors, depth }) {
    const { language, navigate } = React.useContext(window.HumanLanguageApp.AppContext);
    const [open, setOpen] = React.useState(false);
    const [children, setChildren] = React.useState(null);
    const [busy, setBusy] = React.useState(false);

    const onToggle = async (e) => {
      const next = e.target.open;
      setOpen(next);
      if (next && children === null) {
        setBusy(true);
        const fetched = await fetchSubclasses(id, language);
        setChildren(fetched);
        setBusy(false);
      }
    };

    return (
      <details className="ontology-node" onToggle={onToggle}>
        <summary>
          <a
            href={`#mode=entity&id=${id}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('entity', { id }); }}
            className="statement-link"
          >
            {label}
          </a>
          <span className="ontology-node-id">{id}</span>
        </summary>
        {open ? (
          <div className="ontology-children">
            {busy && children === null ? <p>Loading subclasses…</p> : null}
            {Array.isArray(children) && children.length === 0 ? (
              <p>No direct subclasses.</p>
            ) : null}
            {Array.isArray(children) ? children.map((c) => {
              if (ancestors.has(c.id)) {
                return (
                  <div key={c.id} className="ontology-cycle">
                    ↺ {c.label} ({c.id}) — already shown above
                  </div>
                );
              }
              const nextAncestors = new Set(ancestors);
              nextAncestors.add(c.id);
              return (
                <OntologyNode
                  key={c.id}
                  id={c.id}
                  label={c.label}
                  ancestors={nextAncestors}
                  depth={(depth || 0) + 1}
                />
              );
            }) : null}
          </div>
        ) : null}
      </details>
    );
  }

  function OntologyMode({ params }) {
    const rootId = (params.root && /^Q\d+$/i.test(params.root)) ? params.root.toUpperCase() : ROOT;
    const ancestors = React.useMemo(() => new Set([rootId]), [rootId]);
    return (
      <section aria-label="Ontology">
        <h1>Ontology</h1>
        <p>
          Browse the Wikidata class hierarchy rooted at{' '}
          <a href="https://www.wikidata.org/wiki/Q35120" target="_blank" rel="noopener noreferrer">{rootId}</a>.
          Expand a node to fetch its direct subclasses (P279). Cycles render with
          an <em>already shown</em> badge.
        </p>
        <OntologyNode id={rootId} label={rootId === ROOT ? 'entity' : rootId} ancestors={ancestors} depth={0} />
      </section>
    );
  }

  window.HumanLanguageApp.modes = window.HumanLanguageApp.modes || {};
  window.HumanLanguageApp.modes.ontology = OntologyMode;
})();
