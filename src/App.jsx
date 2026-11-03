import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Info,
  Link2,
  LockKeyhole,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

// The scores are placeholders, not real predictions from a trained security model. (Waiting for a model API to be available.)
const DEMO_RESULTS = {
  high: {
    score: 97,
    level: 'High risk',
    title: 'This link looks risky',
    summary: 'Several URL patterns commonly associated with malicious links were detected.',
    signs: [
      ['Scam-like domain ending', 'The address uses an unusual domain ending.'],
      ['Brand name may be misleading', 'A brand-like name appears outside its expected main domain.'],
      [
        'Urgent sign-in wording',
        'Words such as “secure”, “login” or “verify” can be used to pressure people.'
      ]
    ]
  },
  low: {
    score: 9,
    level: 'Low risk',
    title: 'No major URL warning signs found',
    summary:
      'The URL has few of the patterns this model looks for. This does not guarantee the website is safe.',
    signs: []
  },
  medium: {
    score: 42,
    level: 'Medium risk',
    title: 'Take a closer look',
    summary:
      'Some URL patterns deserve caution, but the available signals are not conclusive.',
    signs: [
      [
        'Bare domain',
        'A domain without a path can occur in both legitimate and malicious links.'
      ]
    ]
  }
};

function validateUrl(raw) {
  // Trim surrounding whitespace, but reject spaces inside the address because
  // they usually mean the pasted text is not a single valid URL.
  const value = raw.trim();
  if (!value) return 'Paste a URL to check.';
  if (/\s/.test(value)) {
    return 'That does not look like a URL. Remove spaces and try again.';
  }

  // A URL may include a protocol such as https://. If it does not, assume HTTPS
  // so users can enter a simple domain like example.com.
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    // The browser's URL parser checks the address structure and exposes parts
    // such as its hostname and protocol for the checks below.
    const parsed = new URL(candidate);

    // Require a dotted hostname (or localhost) and only allow web protocols.
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return 'Enter a complete URL, such as example.com/page.';
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Please enter a web URL beginning with http:// or https://.';
    }
  } catch {
    // URL throws when it cannot parse the supplied text.
    return 'That does not look like a URL. Check the address and try again.';
  }

  return '';
}

function demoResult(raw) { //Delete later when the model API is available.
  const value = raw.toLowerCase();

  // Match a few sample patterns to show the high-risk example in the interface.
  if (
    value.includes('paypal.com.') ||
    value.includes('secure-login') ||
    value.includes('.xyz') ||
    value.includes('.tk') ||
    value.includes('.exe') ||
    /^\d{1,3}(\.\d{1,3}){3}/.test(value)
  ) {
    return DEMO_RESULTS.high;
  }

  // These familiar domains are only recognized to demonstrate a low-risk result.
  if (
    value.includes('google.com') ||
    value.includes('wikipedia.org') ||
    value.includes('auspost.com.au')
  ) {
    return DEMO_RESULTS.low;
  }

  // Anything not covered by the examples receives the generic caution result.
  return DEMO_RESULTS.medium;
}

