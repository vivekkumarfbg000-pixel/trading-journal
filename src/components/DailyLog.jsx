import { useState } from 'react';
import { deleteJournal } from '../api';
import './DailyLog.css';

export default function DailyLog({ journals, onRefresh, onEntryClick }) {
  const [expandedId, setExpandedId] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Delete this journal entry?')) return;
    try {
      await deleteJournal(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleRowClick = (journal) => {
    if (onEntryClick) {
      onEntryClick(journal);
    } else {
      setExpandedId(expandedId === journal.id ? null : journal.id);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="card animate-in daily-log-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📒</span> Daily Journal Log
        </span>
        <span className="log-count">{journals?.length || 0} entries</span>
      </div>

      {!journals || journals.length === 0 ? (
        <div className="log-empty">
          <span>📝</span>
          <p>No entries yet. Upload your first trading screenshot!</p>
        </div>
      ) : (
        <div className="log-table-wrapper">
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>P&L</th>
                <th>Trades</th>
                <th>Score</th>
                <th>R:R</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {journals.map(j => (
                <>
                  <tr
                    key={j.id}
                    className={`log-row ${j.is_gambling ? 'row-violation' : ''}`}
                    onClick={() => handleRowClick(j)}
                  >
                    <td className="mono">{formatDate(j.date)}</td>
                    <td className={`mono ${j.total_pnl >= 0 ? 'text-green' : 'text-red'}`}>
                      ${j.total_pnl?.toFixed(2)}
                      {j.tags?.length > 0 && (
                        <div className="row-tags-hint">
                          {j.tags[0]}{j.tags.length > 1 ? ` +${j.tags.length - 1}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="mono">{j.num_trades}</td>
                    <td className="mono text-cyan">{j.skill_score?.toFixed(1)}</td>
                    <td className="mono">{j.risk_reward_ratio?.toFixed(2)}</td>
                    <td>
                      {j.is_gambling ? (
                        <span className="status-badge badge-gambling">🎰 Gambling</span>
                      ) : (
                        <span className="status-badge badge-disciplined">✅ Clean</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={(e) => { e.stopPropagation(); handleDelete(j.id); }}
                        title="Delete entry"
                      >
                        ×
                      </button>
                    </td>
                  </tr>

                  {expandedId === j.id && (
                    <tr key={`${j.id}-detail`} className="detail-row">
                      <td colSpan="7">
                        <div className="detail-content">
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Strategy</span>
                              <span className="detail-value">{j.strategy_used}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Margin Used</span>
                              <span className="detail-value mono">${j.margin_used?.toFixed(2)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Capital Buffer</span>
                              <span className="detail-value mono">${j.capital_buffer?.toFixed(2)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Credit Received</span>
                              <span className="detail-value mono">${j.credit_received?.toFixed(2)}</span>
                            </div>
                          </div>

                          {j.rule_violations?.length > 0 && (
                            <div className="detail-violations">
                              <span className="detail-label">Violations</span>
                              <div className="violation-tags">
                                {j.rule_violations.map((v, i) => (
                                  <span key={i} className="violation-tag-small">🚨 {v}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {j.trades?.length > 0 && (
                            <div className="detail-trades">
                              <span className="detail-label">Individual Trades</span>
                              <table className="trades-mini-table">
                                <thead>
                                  <tr>
                                    <th>Ticker</th>
                                    <th>Type</th>
                                    <th>Short</th>
                                    <th>Long</th>
                                    <th>Credit</th>
                                    <th>Risk</th>
                                    <th>P&L</th>
                                    <th>Result</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {j.trades.map((t, i) => (
                                    <tr key={i}>
                                      <td className="mono text-cyan">{t.ticker}</td>
                                      <td>{t.option_type}</td>
                                      <td className="mono">{t.strike_short || '—'}</td>
                                      <td className="mono">{t.strike_long || '—'}</td>
                                      <td className="mono">${t.credit_received?.toFixed(2)}</td>
                                      <td className="mono">${t.max_risk?.toFixed(2)}</td>
                                      <td className={`mono ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                                        ${t.pnl?.toFixed(2)}
                                      </td>
                                      <td>{t.is_winner ? '✅' : '❌'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
