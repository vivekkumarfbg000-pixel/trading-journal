import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './AIChecklist.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function AIChecklist() {
  const [items, setItems] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChecklist = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/api/checklist`, {
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        }
      });
      if (!res.ok) throw new Error('Failed to load checklist');
      const data = await res.json();
      setItems(data.checklist || []);
      setChecked(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChecklist(); }, []);

  const toggleItem = (idx) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="card animate-in checklist-card">
        <div className="card-header">
          <span className="card-title"><span className="icon">✅</span> Pre-Trade Checklist</span>
        </div>
        <div className="checklist-loading">
          <div className="spinner" style={{ width: 24, height: 24 }}></div>
          AI is analyzing your recent patterns...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card animate-in checklist-card">
        <div className="card-header">
          <span className="card-title"><span className="icon">✅</span> Pre-Trade Checklist</span>
        </div>
        <p style={{ padding: 'var(--space-md)', color: 'var(--text-muted)' }}>⚠️ {error}</p>
        <button className="btn-refresh-checklist" onClick={fetchChecklist} style={{ margin: '0 var(--space-md) var(--space-md)' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="card animate-in checklist-card">
      <div className="card-header">
        <span className="card-title"><span className="icon">✅</span> Today's Pre-Trade Checklist</span>
      </div>

      <div className="checklist-items">
        {items.map((item, i) => (
          <div
            key={i}
            className={`checklist-item ${checked.has(i) ? 'checked' : ''}`}
            onClick={() => toggleItem(i)}
          >
            <div className="checklist-checkbox">
              {checked.has(i) ? '✓' : ''}
            </div>
            <span className="checklist-text">{item.text}</span>
            <span className={`priority-badge ${item.priority}`}>{item.priority}</span>
          </div>
        ))}
      </div>

      <div className="checklist-footer">
        <span className="checklist-progress">
          {checked.size}/{items.length} completed
        </span>
        <button className="btn-refresh-checklist" onClick={fetchChecklist}>🔄 Refresh</button>
      </div>
    </div>
  );
}
