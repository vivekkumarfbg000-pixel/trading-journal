import './TradeDetailModal.css';

export default function TradeDetailModal({ journal, onClose }) {
  if (!journal) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Trade Details — {formatDate(journal.date)}</h2>
            <p className={`modal-subtitle ${journal.total_pnl >= 0 ? 'text-green' : 'text-red'}`}>
              Total P&L: ${journal.total_pnl?.toFixed(2)}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-top-grid">
            <div className="modal-metric">
              <span className="label">Strategy</span>
              <span className="value">{journal.strategy_used}</span>
            </div>
            <div className="modal-metric">
              <span className="label">Trades</span>
              <span className="value">{journal.num_trades}</span>
            </div>
            <div className="modal-metric">
              <span className="label">Skill Score</span>
              <span className="value text-cyan">{journal.skill_score?.toFixed(1)}</span>
            </div>
            <div className="modal-metric">
              <span className="label">R:R</span>
              <span className="value">{journal.risk_reward_ratio?.toFixed(2)}</span>
            </div>
          </div>

          {journal.tags?.length > 0 && (
            <div className="modal-tags">
              {journal.tags.map((tag, i) => (
                <span key={i} className="tag-pill">🏷️ {tag}</span>
              ))}
            </div>
          )}

        {journal.diary_notes && (
          <div className="modal-reflection card">
            <span className="detail-label">Daily Reflection</span>
            <p className="reflection-text">"{journal.diary_notes}"</p>
          </div>
        )}

          <div className="detail-sections">
            <div className="section">
              <h3>📸 Screenshot Analysis</h3>
              {journal.screenshot_path ? (
                <div className="screenshot-container">
                  <img src={journal.screenshot_path} alt="Trading Screenshot" />
                  <a href={journal.screenshot_path} target="_blank" rel="noreferrer" className="view-full">View Full Resolution</a>
                </div>
              ) : (
                <div className="no-screenshot">No screenshot available for this entry.</div>
              )}
            </div>

            <div className="section">
              <h3>⚠️ Rules & Violations</h3>
              <div className="status-indicator">
                {journal.is_gambling ? (
                  <div className="violation-box active">
                    <span className="icon">🎰</span>
                    <div className="text">
                      <strong>Gambling Detected</strong>
                      <p>Multiple rules were violated. Discipline score reduced.</p>
                    </div>
                  </div>
                ) : (
                  <div className="violation-box clean">
                    <span className="icon">✅</span>
                    <div className="text">
                      <strong>Disciplined Trading</strong>
                      <p>All safety rules followed. Consistent execution.</p>
                    </div>
                  </div>
                )}
              </div>
              {journal.rule_violations?.length > 0 && (
                <ul className="violations-list">
                  {journal.rule_violations.map((v, i) => (
                    <li key={i}>🚨 {v}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {journal.trades?.length > 0 && (
            <div className="section">
              <h3>📝 Individual Trades</h3>
              <div className="modal-table-wrapper">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Type</th>
                      <th>Credit</th>
                      <th>Risk</th>
                      <th>P&L</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journal.trades.map((t, i) => (
                      <tr key={i}>
                        <td className="mono text-cyan">{t.ticker}</td>
                        <td>{t.option_type}</td>
                        <td className="mono">${t.credit_received?.toFixed(2)}</td>
                        <td className="mono">${t.max_risk?.toFixed(2)}</td>
                        <td className={`mono ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                          ${t.pnl?.toFixed(2)}
                        </td>
                        <td>{t.is_winner ? '🏆 Win' : '❌ Loss'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
