import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import './SkillChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SkillChart({ journals }) {
  const chartData = useMemo(() => {
    if (!journals || journals.length === 0) return null;

    const sorted = [...journals].sort((a, b) => a.date.localeCompare(b.date));

    const labels = sorted.map(j => {
      const d = new Date(j.date + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Cumulative P&L
    let cumPnl = 0;
    const pnlData = sorted.map(j => {
      cumPnl += j.total_pnl;
      return cumPnl;
    });

    const scoreData = sorted.map(j => j.skill_score);

    return {
      labels,
      datasets: [
        {
          label: 'Cumulative P&L ($)',
          data: pnlData,
          borderColor: '#06d6a0',
          backgroundColor: 'rgba(6, 214, 160, 0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: pnlData.map(v => v >= 0 ? '#06d6a0' : '#ef476f'),
          pointBorderColor: 'transparent',
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Skill Score',
          data: scoreData,
          borderColor: '#7b2ff7',
          backgroundColor: 'rgba(123, 47, 247, 0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#7b2ff7',
          pointBorderColor: 'transparent',
          pointHoverRadius: 6,
          borderDash: [5, 3],
          tension: 0.35,
          fill: true,
          yAxisID: 'y1'
        }
      ]
    };
  }, [journals]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          pointStyleWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        padding: 12,
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.yAxisID === 'y') {
              return ` P&L: $${ctx.parsed.y.toFixed(2)}`;
            }
            return ` Score: ${ctx.parsed.y.toFixed(1)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        position: 'left',
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: '#06d6a0',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (v) => `$${v}`
        },
        title: {
          display: true,
          text: 'Cumulative P&L',
          color: '#06d6a0',
          font: { size: 11 }
        }
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        min: 0,
        max: 100,
        ticks: {
          color: '#7b2ff7',
          font: { family: 'JetBrains Mono', size: 11 }
        },
        title: {
          display: true,
          text: 'Skill Score',
          color: '#7b2ff7',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="card animate-in skill-chart-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📈</span> P&L vs Skill Score
        </span>
      </div>
      <div className="chart-container">
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="chart-empty">
            <span className="chart-empty-icon">📊</span>
            <p>No journal entries yet</p>
            <p className="text-muted">Upload your first screenshot to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