function App() {
  // React state stores values that change while the person uses the page.
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleSubmit(event) {
    // Prevent the browser's default form submission, which would reload the page.
    event.preventDefault();

    // Validate before showing a result. An error message is an empty string when
    // the input is valid, so it can also control whether the error is displayed.
    const validation = validateUrl(url);
    setError(validation);
    setResult(null);
    if (validation) return;

    // The timeout mimics a short network request so the loading state is visible.
    // Replace this block with a real API request when the prediction service exists.
    setBusy(true);
    window.setTimeout(() => {
      setResult(demoResult(url.trim()));
      setBusy(false);
    }, 350);
  }

  function reset() {
    // Clear all user-facing checker state to prepare for another URL.
    setUrl('');
    setResult(null);
    setError('');
  }

  // Convert the numeric score into one shared style name for the card, icon,
  // progress bar, and badge. Keep these cutoffs consistent across the display.
  const resultClass =
    result?.score >= 60 ? 'high' : result?.score >= 30 ? 'medium' : 'low';

  return (
    <div className="app-shell">
      {/* Header: the brand links home, while the other link jumps to the guide. */}
      <header className="topbar">
        <a className="brand" href="#home" aria-label="PhishFight home">
          <span className="brand-mark">
            <ShieldCheck size={23} strokeWidth={2.3} />
          </span>
          <span>
            Phish<span>Fight</span>
            <small>URL RISK CHECK</small>
          </span>
        </a>
        <div className="topbar-right">
          <span className="privacy-pill">
            <LockKeyhole size={14} /> URL text only
          </span>
          <a className="header-link" href="#how-it-works">
            How it works <ArrowRight size={14} />
          </a>
        </div>
      </header>

      <main id="home">
        {/* Introductory copy explains the tool before the person uses the form. */}
        <section className="hero">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> A calmer way to check a link
          </div>
          <h1>
            Pause before you <span>click.</span>
          </h1>
          <p className="hero-copy">
            Paste a link you’re unsure about. PhishFight checks its URL patterns
            and explains potential warning signs in plain English.
          </p>
        </section>

        {/* The form handles the URL input, validation feedback, and submit action. */}
        <section className="checker-card" aria-labelledby="checker-heading">
          <div className="card-heading">
            <div className="heading-icon">
              <ScanSearch size={21} />
            </div>
            <div>
              <h2 id="checker-heading">Check a URL</h2>
              <p>Enter the full link or just the domain name.</p>
            </div>
            <span className="step-label">
              01 <span>/ CHECK</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="input-label" htmlFor="url-input">
              Website address
            </label>
            <div className={`url-input-wrap ${error ? 'input-error' : ''}`}>
              <Link2 size={19} aria-hidden="true" />
              <input
                id="url-input"
                type="text"
                value={url}
                // Editing the field clears an old error so it does not look current.
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (error) setError('');
                }}
                placeholder="https://example.com/account"
                autoComplete="url"
                spellCheck="false"
                aria-describedby={error ? 'url-error' : 'input-help'}
              />
              {url && (
                <button
                  className="clear-button"
                  type="button"
                  onClick={reset}
                  aria-label="Clear URL"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>

            {/* Show either an accessible error or a helpful input tip, not both. */}
            {error ? (
              <p id="url-error" className="field-error" role="alert">
                <AlertTriangle size={15} />
                {error}
              </p>
            ) : (
              <p id="input-help" className="field-help">
                Tip: You can paste a link from an SMS, email or social message.
              </p>
            )}

            <button
              className="analyze-button"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="spinner" /> Checking URL…
                </>
              ) : (
                <>
                  Check this link <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="privacy-note">
            <LockKeyhole size={15} />
            <span>
              <strong>Your safety matters.</strong> This prototype analyses only
              the text you enter. It does not open the destination website.
            </span>
          </div>
        </section>

        {/* Render result details only after a valid URL has been submitted. */}
        {result && (
          <section
            className={`result-card ${resultClass}`}
            aria-live="polite"
            aria-labelledby="result-heading"
          >
            <div className="result-top">
              <div className="result-status">
                <div className="result-icon">
                  {resultClass === 'high' ? (
                    <ShieldAlert size={24} />
                  ) : resultClass === 'medium' ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <ShieldCheck size={24} />
                  )}
                </div>
                <div>
                  <span className="result-kicker">URL CHECK RESULT</span>
                  <h2 id="result-heading">{result.title}</h2>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={reset}
                type="button"
                aria-label="Start a new check"
              >
                <RotateCcw size={17} />
              </button>
            </div>

            <p className="result-summary">{result.summary}</p>
            <div className="score-row">
              <div>
                <span className="metric-label">URL risk score</span>
                <div className="score-number">
                  {result.score}
                  <span>/100</span>
                </div>
              </div>
              <span className={`risk-badge ${resultClass}`}>
                <span className="badge-dot" />
                {result.level}
              </span>
            </div>

            {/* The bar width is the score as a percentage of the 0–100 scale. */}
            <div
              className="score-track"
              role="img"
              aria-label={`Demo risk score ${result.score} out of 100`}
            >
              <div
                className={`score-fill ${resultClass}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <div className="scale-labels">
              <span>Lower risk</span>
              <span>Higher risk</span>
            </div>

            {/* List sample warning signs, or explain why no signs are shown. */}
            <div className="warning-section">
              <h3>
                {result.signs.length ? 'What to look out for' : 'What this means'}
              </h3>
              {result.signs.length ? (
                result.signs.map(([title, description]) => (
                  <div className="warning-item" key={title}>
                    <span className="warning-icon">
                      <AlertTriangle size={17} />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="clear-result">
                  <CheckCircle2 size={18} />
                  <p>
                    No major URL warning signs were detected by this demo. Risk
                    checks can miss harmful links, including compromised
                    legitimate websites.
                  </p>
                </div>
              )}
            </div>

            <div className="result-footer">
              <Info size={15} />
              <span>
                Demonstration result only — connect your trained PhishFight
                model before relying on these scores.
              </span>
            </div>
          </section>
        )}

        {/* Static steps describe the intended workflow, not a live model process. */}
        <section className="how-section" id="how-it-works">
          <div className="section-intro">
            <span className="section-tag">THE PROCESS</span>
            <h2>Safer decisions start with context.</h2>
            <p>
              PhishFight is designed to make technical signals easier to
              understand.
            </p>
          </div>
          <div className="process-grid">
            <article className="process-card">
              <span className="process-number">01</span>
              <div className="process-icon">
                <Link2 size={20} />
              </div>
              <h3>Paste the link</h3>
              <p>
                Enter the URL you received. You do not need to open the website
                first.
              </p>
            </article>
            <article className="process-card">
              <span className="process-number">02</span>
              <div className="process-icon">
                <ScanSearch size={20} />
              </div>
              <h3>Review URL signals</h3>
              <p>
                The model examines URL text patterns such as length, parameters
                and suspicious wording.
              </p>
            </article>
            <article className="process-card">
              <span className="process-number">03</span>
              <div className="process-icon">
                <ShieldCheck size={20} />
              </div>
              <h3>Understand the risk</h3>
              <p>
                See a risk score, risk level and plain-language reasons to help
                decide what to do next.
              </p>
            </article>
          </div>
        </section>

        {/* A low demo score is not proof that a website or link is safe. */}
        <section className="caution-banner">
          <div className="caution-icon">
            <CircleHelp size={22} />
          </div>
          <div>
            <h3>Remember: a low score is not a guarantee.</h3>
            <p>
              This tool only examines URL text. A legitimate website can be
              compromised, and a malicious URL can look ordinary. When unsure,
              avoid entering passwords or payment details and verify through the
              organisation’s official app or website.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="#home">
          <ShieldCheck size={18} /> PhishFight
        </a>
      </footer>
    </div>
  );
}

export default App;
