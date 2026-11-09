import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Link2,
  LockKeyhole,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  WifiOff
} from 'lucide-react';
import { checkUrl } from '../api.js';
import ScoreChart from '../components/ScoreChart.jsx';
// Text for each risk level. The level itself comes from the back end.
const LEVEL_TEXT = {
  High: {
    title: 'This link looks risky',
    summary: 'Several URL patterns that are common in phishing links were found.'
  },
  Medium: {
    title: 'Take a closer look',
    summary: 'Some URL patterns need caution, but the signals are not conclusive.'
  },
  Low: {
    title: 'No major warning signs found',
    summary:
      'The URL has few of the patterns our model looks for. This does not guarantee the website is safe.'
  }
};

function validateUrl(raw) {
  // These checks are only to help the user. The back end checks everything again.
  const value = raw.trim();
  if (!value) return 'Paste a URL to check.';
  if (value.length > 2048) return 'That link is too long. Links can be up to 2048 characters.';
  if (/\s/.test(value)) {
    return 'That does not look like a URL. Remove spaces and try again.';
  }

  // If there is no protocol, add https:// so the browser can read it as a URL.
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Please enter a web URL beginning with http:// or https://.';
    }
    if (!parsed.hostname.includes('.')) {
      return 'Enter a complete URL, such as example.com/page.';
    }
  } catch {
    return 'That does not look like a URL. Check the address and try again.';
  }

  return '';
}

function CheckPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [inputError, setInputError] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    // stop the browser from reloading the page
    event.preventDefault();

    const problem = validateUrl(url);
    setInputError(problem);
    setServerError('');
    setResult(null);
    if (problem) return;

    setBusy(true);
    try {
      const data = await checkUrl(url.trim());
      setResult(data);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setUrl('');
    setResult(null);
    setInputError('');
    setServerError('');
  }

  // one style name for the card, icon, bar and badge
  const resultClass = result ? result.risk_level.toLowerCase() : '';
  const text = result ? LEVEL_TEXT[result.risk_level] : null;

  return (
    <>
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
          <div className={`url-input-wrap ${inputError ? 'input-error' : ''}`}>
            <Link2 size={19} aria-hidden="true" />
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="https://example.com/account"
              autoComplete="url"
              spellCheck="false"
              aria-invalid={inputError ? 'true' : 'false'}
              aria-describedby={inputError ? 'url-error' : 'input-help'}
            />
            {url && (
              <button className="clear-button" type="button" onClick={reset} aria-label="Clear URL">
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {inputError ? (
            <p id="url-error" className="field-error" role="alert">
              <AlertTriangle size={15} />
              {inputError}
            </p>
          ) : (
            <p id="input-help" className="field-help">
              Tip: You can paste a link from an SMS, email or social message.
            </p>
          )}

          <button className="analyze-button" type="submit" disabled={busy}>
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
            <strong>Your safety matters.</strong> PhishFight only reads the text of the
            link. It never opens the website.
          </span>
        </div>
      </section>

      {/* Loading, error and result states. aria-live reads changes out to screen readers. */}
      <div aria-live="polite">
        {busy && (
          <p className="status-message">
            <span className="spinner light" /> Checking the link with our model…
          </p>
        )}

        {serverError && (
          <section className="error-card" role="alert">
            <WifiOff size={20} />
            <div>
              <h2>We could not check this link</h2>
              <p>{serverError}</p>
            </div>
          </section>
        )}

        {result && (
          <section className={`result-card ${resultClass}`} aria-labelledby="result-heading">
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
                  <h2 id="result-heading">{text.title}</h2>
                </div>
              </div>
              <button className="icon-button" onClick={reset} type="button" aria-label="Start a new check">
                <RotateCcw size={17} />
              </button>
            </div>

            {/* The checked link is shown as plain text, never as a clickable link. */}
            <p className="checked-url">
              You checked: <code>{result.url}</code>
            </p>

            <p className="verdict">
              Our model says <strong>{result.label}</strong>, and it is{' '}
              <strong>{Math.round(result.confidence * 100)}% confident</strong>.
            </p>

            <p className="result-summary">{text.summary}</p>

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
                {result.risk_level} risk
              </span>
            </div>

            <div className="score-track" role="img" aria-label={`Risk score ${result.score} out of 100`}>
              <div className={`score-fill ${resultClass}`} style={{ width: `${result.score}%` }} />
            </div>
            <div className="scale-labels">
              <span>Lower risk</span>
              <span>Higher risk</span>
            </div>

            <div className="warning-section">
              <h3>{result.warning_signs.length ? 'What to look out for' : 'What this means'}</h3>
              {result.warning_signs.length ? (
                result.warning_signs.map((sign) => (
                  <div className="warning-item" key={sign}>
                    <span className="warning-icon">
                      <AlertTriangle size={17} />
                    </span>
                    <strong>{sign}</strong>
                  </div>
                ))
              ) : (
                <div className="clear-result">
                  <CheckCircle2 size={18} />
                  <p>
                    No clear warning signs were found in the link text. Checks like this
                    can miss harmful links, including real websites that have been hacked.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

       {/* Chart 1, shown under the result */}
      {result && <ScoreChart score={result.score} />}

      <section className="how-section" id="how-it-works">
        
        <div className="section-intro">
          <span className="section-tag">THE PROCESS</span>
          <h2>Safer decisions start with context.</h2>
          <p>PhishFight is designed to make technical signals easier to understand.</p>
        </div>
        <div className="process-grid">
          <article className="process-card">
            <span className="process-number">01</span>
            <div className="process-icon">
              <Link2 size={20} />
            </div>
            <h3>Paste the link</h3>
            <p>Enter the URL you received. You do not need to open the website first.</p>
          </article>
          <article className="process-card">
            <span className="process-number">02</span>
            <div className="process-icon">
              <ScanSearch size={20} />
            </div>
            <h3>Review URL signals</h3>
            <p>
              Our model looks at 20 patterns in the URL text, such as its length, its
              website ending and suspicious words.
            </p>
          </article>
          <article className="process-card">
            <span className="process-number">03</span>
            <div className="process-icon">
              <ShieldCheck size={20} />
            </div>
            <h3>Understand the risk</h3>
            <p>
              See a risk score, risk level and plain-language reasons to help decide what
              to do next.
            </p>
          </article>
        </div>
      </section>

      <section className="caution-banner">
        <div className="caution-icon">
          <CircleHelp size={22} />
        </div>
        <div>
          <h3>Remember: a low score is not a guarantee.</h3>
          <p>
            This tool only examines URL text. A legitimate website can be compromised, and
            a malicious URL can look ordinary. When unsure, avoid entering passwords or
            payment details and verify through the organisation’s official app or website.
          </p>
        </div>
      </section>
    </>
  );
}

export default CheckPage;