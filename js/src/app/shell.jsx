// Shell for the unified Human Language SPA.
//
// Owns the chrome that is common to every mode:
//   - The mode tab bar (alphabet | dictionary | ontology | entity | property | transformer).
//   - The theme toggle (dark / light) with automatic detection from prefers-color-scheme.
//   - The language switcher (per-mode list, common visual).
//   - A small React context (`AppContext`) that publishes the active language,
//     theme, navigate helper and a shared `flagMap` to every mode.
//
// The mode components themselves live under `app/modes/*.jsx` and only export
// the inner body — `Shell` is responsible for wrapping them with consistent
// chrome and a watermark.

(function attachShell() {
  const {
    STORAGE_KEYS,
    saveToLocalStorage,
    loadFromLocalStorage,
    flagMap,
    parseHash,
    serializeHash,
    navigate: navigateHash,
    MODES,
  } = window.HumanLanguageApp;

  const AppContext = React.createContext({
    language: 'en',
    theme: 'dark',
    setLanguage: () => {},
    setTheme: () => {},
    navigate: () => {},
    flagMap,
  });

  function detectInitialTheme() {
    const saved = loadFromLocalStorage(STORAGE_KEYS.THEME, null);
    if (saved) return saved;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    } catch { /* ignore */ }
    return 'dark';
  }

  function detectInitialLanguage() {
    const saved = loadFromLocalStorage(STORAGE_KEYS.LANGUAGE, null);
    if (saved) return saved;
    try {
      const list = navigator.languages && navigator.languages.length
        ? navigator.languages
        : (navigator.language ? [navigator.language] : ['en']);
      for (const code of list) {
        const base = code.split('-')[0];
        if (flagMap[base]) return base;
      }
    } catch { /* ignore */ }
    return 'en';
  }

  const MODE_LABELS = {
    alphabet: 'Alphabet',
    dictionary: 'Dictionary',
    ontology: 'Ontology',
    entity: 'Entities',
    property: 'Properties',
    transformer: 'Transformer',
  };

  function ModeTabs({ mode, params }) {
    return (
      <nav className="mode-tabs" aria-label="Modes">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={m === mode ? 'active' : ''}
            onClick={() => navigateHash(m, m === mode ? params : {})}
          >
            {MODE_LABELS[m] || m}
          </button>
        ))}
      </nav>
    );
  }

  function ThemeToggle() {
    const { theme, setTheme } = React.useContext(AppContext);
    return (
      <button
        className="theme-toggle"
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    );
  }

  function LanguageSwitcher({ languages = [] }) {
    const { language, setLanguage } = React.useContext(AppContext);
    let preferred = [];
    try {
      preferred = (navigator.languages || []).map((l) => l.split('-')[0]);
    } catch { preferred = []; }

    const list = languages && languages.length ? languages : Object.keys(flagMap).slice(0, 25);

    return (
      <div className="language-switcher" role="toolbar" aria-label="Languages">
        {list.map((lang) => {
          const isSelected = lang === language;
          const isPreferred = preferred.includes(lang) && !isSelected;
          return (
            <button
              key={lang}
              type="button"
              className={`${isSelected ? 'selected' : ''} ${isPreferred ? 'preferred' : ''}`}
              onClick={() => setLanguage(lang)}
              title={lang}
            >
              {flagMap[lang] || lang}
            </button>
          );
        })}
      </div>
    );
  }

  /**
   * Top-level shell. Renders the active mode body and the persistent chrome.
   *
   * Props:
   *   - mode, params: from parseHash(location.hash)
   *   - children: the rendered mode body
   *   - languages: optional list overriding the global flag map for the footer
   *   - watermark: optional watermark text override (default = current mode)
   */
  function Shell({ mode, params, languages, watermark, children }) {
    const [theme, setThemeState] = React.useState(detectInitialTheme);
    const [language, setLanguageState] = React.useState(detectInitialLanguage);

    React.useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const setTheme = React.useCallback((next) => {
      setThemeState(next);
      saveToLocalStorage(STORAGE_KEYS.THEME, next);
    }, []);
    const setLanguage = React.useCallback((next) => {
      setLanguageState(next);
      saveToLocalStorage(STORAGE_KEYS.LANGUAGE, next);
    }, []);

    const ctx = React.useMemo(() => ({
      theme,
      language,
      setTheme,
      setLanguage,
      navigate: navigateHash,
      flagMap,
    }), [theme, language, setTheme, setLanguage]);

    return (
      <AppContext.Provider value={ctx}>
        <ModeTabs mode={mode} params={params} />
        <ThemeToggle />
        <div className="app-wrapper">
          <main>{children}</main>
          <div className="watermark">{watermark || mode}</div>
        </div>
        <LanguageSwitcher languages={languages} />
      </AppContext.Provider>
    );
  }

  window.HumanLanguageApp.Shell = Shell;
  window.HumanLanguageApp.AppContext = AppContext;
})();
