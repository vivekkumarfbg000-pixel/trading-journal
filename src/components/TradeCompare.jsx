import { useState } from 'react';
import './TradeCompare.css';

export default function TradeCompare({ journals }) {
  const [dayA, setDayA] = useState('');
  const [dayB, setDayB] = useState('');

  if (!journals || journals.length < 2) {
    return (
      <div className="card animate-in">
        <div className="compare-empty">
          <span style={{ fontSize: 36 }}>⚖️</span>
          <p>Need at least 2 trading days to compare.</p>
        </div>
      </div>
    );
  }

  const sorted = [...journals].sort((a, b) => b.date.localeCompare(a.date));
  const jA = sorted.find(j => j.date === dayA);
  const jB = sorted.find(j => j.date === dayB);

  const renderDay = (j) => {
    if (!j) return <div className="compare-day"><p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Select a day</p></div>;
    return (
      <div className="compare-day">
        <div className="compare-day-header">{new Date(j.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        <div className={`compare-day-pnl ${j.total_pnl >= 0 ? 'text-green' : 'text-red'}`}>
          ${j.total_pnl?.toFixed(2)}
        </div>
        <div className="compare-metrics">
          <div className="compare-metric-row">
            <span className="compare-metric-label">Trades</span>
            <span className="compare-metric-value">{j.num_trades}</span>
          </div>
          <div className="compare-metric-row">
            <span className="compare-metric-label">Strategy</span>
            <span className="compare-metric-value text-cyan">{j.strategy_used || 'N/A'}</span>
          </div>
          <div className="compare-metric-row">
            <span className="compare-metric-label">R:R Ratio</span>
            <span className="compare-metric-value">{j.risk_reward_ratio?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="compare-metric-row">
            <span className="compare-metric-label">Skill Score</span>
            <span className="compare-metric-value" style={{ color: 'var(--accent-purple)' }}>{j.skill_score?.toFixed(1)}</span>
          </div>
          <div className="compare-metric-row">
            <span className="compare-metric-label">Gambling</span>
            <span className={`compare-metric-value ${j.is_gambling ? 'text-red' : 'text-green'}`}>
              {j.is_gambling ? '🎰 Yes' : '✅ No'}
            </span>
          </div>
          <div className="compare-metric-row">
            <span className="compare-metric-label">Mood</span>
            <span className="compare-metric-value">{j.emotional_state || 'N/A'}</span>
          </div>
          <div className="compare-metric-row">
            <span className="compare-metric-label">Violations</span>
            <span className={`compare-metric-value ${(j.rule_violations?.length || 0) > 0 ? 'text-red' : 'text-green'}`}>
              {j.rule_violations?.length || 0}
            </span>
          </div>
          {j.tags?.length > 0 && (
            <div className="compare-metric-row">
              <span className="compare-metric-label">Tags</span>
              <span className="compare-metric-value">{j.tags.join(', ')}</span>
            </div>
          )}
          {j.diary_notes && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              📝 {j.diary_notes}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="compare-container animate-in">
      <div className="card">
        <div className="card-header">
          <span className="card-title"><span className="icon">⚖️</span> Trade Day Comparison</span>
        </div>

        <div className="compare-selectors">
          <div className="compare-select-box">
            <label>Day A</label>
            <select value={dayA} onChange={e => setDayA(e.target.value)}>
              <option value="">Select day...</option>
              {sorted.map(j => (
                <option key={j.date} value={j.date}>
                  {j.date} — ${j.total_pnl?.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <span className="compare-vs">VS</span>
          <div className="compare-select-box">
            <label>Day B</label>
            <select value={dayB} onChange={e => setDayB(e.target.value)}>
              <option value="">Select day...</option>
              {sorted.map(j => (
                <option key={j.date} value={j.date}>
                  {j.date} — ${j.total_pnl?.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="compare-grid">
          {renderDay(jA)}
          {renderDay(jB)}
        </div>
      </div>
    </div>
  );
}
