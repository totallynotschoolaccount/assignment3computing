import { Bar } from 'react-chartjs-2';
import '../chartSetup.js';

// the same colours as the risk badges
export const LEVEL_COLOURS = { Low: '#22c55e', Medium: '#f5a524', High: '#ef4444' };

// Chart 2: compares every link checked in this session.
function HistoryChart({ items, selectedId, onSelect }) {
  const chartData = {
    labels: items.map((item) => `#${item.number}`),
    datasets: [
      {
        label: 'Risk score',
        data: items.map((item) => item.score),
        backgroundColor: items.map((item) => LEVEL_COLOURS[item.risk_level]),
        // the selected link gets a white outline
        borderColor: items.map((item) => (item.id === selectedId ? '#ffffff' : 'transparent')),
        borderWidth: 2,
        borderRadius: 6,
        maxBarThickness: 56
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Risk score of each link you checked' },
      // the filter buttons above the chart work as the legend
      legend: { display: false }
    },
    scales: {
      x: {
        title: { display: true, text: 'Links in the order you checked them' },
        grid: { display: false },
        ticks: { maxRotation: 0, minRotation: 0 }
      },
      y: { min: 0, max: 100, title: { display: true, text: 'Risk score (0 to 100)' } }
    },
    // clicking a bar selects that link
    onClick: (event, elements) => {
      if (elements.length > 0) onSelect(items[elements[0].index].id);
    }
  };

  return (
    <div className="chart-box">
      <Bar
        data={chartData}
        options={options}
        role="img"
        aria-label="Bar chart of the risk score of each link checked in this session"
      />
    </div>
  );
}

export default HistoryChart;