import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import './RiskReward.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RiskReward({ journals, metrics }) {
  const chartData = useMemo(() => {
    if (!journals || journals.length === 0) return null;

    const sorted = [...journals]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15); // last 15 entries

    const labels = sorted.map(j => {
      const d = new Date(j.date + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Expected R:R (2.0)',
          data: sorted.map(() => 2.0),
          backgroundColor: 'rgba(67, 97, 238, 0.25)',
          borderColor: 'rgba(67, 97, 238, 0.5)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Actual R:R',
          data: sorted.map(j => j.risk_reward_ratio || 0),
          backgroundColor: sorted.map(j => {
            const rr = j.risk_reward_ratio || 0;
            if (rr >= 1.6 && rr <= 2.4) return 'rgba(6, 214, 160, 0.5)';
            return 'rgba(239, 71, 111, 0.5)';
          }),
          borderColor: sorted.map(j => {
            const rr = j.risk_reward_ratio || 0;
            if (rr >= 1.6 && rr <= 2.4) return 'rgba(6, 214, 160, 0.8)';
            return 'rgba(239, 71, 111, 0.8)';
          }),
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }, [journals]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        bodyFont: { family: 'JetBrains Mono', size: 12 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11 }
        },
        title: {
          display: true,
          text: 'Risk:Reward Ratio',
          color: '#94a3b8',
          font: { size: 11 }
        }
      }
    }
  };

  const expectedSum = metrics?.expected_rr_sum || 0;
  const actualSum = metrics?.actual_rr_sum || 0;

  return (
    <div className="card animate-in rr-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📐</span> Risk / Reward Tracking
        </span>
      </div>

      <div className="rr-stats">
        <div className="rr-stat">
          <span className="rr-stat-label">Expected Σ R:R</span>
          <span className="rr-stat-value mono text-blue">{expectedSum.toFixed(2)}</span>
        </div>
        <div className="rr-stat">
          <span className="rr-stat-label">Actual Σ R:R</span>
          <span className={`rr-stat-value mono ${actualSum >= expectedSum ? 'text-green' : 'text-red'}`}>
            {actualSum.toFixed(2)}
          </span>
        </div>
        <div className="rr-stat">
          <span className="rr-stat-label">Avg R:R</span>
          <span className="rr-stat-value mono text-cyan">{(metrics?.avg_risk_reward || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="rr-chart-container">
        {chartData ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="chart-empty">
            <span>📐</span>
            <p className="text-muted">Upload data to track R:R performance</p>
          </div>
        )}
      </div>
    </div>
  );
}
