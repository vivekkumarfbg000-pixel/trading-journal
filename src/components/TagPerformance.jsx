import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TagPerformance({ journals }) {
  const data = useMemo(() => {
    const tagStats = {};

    journals.forEach(j => {
      (j.tags || []).forEach(tag => {
        if (!tagStats[tag]) {
          tagStats[tag] = { pnl: 0, count: 0 };
        }
        tagStats[tag].pnl += j.total_pnl;
        tagStats[tag].count += 1;
      });
    });

    const labels = Object.keys(tagStats).sort((a, b) => tagStats[b].pnl - tagStats[a].pnl);
    const pnlData = labels.map(l => tagStats[l].pnl);

    return {
      labels,
      datasets: [
        {
          label: 'Total P&L by Tag',
          data: pnlData,
          backgroundColor: pnlData.map(v => v >= 0 ? 'rgba(6, 214, 160, 0.6)' : 'rgba(239, 71, 111, 0.6)'),
          borderColor: pnlData.map(v => v >= 0 ? '#06d6a0' : '#ef476f'),
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }, [journals]);

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        callbacks: {
          label: (ctx) => ` $${ctx.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#f1f5f9' }
      }
    }
  };

  if (data.labels.length === 0) return null;

  return (
    <div className="card animate-in tag-performance-card" style={{ marginTop: 'var(--space-lg)' }}>
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🏷️</span> Performance by Tag
        </span>
      </div>
      <div style={{ height: '300px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
