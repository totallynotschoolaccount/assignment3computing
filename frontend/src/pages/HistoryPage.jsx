import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, WifiOff } from 'lucide-react';
import { clearHistory, getHistory } from '../api.js';

// Shows every link checked in this browser session.
function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadHistory() {
    setLoading(true);
    setError('');
    try {
      setItems(await getHistory());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // load the history once, when the page opens
  useEffect(() => {
    loadHistory();
  }, []);

  async function handleClear() {
    try {
      await clearHistory();
      setItems([]);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="page-heading">
        <span className="section-tag">THIS SESSION</span>
        <h1>Your checked links</h1>
        <p>Every link you checked in this browser tab. Closing the tab starts a new session.</p>
      </section>

      <div aria-live="polite">
        {loading && (
          <p className="status-message">
            <span className="spinner light" /> Loading your history…
          </p>
        )}

        {error && (
          <section className="error-card" role="alert">
            <WifiOff size={20} />
            <div>
              <h2>We could not load your history</h2>
              <p>{error}</p>
            </div>
          </section>
        )}

        {!loading && !error && items.length === 0 && (
          <section className="empty-card">
            <h2>No links checked yet</h2>
            <p>
              Links you check will show up here. <Link to="/">Check your first link</Link>.
            </p>
          </section>
        )}
      </div>

      {items.length > 0 && (
        <section className="history-card" aria-labelledby="history-list-heading">
          <div className="history-top">
            <h2 id="history-list-heading">
              {items.length} {items.length === 1 ? 'link' : 'links'} checked
            </h2>
            <button className="secondary-button" type="button" onClick={handleClear}>
              <Trash2 size={15} /> Clear history
            </button>
          </div>

          <ul className="history-list">
            {items.map((item) => (
              <li className="history-item" key={item.id}>
                <span className={`risk-badge ${item.risk_level.toLowerCase()}`}>
                  <span className="badge-dot" />
                  {item.risk_level}
                </span>
                {/* plain text, never a clickable link */}
                <code className="history-url">{item.url}</code>
                <span className="history-score">{item.score}/100</span>
                <span className="history-time">{item.checked_at.slice(11, 16)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default HistoryPage;