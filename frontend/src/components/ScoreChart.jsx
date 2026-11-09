import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import '../chartSetup.js';

const SAFE_COLOUR = '#3987e5';
const MALICIOUS_COLOUR = '#d95926';

// Chart 1: where this link's score sits, compared with real safe and malicious links.
function ScoreChart({ score }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');

  // the score range this link is in, for example 34 is in range 3 (30-39)
  const yourRange = Math.min(Math.floor(score / 10), 9);
  const [selected, setSelected] = useState(yourRange);

  // load the counts from public/data, the same way as the Week 11 D3 demo
  useEffect(() => {
    fetch('/data/score_distribution.json')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load the chart data.');
        return response.json();
      })
      .then(setData)
      .catch((err) => setLoadError(err.message));
  }, []);

  if (loadError) return <p className="chart-note">{loadError}</p>;
  if (!data) return <p className="chart-note">Loading chart…</p>;

  // the bars in this link's range get a white outline
  const outline = data.ranges.map((_, i) => (i === yourRange ? '#ffffff' : 'transparent'));

  const chartData = {
    labels: data.ranges,
    datasets: [
      {
        label: 'Safe links',
        data: data.safe,
        backgroundColor: SAFE_COLOUR,
        borderColor: outline,
        borderWidth: 2,
        borderRadius: 4
      },
      {
        label: 'Malicious links',
        data: data.malicious,
        backgroundColor: MALICIOUS_COLOUR,
        borderColor: outline,
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'How 30,000 test links scored' },
      legend: { position: 'bottom' }
    },
    scales: {
      x: { title: { display: true, text: 'Risk score range' }, grid: { display: false } },
      y: { title: { display: true, text: 'Number of links' }, beginAtZero: true }
    },
    // clicking a range shows what it means below the chart
    onClick: (event, elements) => {
      if (elements.length > 0) setSelected(elements[0].index);
    }
  };

  const safe = data.safe[selected];
  const malicious = data.malicious[selected];
  const total = safe + malicious;
  const percent = total > 0 ? Math.round((malicious / total) * 100) : 0;

  return (
    <section className="chart-card" aria-labelledby="score-chart-heading">
      <h2 id="score-chart-heading">Your link compared with real links</h2>
      <p className="chart-help">
        Each pair of bars is a score range from our test set. Your link's range has a white
        outline. Click a range, or choose one below, to see what it means.
      </p>

      <div className="chart-box">
        <Bar
          data={chartData}
          options={options}
          role="img"
          aria-label="Bar chart of how many safe and malicious test links got each risk score range"
        />
      </div>

      <label className="chart-select">
        Score range
        <select value={selected} onChange={(event) => setSelected(Number(event.target.value))}>
          {data.ranges.map((range, i) => (
            <option key={range} value={i}>
              {range}
              {i === yourRange ? ' (your link)' : ''}
            </option>
          ))}
        </select>
      </label>

      <p className="chart-detail" aria-live="polite">
        In our test set, <strong>{safe.toLocaleString()} safe</strong> and{' '}
        <strong>{malicious.toLocaleString()} malicious</strong> links scored{' '}
        {data.ranges[selected]}. That means about <strong>{percent}%</strong> of links in this
        range were malicious.
      </p>
    </section>
  );
}

export default ScoreChart;