import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, WifiOff } from 'lucide-react';
import { clearHistory, getHistory } from '../api.js';
import HistoryChart, { LEVEL_COLOURS } from '../components/HistoryChart.jsx';

const FILTERS = [
  { level: 'All', text: 'All links' },
  { level: 'High', text: 'High risk (60-100)' },
  { level: 'Medium', text: 'Medium risk (30-59)' },
  { level: 'Low', text: 'Low risk (0-29)' }
];

// Shows every link checked in this browser session.
function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

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
      setSelectedId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  // number the links in the order they were checked, then apply the filter
  const numbered = items.map((item, i) => ({ ...item, number: i + 1 }));
  const shown = filter === 'All' ? numbered : numbered.filter((item) => item.risk_level === filter);
  const selected = numbered.find((item) => item.id === selectedId);

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

          {/* these buttons filter the chart and the list, and show what each colour means */}
          <div className="filter-row" role="group" aria-label="Filter by risk level">
            {FILTERS.map((f) => (
              <button
                key={f.level}
                type="button"
                className={`filter-chip ${filter === f.level ? 'active' : ''}`}
                aria-pressed={filter === f.level}
                onClick={() => setFilter(f.level)}
              >
                {f.level !== 'All' && (
                  <span className="chip-dot" style={{ background: LEVEL_COLOURS[f.level] }} />
                )}
                {f.text}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="chart-note">No links in this group yet.</p>
          ) : (
            <HistoryChart items={shown} selectedId={selectedId} onSelect={setSelectedId} />
          )}

          <div className="detail-box" aria-live="polite">
            {selected ? (
              <p>
                <strong>#{selected.number}</strong> <code>{selected.url}</code>
                <br />
                {selected.risk_level} risk, score {selected.score}/100. Our model said{' '}
                <strong>{selected.label}</strong> ({Math.round(selected.confidence * 100)}%
                confident), checked at {selected.checked_at.slice(11, 16)}.
              </p>
            ) : (
              <p>Click a bar, or a link in the list, to see its details.</p>
            )}
          </div>

          <ul className="history-list">
            {shown.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`history-item ${item.id === selectedId ? 'selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={`risk-badge ${item.risk_level.toLowerCase()}`}>
                    <span className="badge-dot" />
                    {item.risk_level}
                  </span>
                  {/* plain text, never a clickable link */}
                  <code className="history-url">
                    #{item.number} {item.url}
                  </code>
                  <span className="history-score">{item.score}/100</span>
                  <span className="history-time">{item.checked_at.slice(11, 16)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default HistoryPage;