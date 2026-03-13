import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Playbooks.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : ''
  };
}

const STRATEGIES = ['credit_spread', 'put_spread', 'call_spread', 'iron_condor', 'bull_put_spread', 'bear_call_spread', 'custom'];

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [checklistItem, setChecklistItem] = useState('');
  const [form, setForm] = useState({
    name: '', strategy_type: 'credit_spread',
    entry_rules: [], exit_rules: [],
    position_sizing: '', checklist: [],
    target_rr: 2.0, max_loss_per_day: 500
  });
  const [entryRule, setEntryRule] = useState('');
  const [exitRule, setExitRule] = useState('');

  const fetchPlaybooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/playbooks`, { headers: await getAuthHeaders() });
      if (res.ok) setPlaybooks(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlaybooks(); }, []);

  const handleSave = async () => {
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch(`${API_BASE}/api/playbooks`, {
        method,
        headers: await getAuthHeaders(),
        body: JSON.stringify(body)
      });
      if (res.ok) {
        resetForm();
        fetchPlaybooks();
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this playbook?')) return;
    await fetch(`${API_BASE}/api/playbooks?id=${id}`, {
      method: 'DELETE', headers: await getAuthHeaders()
    });
    fetchPlaybooks();
  };

  const handleEdit = (pb) => {
    setForm({
      name: pb.name, strategy_type: pb.strategy_type,
      entry_rules: pb.entry_rules || [], exit_rules: pb.exit_rules || [],
      position_sizing: pb.position_sizing || '', checklist: pb.checklist || [],
      target_rr: pb.target_rr, max_loss_per_day: pb.max_loss_per_day
    });
    setEditingId(pb.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: '', strategy_type: 'credit_spread', entry_rules: [], exit_rules: [], position_sizing: '', checklist: [], target_rr: 2.0, max_loss_per_day: 500 });
    setEditingId(null);
    setShowForm(false);
    setEntryRule('');
    setExitRule('');
    setChecklistItem('');
  };

  const addToList = (field, value, setter) => {
    if (!value.trim()) return;
    setForm(f => ({ ...f, [field]: [...f[field], value.trim()] }));
    setter('');
  };

  const removeFromList = (field, idx) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  };

  if (loading) return <div className="card animate-in"><div className="spinner" style={{ margin: '40px auto' }}></div></div>;

  return (
    <div className="playbooks-container animate-in">
      <div className="card">
        <div className="card-header playbooks-header">
          <span className="card-title"><span className="icon">📋</span> Trade Playbooks</span>
          {!showForm && (
            <button className="btn-new-playbook" onClick={() => setShowForm(true)}>+ New Playbook</button>
          )}
        </div>

        {showForm ? (
          <div className="playbook-form">
            <div className="pb-form-row">
              <div className="pb-field">
                <label>Playbook Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. SPY Credit Spread" />
              </div>
              <div className="pb-field">
                <label>Strategy Type</label>
                <select value={form.strategy_type} onChange={e => setForm(f => ({ ...f, strategy_type: e.target.value }))}>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>

            <div className="pb-form-row">
              <div className="pb-field">
                <label>Target R:R</label>
                <input type="number" step="0.1" value={form.target_rr} onChange={e => setForm(f => ({ ...f, target_rr: Number(e.target.value) }))} />
              </div>
              <div className="pb-field">
                <label>Max Loss Per Day ($)</label>
                <input type="number" value={form.max_loss_per_day} onChange={e => setForm(f => ({ ...f, max_loss_per_day: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="pb-field">
              <label>Position Sizing Rule</label>
              <input value={form.position_sizing} onChange={e => setForm(f => ({ ...f, position_sizing: e.target.value }))} placeholder="e.g. Max 2% of account per trade" />
            </div>

            <div className="pb-field">
              <label>Entry Rules</label>
              <div className="pb-checklist-input">
                <input value={entryRule} onChange={e => setEntryRule(e.target.value)} placeholder="Add an entry rule..." onKeyDown={e => e.key === 'Enter' && addToList('entry_rules', entryRule, setEntryRule)} />
                <button className="btn-add-item" onClick={() => addToList('entry_rules', entryRule, setEntryRule)}>+</button>
              </div>
              <div className="pb-checklist-items">
                {form.entry_rules.map((r, i) => (
                  <span key={i} className="pb-checklist-tag">🟢 {r} <button onClick={() => removeFromList('entry_rules', i)}>×</button></span>
                ))}
              </div>
            </div>

            <div className="pb-field">
              <label>Exit Rules</label>
              <div className="pb-checklist-input">
                <input value={exitRule} onChange={e => setExitRule(e.target.value)} placeholder="Add an exit rule..." onKeyDown={e => e.key === 'Enter' && addToList('exit_rules', exitRule, setExitRule)} />
                <button className="btn-add-item" onClick={() => addToList('exit_rules', exitRule, setExitRule)}>+</button>
              </div>
              <div className="pb-checklist-items">
                {form.exit_rules.map((r, i) => (
                  <span key={i} className="pb-checklist-tag">🔴 {r} <button onClick={() => removeFromList('exit_rules', i)}>×</button></span>
                ))}
              </div>
            </div>

            <div className="pb-field">
              <label>Pre-Trade Checklist</label>
              <div className="pb-checklist-input">
                <input value={checklistItem} onChange={e => setChecklistItem(e.target.value)} placeholder="Add checklist item..." onKeyDown={e => e.key === 'Enter' && addToList('checklist', checklistItem, setChecklistItem)} />
                <button className="btn-add-item" onClick={() => addToList('checklist', checklistItem, setChecklistItem)}>+</button>
              </div>
              <div className="pb-checklist-items">
                {form.checklist.map((c, i) => (
                  <span key={i} className="pb-checklist-tag">☑️ {c} <button onClick={() => removeFromList('checklist', i)}>×</button></span>
                ))}
              </div>
            </div>

            <div className="pb-form-actions">
              <button className="btn-save-pb" onClick={handleSave}>{editingId ? 'Update' : 'Create'} Playbook</button>
              <button className="btn-cancel-pb" onClick={resetForm}>Cancel</button>
            </div>
          </div>
        ) : playbooks.length === 0 ? (
          <div className="playbook-empty">
            <span>📋</span>
            <p>No playbooks yet. Create your first trading playbook to define your strategy rules!</p>
          </div>
        ) : (
          <div className="playbook-grid">
            {playbooks.map(pb => (
              <div key={pb.id} className="playbook-item">
                <div className="playbook-name">{pb.name}</div>
                <div className="playbook-strategy">{pb.strategy_type?.replace(/_/g, ' ')}</div>
                <div className="playbook-stats">
                  <div className="playbook-stat">
                    <span className="playbook-stat-label">Target R:R</span>
                    <span className="playbook-stat-value text-cyan">{pb.target_rr}</span>
                  </div>
                  <div className="playbook-stat">
                    <span className="playbook-stat-label">Max Loss/Day</span>
                    <span className="playbook-stat-value text-red">${pb.max_loss_per_day}</span>
                  </div>
                </div>
                {pb.checklist?.length > 0 && (
                  <ul className="playbook-checklist">
                    {pb.checklist.slice(0, 3).map((c, i) => (
                      <li key={i}>☑️ {c}</li>
                    ))}
                    {pb.checklist.length > 3 && <li style={{ color: 'var(--text-muted)' }}>+{pb.checklist.length - 3} more</li>}
                  </ul>
                )}
                <div className="playbook-actions">
                  <button onClick={() => handleEdit(pb)}>✏️ Edit</button>
                  <button className="btn-delete-pb" onClick={() => handleDelete(pb.id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
