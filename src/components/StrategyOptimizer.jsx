import { useState, useEffect } from 'react';
import { getStrategyOptimization } from '../api';
import './StrategyOptimizer.css';

export default function StrategyOptimizer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const result = await getStrategyOptimization();
        setData(result);
      } catch (err) {
        console.error('Optimization fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTips();
  }, []);

  if (loading) return (
    <div className="card analyzer-loading">
      <div className="pulse-dot"></div>
      <p>Consulting Strategy Optimizer...</p>
    </div>
  );

  if (!data || data.message) return null;

  return (
    <div className="card strategy-optimizer-card animate-in">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🎯</span> AI Strategy Optimization
        </span>
      </div>

      <div className="optimizer-grid">
        <div className="optimizer-main">
          {data.recommendations?.map((rec, i) => (
            <div key={i} className={`rec-item ${rec.impact.toLowerCase()}`}>
              <div className="rec-header">
                <span className="rec-title">{rec.title}</span>
                <span className="impact-badge">{rec.impact} Impact</span>
              </div>
              <p className="rec-insight">{rec.insight}</p>
            </div>
          ))}
        </div>

        <div className="optimizer-sidebar">
          <div className="mini-stat">
            <label>Best Performing Ticker</label>
            <span className="text-green mono">{data.best_ticker}</span>
          </div>
          <div className="mini-stat">
            <label>Worst Performing Ticker</label>
            <span className="text-red mono">{data.worst_ticker}</span>
          </div>
          <div className="mini-stat">
            <label>Optimal Strategy</label>
            <span className="text-cyan">{data.ideal_strategy}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
