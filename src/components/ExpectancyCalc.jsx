import { useMemo } from 'react';
import './ExpectancyCalc.css';

export default function ExpectancyCalc({ journals }) {
  const calc = useMemo(() => {
    if (!journals || journals.length < 3) return null;

    const wins = journals.filter(j => j.total_pnl > 0);
    const losses = journals.filter(j => j.total_pnl <= 0);

    const winRate = wins.length / journals.length;
    const lossRate = 1 - winRate;
    const avgWin = wins.length > 0
      ? wins.reduce((s, j) => s + j.total_pnl, 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((s, j) => s + j.total_pnl, 0) / losses.length)
      : 0;

    // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

    // Kelly Criterion = (W × R - L) / R
    // where W = win rate, L = loss rate, R = win/loss ratio
    const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const kelly = avgLoss > 0
      ? ((winRate * rrRatio) - lossRate) / rrRatio
      : 0;
    const kellyPct = Math.max(kelly * 100, 0);
    // Use half-Kelly for safety
    const halfKelly = kellyPct / 2;

    return {
      expectancy,
      kellyPct,
      halfKelly,
      winRate: winRate * 100,
      avgWin,
      avgLoss,
      rrRatio,
      totalTrades: journals.length
    };
  }, [journals]);

  if (!calc) return null;

  return (
    <div className="card animate-in expectancy-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🧮</span> Expectancy & Kelly Criterion
        </span>
      </div>

      <div className="expectancy-main">
        <div className="expectancy-number">
          <div className={`expectancy-value ${calc.expectancy >= 0 ? 'text-green' : 'text-red'}`}>
            ${calc.expectancy.toFixed(2)}
          </div>
          <div className="expectancy-label">Expectancy Per Trade</div>
          <div className="expectancy-desc">
            {calc.expectancy >= 0
              ? 'Your system has a positive edge. Stay disciplined.'
              : 'Negative expectancy — review your strategy.'}
          </div>
        </div>

        <div className="expectancy-number">
          <div className="expectancy-value" style={{ color: 'var(--accent-cyan)' }}>
            {calc.halfKelly.toFixed(1)}%
          </div>
          <div className="expectancy-label">Half-Kelly Position Size</div>
          <div className="expectancy-desc">
            Optimal risk per trade is {calc.halfKelly.toFixed(1)}% of capital (conservative half-Kelly)
          </div>
        </div>
      </div>

      <div className="kelly-details">
        <div className="kelly-row">
          <span className="kelly-key">Win Rate</span>
          <span className={`kelly-val ${calc.winRate >= 50 ? 'text-green' : 'text-red'}`}>
            {calc.winRate.toFixed(1)}%
          </span>
        </div>
        <div className="kelly-row">
          <span className="kelly-key">Avg Win</span>
          <span className="kelly-val text-green">${calc.avgWin.toFixed(2)}</span>
        </div>
        <div className="kelly-row">
          <span className="kelly-key">Avg Loss</span>
          <span className="kelly-val text-red">${calc.avgLoss.toFixed(2)}</span>
        </div>
        <div className="kelly-row">
          <span className="kelly-key">Win/Loss Ratio</span>
          <span className="kelly-val text-cyan">{calc.rrRatio.toFixed(2)}</span>
        </div>
        <div className="kelly-row">
          <span className="kelly-key">Full Kelly %</span>
          <span className="kelly-val">{calc.kellyPct.toFixed(1)}%</span>
        </div>
        <div className="kelly-row">
          <span className="kelly-key">Sample Size</span>
          <span className="kelly-val">{calc.totalTrades} trades</span>
        </div>
      </div>
    </div>
  );
}
