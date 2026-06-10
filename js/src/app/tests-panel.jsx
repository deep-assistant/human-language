// Inline test-runner panel for the unified SPA.
//
// Entity, property and transformer modes mount this panel inside a
// <details> so users can run the bundled test suites without leaving the page.
//
// Each consumer provides:
//   - `title`: text shown in the disclosure summary.
//   - `runners`: an array of `{ label, run }` where `run` is an async function
//                that returns a string (or throws). Console output emitted by
//                `run` is captured and surfaced in the panel.

(function attachTestsPanel() {
  function captureConsole(append) {
    const log = console.log;
    const err = console.error;
    const warn = console.warn;
    console.log = (...args) => { append(args.map(String).join(' ') + '\n'); log.apply(console, args); };
    console.error = (...args) => { append('[err] ' + args.map(String).join(' ') + '\n'); err.apply(console, args); };
    console.warn = (...args) => { append('[warn] ' + args.map(String).join(' ') + '\n'); warn.apply(console, args); };
    return () => {
      console.log = log;
      console.error = err;
      console.warn = warn;
    };
  }

  function TestsPanel({ title = 'Run tests', runners = [] }) {
    const [output, setOutput] = React.useState('');
    const [status, setStatus] = React.useState('idle'); // idle | running | ok | err
    const [active, setActive] = React.useState(null);

    const run = React.useCallback(async (runner) => {
      setActive(runner.label);
      setStatus('running');
      setOutput('');
      const restore = captureConsole((chunk) => setOutput((prev) => prev + chunk));
      try {
        const result = await runner.run();
        if (typeof result === 'string') setOutput((prev) => prev + result + '\n');
        setStatus('ok');
      } catch (e) {
        setOutput((prev) => prev + `\n[fatal] ${e?.message || e}\n`);
        setStatus('err');
      } finally {
        restore();
        setActive(null);
      }
    }, []);

    return (
      <details className="tests-panel">
        <summary>{title}</summary>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          {runners.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => run(r)}
              disabled={status === 'running'}
              className={active === r.label ? 'active' : ''}
            >
              {r.label}
            </button>
          ))}
          {output ? (
            <button type="button" onClick={() => { setOutput(''); setStatus('idle'); }}>
              Clear
            </button>
          ) : null}
        </div>
        {status !== 'idle' ? (
          <p style={{ marginTop: '10px' }}>
            <strong>Status:</strong>{' '}
            {status === 'running' ? 'running…' : status === 'ok' ? 'finished' : 'errored'}
          </p>
        ) : null}
        {output ? <pre>{output}</pre> : null}
      </details>
    );
  }

  window.HumanLanguageApp.TestsPanel = TestsPanel;
})();
