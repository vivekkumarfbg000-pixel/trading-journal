import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './TradeDetailModal.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function TradeDetailModal({ journal, onClose, onUpdate }) {
  const [editingDiary, setEditingDiary] = useState(false);
  const [diaryText, setDiaryText] = useState(journal?.diary_notes || '');
  const [saving, setSaving] = useState(false);
  if (!journal) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const saveDiary = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/api/journals`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({ id: journal.id, diary_notes: diaryText })
      });
      if (res.ok) {
        setEditingDiary(false);
        if (onUpdate) onUpdate();
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
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

        <div className="modal-reflection card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="detail-label">Daily Reflection</span>
            {!editingDiary && (
              <button
                onClick={() => setEditingDiary(true)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text-muted)', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
              >✏️ Edit</button>
            )}
          </div>
          {editingDiary ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={diaryText}
                onChange={e => setDiaryText(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text-primary)', padding: 10, fontFamily: 'inherit', fontSize: '0.9rem', minHeight: 80, resize: 'vertical' }}
                placeholder="Write your reflection..."
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={saveDiary} disabled={saving} style={{ padding: '6px 16px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', border: 'none', borderRadius: 6, color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setEditingDiary(false); setDiaryText(journal.diary_notes || ''); }} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="reflection-text">"{journal.diary_notes || 'No notes yet — click Edit to add one.'}"</p>
          )}
        </div>

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
