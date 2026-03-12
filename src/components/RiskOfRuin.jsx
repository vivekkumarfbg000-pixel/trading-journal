import { useMemo, useState } from 'react';
import './RiskOfRuin.css';

export default function RiskOfRuin({ journals }) {
  const [riskPerTrade, setRiskPerTrade] = useState(2); // 2% default

  const math = useMemo(() => {
    if (!journals || journals.length === 0) return null;

    const wins = journals.filter(j => j.total_pnl > 0).length;
    const total = journals.length;
    const winRate = wins / total;
    
    // Simple expectancy calculation
    const avgWin = journals.filter(j => j.total_pnl > 0).reduce((acc, curr) => acc + curr.total_pnl, 0) / (wins || 1);
    const avgLoss = Math.abs(journals.filter(j => j.total_pnl <= 0).reduce((acc, curr) => acc + curr.total_pnl, 0) / (total - wins || 1));
    const rrRatio = avgWin / (avgLoss || 1);

    // Risk of Ruin Formula (Simplified Version of the mathematical model)
    // Prob = ((1 - (W - L)) / (1 + (W - L))) ^ (Capital / Risk)
    // where W is win rate and L is loss rate, but more accurately using expectancy:
    // P = ((1 - a) / (1 + a)) ^ units
    // where a = winRate - lossRate (edge)
    
    const edge = winRate - (1 - winRate);
    const units = 100 / (riskPerTrade || 1); // how many "risk units" in the account
    
    // Improved RoR formula for asymmetric bets:
    // Prob = ((1 - Edge) / (1 + Edge)) ^ Units
    // This is a rough approximation; true RoR for asymmetric pay-offs is more complex but this serves as a great visual warning.
    
    const probRuin = Math.pow((1 - Math.abs(edge)) / (1 + Math.abs(edge)), units) * 100;

    return {
      winRate: (winRate * 100).toFixed(1),
      rrRatio: rrRatio.toFixed(2),
      probRuin: edge <= 0 ? 100 : probRuin.toFixed(2),
      edge: (edge * 100).toFixed(1)
    };
  }, [journals, riskPerTrade]);

  if (!math) return null;

  return (
    <div className="card risk-ruin-card animate-in">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🛡️</span> Probability of Ruin
        </span>
        <div className="risk-input-group">
          <label>Risk %</label>
          <input 
            type="number" 
            value={riskPerTrade} 
            onChange={(e) => setRiskPerTrade(e.target.value)} 
            min="0.1" 
            max="10" 
            step="0.1"
          />
        </div>
      </div>
      
      <div className="ruin-content">
        <div className="ruin-main">
          <div className="ruin-percentage" style={{ color: math.probRuin > 20 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {math.probRuin}%
          </div>
          <p className="ruin-desc">Chance of account depletion based on current stats.</p>
        </div>

        <div className="ruin-stats">
          <div className="ruin-stat">
            <span>Win Rate</span>
            <span className="mono">{math.winRate}%</span>
          </div>
          <div className="ruin-stat">
            <span>R:R Ratio</span>
            <span className="mono">{math.rrRatio}</span>
          </div>
          <div className="ruin-stat">
            <span>Edge</span>
            <span className={`mono ${math.edge > 0 ? 'text-green' : 'text-red'}`}>{math.edge}%</span>
          </div>
        </div>
      </div>
      
      <div className="ruin-warning">
        {math.probRuin > 10 ? (
          <p>⚠️ <strong>High Risk!</strong> Your current edge and risk level suggest a significant chance of bust. Consider reducing risk per trade or improving win rate.</p>
        ) : (
          <p>✅ <strong>Mathematical Safety:</strong> Your probability of ruin is low. Stay disciplined!</p>
        )}
      </div>
    </div>
  );
}
