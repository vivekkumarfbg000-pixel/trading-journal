import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EquityCurve({ journals }) {
  const data = useMemo(() => {
    const sortedJournals = [...(journals || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let cumulativePnl = 0;
    const labels = [];
    const points = [];

    // Starting point
    labels.push('Start');
    points.push(0);

    sortedJournals.forEach(j => {
      cumulativePnl += (j.total_pnl || 0);
      labels.push(new Date(j.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      points.push(cumulativePnl);
    });

    const isProfit = cumulativePnl >= 0;
    const accentColor = isProfit ? '#06d6a0' : '#ef476f';
    const gradientColor = isProfit ? 'rgba(6, 214, 160, 0.1)' : 'rgba(239, 71, 111, 0.1)';

    return {
      labels,
      datasets: [
        {
          label: 'Cumulative P&L',
          data: points,
          borderColor: accentColor,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, gradientColor);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: points.length > 50 ? 0 : 4,
          pointHoverRadius: 6,
          borderWidth: 3,
        }
      ]
    };
  }, [journals]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` P&L: $${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { 
          color: '#64748b', 
          font: { size: 10 },
          callback: (value) => `$${value}`
        }
      }
    }
  };

  return (
    <div className="card animate-in equity-curve-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📈</span> Equity Curve (Cumulative P&L)
        </span>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
