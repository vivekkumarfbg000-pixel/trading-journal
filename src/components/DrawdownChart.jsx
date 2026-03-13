import { useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function DrawdownChart({ journals }) {
  const chartData = useMemo(() => {
    if (!journals || journals.length < 2) return null;

    const sorted = [...journals].sort((a, b) => a.date.localeCompare(b.date));

    let cumPnl = 0, peak = 0;
    const labels = [];
    const drawdowns = [];
    const percentDrawdowns = [];

    sorted.forEach(j => {
      cumPnl += j.total_pnl || 0;
      if (cumPnl > peak) peak = cumPnl;
      const dd = peak - cumPnl;
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      
      const d = new Date(j.date + 'T00:00:00');
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      drawdowns.push(-dd);
      percentDrawdowns.push(-ddPct);
    });

    return {
      labels,
      datasets: [{
        label: 'Drawdown ($)',
        data: drawdowns,
        borderColor: '#ef476f',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(239, 71, 111, 0.1)';
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(239, 71, 111, 0.02)');
          gradient.addColorStop(1, 'rgba(239, 71, 111, 0.15)');
          return gradient;
        },
        fill: true,
        tension: 0.3,
        pointRadius: drawdowns.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      }]
    };
  }, [journals]);

  if (!chartData) return null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#ef476f',
        callbacks: {
          label: (ctx) => ` Drawdown: $${Math.abs(ctx.parsed.y).toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#ef476f',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (v) => `$${Math.abs(v).toFixed(0)}`
        }
      }
    }
  };

  return (
    <div className="card animate-in" style={{ marginTop: 'var(--space-lg)' }}>
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📉</span> Drawdown Over Time
        </span>
      </div>
      <div style={{ height: '280px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
