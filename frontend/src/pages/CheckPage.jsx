import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Link2,
  Lock,
  LockKeyhole,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  WifiOff,
  Zap
} from 'lucide-react';
import { checkUrl } from '../api.js';
import Logo from '../components/Logo.jsx';
import ScoreChart from '../components/ScoreChart.jsx';

// Text under the title for each risk level. The level itself comes from the back end.
const LEVEL_TEXT = {
  High: 'This URL looks like a potential phishing website.',
  Medium: 'Be careful. Some parts of this URL look suspicious.',
  Low: 'This URL looks safe and legitimate.'
};

// Shown for a Low result with no warning signs. Each line is the opposite of a
// warning sign from the back end, so it is only true when none of them were found.
const SAFE_REASONS = [
  'No suspicious words like login or verify',
  'No unusual website ending (like .tk)',
  'No big brand name on a different website',
  'Normal URL length',
  'Uses a website name, not an IP address'
];

// example links the user can click to try the checker quickly
const EXAMPLES = ['paypal.com.secure-login.tk/verify', 'en.wikipedia.org/wiki/Phishing'];

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

  // goes back to the empty check screen
  function reset() {
    setUrl('');
    setResult(null);
    setInputError('');
    setServerError('');
  }

  // ---------- Screen 2: the result (like the High Risk and Low Risk screens in our prototype) ----------
  if (result) {
    const level = result.risk_level.toLowerCase();
    const signs = result.warning_signs;

    return (
      <section className="result-view">
        <div className="result-topbar">
          <button className="back-button" type="button" onClick={reset} aria-label="Back to check another link">
            <ArrowLeft size={22} />
          </button>
          <span className="mini-brand">
            Phish<span className="red">Fight</span>
          </span>
        </div>

        <section className={`result-card ${level}`} aria-labelledby="result-heading" aria-live="polite">
          {/* left side: icon, title and the score ring */}
          <div className="result-left">
            <div className="result-big-icon">
              {level === 'high' ? (
                <AlertTriangle size={34} />
              ) : level === 'medium' ? (
                <ShieldAlert size={34} />
              ) : (
                <CheckCircle2 size={34} />
              )}
            </div>
            <h2 id="result-heading">{result.risk_level} Risk</h2>
            <p className="result-text">{LEVEL_TEXT[result.risk_level]}</p>

            {/* The circle is 100 units long (r = 15.9155), so the coloured line is exactly the score. */}
            <div className="score-ring" role="img" aria-label={`Risk score ${result.score} out of 100`}>
              <svg viewBox="0 0 36 36">
                <circle className="ring-track" cx="18" cy="18" r="15.9155" />
                <circle className="ring-fill" cx="18" cy="18" r="15.9155" strokeDasharray={`${result.score} 100`} />
              </svg>
              <div className="ring-text">
                <strong>{result.score}%</strong>
                <span>Risk Score</span>
              </div>
            </div>
          </div>

          {/* right side: the reasons, the link details and the buttons */}
          <div className="result-right">
            <div className="signs-box">
              {signs.length > 0 ? (
                <>
                  <h3>
                    <AlertTriangle size={20} /> <span>Suspicious Features</span>
                  </h3>
                  <ul className="signs-list">
                    {signs.map((sign) => (
                      <li key={sign}>
                        <span className="sign-dot" />
                        {sign}
                      </li>
                    ))}
                  </ul>
                </>
              ) : level === 'low' ? (
                <>
                  <h3>
                    <ShieldCheck size={20} /> <span>Why it looks safe</span>
                  </h3>
                  <ul className="signs-list">
                    {SAFE_REASONS.map((reason) => (
                      <li key={reason}>
                        <CheckCircle2 size={18} />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h3>
                    <ShieldAlert size={20} /> <span>No clear warning signs</span>
                  </h3>
                  <p>
                    None of our warning signs were found, but the model still gave this link a
                    score of {result.score} because of other patterns, like its length and
                    numbers. Be careful with it.
                  </p>
                </>
              )}
            </div>

            {/* The checked link is shown as plain text, never as a clickable link. */}
            <dl className="link-info">
              <div>
                <dt>You checked</dt>
                <dd>
                  <code>{result.url}</code>
                </dd>
              </div>
              <div>
                <dt>Our model says</dt>
                <dd>
                  <strong>{result.label}</strong> ({Math.round(result.confidence * 100)}% confident)
                </dd>
              </div>
            </dl>

            <div className="result-buttons">
              <button className="result-button" type="button" onClick={reset}>
                <RotateCcw size={16} /> Check Another URL
              </button>
              <a className="result-button main" href="#learn-more">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* "Learn More" scrolls down to chart 1 */}
        <div id="learn-more">
          <ScoreChart score={result.score} />
        </div>

        <p className="caution-note">
          PhishFight only reads the text of the link, so a low score is not a promise. If you
          are not sure, do not enter passwords or card details, and go to the real website or
          app yourself.
        </p>
      </section>
    );
  }

  // ---------- Screen 1: check a link (like the home screen in our prototype) ----------
  return (
    <section className="home">
      <Logo size={96} big />
      <h1 className="home-title">
        Phish<span className="red">Fight</span>
      </h1>
      <p className="home-subtitle">Check if a website is safe or a potential phishing link</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={`url-box ${inputError ? 'input-error' : ''}`}>
          <Link2 size={20} aria-hidden="true" />
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (inputError) setInputError('');
            }}
            placeholder="Enter a URL (e.g. https://example.com)"
            aria-label="Website address"
            autoComplete="url"
            spellCheck="false"
            aria-invalid={inputError ? 'true' : 'false'}
          />
          {url && (
            <button className="clear-button" type="button" onClick={reset} aria-label="Clear URL">
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        {inputError && (
          <p className="field-error" role="alert">
            <AlertTriangle size={15} /> {inputError}
          </p>
        )}

        <div className="examples">
          <span>Try an example:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="example-chip"
              onClick={() => {
                setUrl(example);
                setInputError('');
              }}
            >
              {example}
            </button>
          ))}
        </div>

        <button className="analyze-button" type="submit" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> Analysing…
            </>
          ) : (
            <>
              Analyse URL <ChevronRight size={22} />
            </>
          )}
        </button>
      </form>

      {serverError && (
        <section className="error-card" role="alert">
          <WifiOff size={20} />
          <div>
            <h2>We could not check this link</h2>
            <p>{serverError}</p>
          </div>
        </section>
      )}

      <div className="feature-row">
        <div className="feature-tile">
          <Zap size={26} fill="currentColor" />
          Fast Analysis
        </div>
        <div className="feature-tile">
          <Lock size={26} />
          Works Offline
        </div>
        <div className="feature-tile">
          <ShieldHalf size={26} />
          Helps You Stay Safe
        </div>
      </div>

      <p className="home-note">
        <LockKeyhole size={15} /> PhishFight only reads the text of the link. It never opens
        the website.
      </p>
    </section>
  );
}

export default CheckPage;