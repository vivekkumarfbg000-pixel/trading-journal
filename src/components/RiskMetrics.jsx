import { useMemo } from 'react';
import './RiskMetrics.css';

export default function RiskMetrics({ journals }) {
  const stats = useMemo(() => {
    if (!journals || journals.length === 0) return null;

    const sorted = [...journals].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let cumulativePnl = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let totalWin = 0;
    let totalLoss = 0;
    let winCount = 0;

    sorted.forEach(j => {
      cumulativePnl += j.total_pnl;
      if (cumulativePnl > peak) peak = cumulativePnl;
      const dd = peak - cumulativePnl;
      if (dd > maxDrawdown) maxDrawdown = dd;

      if (j.total_pnl > 0) {
        totalWin += j.total_pnl;
        winCount++;
      } else {
        totalLoss += Math.abs(j.total_pnl);
      }
    });

    const profitFactor = totalLoss === 0 ? totalWin : (totalWin / totalLoss);
    const recoveryFactor = maxDrawdown === 0 ? cumulativePnl : (cumulativePnl / maxDrawdown);

    return {
      maxDrawdown,
      profitFactor: profitFactor.toFixed(2),
      recoveryFactor: recoveryFactor.toFixed(2),
      avgWin: (winCount === 0 ? 0 : totalWin / winCount).toFixed(2),
      avgLoss: ((sorted.length - winCount) === 0 ? 0 : totalLoss / (sorted.length - winCount)).toFixed(2)
    };
  }, [journals]);

  if (!stats) return null;

  return (
    <div className="risk-metrics-grid">
      <div className="risk-card card">
        <span className="risk-label">Max Drawdown</span>
        <span className="risk-value text-red">${stats.maxDrawdown.toFixed(2)}</span>
        <span className="risk-hint">Worst peak-to-trough drop</span>
      </div>
      <div className="risk-card card">
        <span className="risk-label">Profit Factor</span>
        <span className="risk-value text-cyan">{stats.profitFactor}</span>
        <span className="risk-hint">Gross Profit / Gross Loss</span>
      </div>
      <div className="risk-card card">
        <span className="risk-label">Recovery Factor</span>
        <span className="risk-value text-green">{stats.recoveryFactor}</span>
        <span className="risk-hint">Net Profit / Max Drawdown</span>
      </div>
      <div className="risk-card card">
        <span className="risk-label">Avg. Win/Loss</span>
        <span className="risk-value">
          <span className="text-green">${stats.avgWin}</span> / <span className="text-red">${stats.avgLoss}</span>
        </span>
        <span className="risk-hint">Expectancy per session</span>
      </div>
    </div>
  );
}
