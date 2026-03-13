import { useState, useEffect, useMemo } from 'react';
import './GoalsWidget.css';

const DEFAULT_GOALS = {
  daily_pnl: 500,
  weekly_pnl: 2500,
  monthly_pnl: 10000,
  max_trades_per_day: 2,
  max_drawdown: 1000
};

export default function GoalsWidget({ journals, metrics }) {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('trading_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editGoals, setEditGoals] = useState(goals);

  const progress = useMemo(() => {
    if (!journals || journals.length === 0) return null;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthStr = monthAgo.toISOString().split('T')[0];

    const today = journals.filter(j => j.date === todayStr);
    const week = journals.filter(j => j.date >= weekStr);
    const month = journals.filter(j => j.date >= monthStr);

    const dailyPnl = today.reduce((s, j) => s + (j.total_pnl || 0), 0);
    const weeklyPnl = week.reduce((s, j) => s + (j.total_pnl || 0), 0);
    const monthlyPnl = month.reduce((s, j) => s + (j.total_pnl || 0), 0);
    const todayTrades = today.reduce((s, j) => s + (j.num_trades || 0), 0);

    // Max drawdown calculation
    const sorted = [...month].sort((a, b) => a.date.localeCompare(b.date));
    let cumPnl = 0, peak = 0, maxDD = 0;
    sorted.forEach(j => {
      cumPnl += j.total_pnl || 0;
      if (cumPnl > peak) peak = cumPnl;
      const dd = peak - cumPnl;
      if (dd > maxDD) maxDD = dd;
    });

    return { dailyPnl, weeklyPnl, monthlyPnl, todayTrades, maxDD };
  }, [journals]);

  const saveGoals = () => {
    setGoals(editGoals);
    localStorage.setItem('trading_goals', JSON.stringify(editGoals));
    setIsEditing(false);
  };

  const getProgressPercent = (current, target) => {
    if (target === 0) return 0;
    return Math.min(Math.max((current / target) * 100, 0), 100);
  };

  const getProgressColor = (pct, isInverse = false) => {
    if (isInverse) {
      if (pct >= 80) return 'var(--accent-red)';
      if (pct >= 50) return 'var(--accent-amber)';
      return 'var(--accent-green)';
    }
    if (pct >= 80) return 'var(--accent-green)';
    if (pct >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  if (!progress) return null;

  const goalItems = [
    {
      label: 'Daily P&L',
      current: progress.dailyPnl,
      target: goals.daily_pnl,
      format: (v) => `$${v.toFixed(0)}`,
      icon: '📅'
    },
    {
      label: 'Weekly P&L',
      current: progress.weeklyPnl,
      target: goals.weekly_pnl,
      format: (v) => `$${v.toFixed(0)}`,
      icon: '📊'
    },
    {
      label: 'Monthly P&L',
      current: progress.monthlyPnl,
      target: goals.monthly_pnl,
      format: (v) => `$${v.toFixed(0)}`,
      icon: '🎯'
    },
    {
      label: 'Trades Today',
      current: progress.todayTrades,
      target: goals.max_trades_per_day,
      format: (v) => v.toString(),
      icon: '📝',
      isInverse: true
    },
    {
      label: 'Max Drawdown',
      current: progress.maxDD,
      target: goals.max_drawdown,
      format: (v) => `$${v.toFixed(0)}`,
      icon: '🛡️',
      isInverse: true
    }
  ];

  return (
    <div className="card animate-in goals-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🎯</span> Goals & Targets
        </span>
        <button className="btn-edit-goals" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : '✏️ Edit'}
        </button>
      </div>

      {isEditing ? (
        <div>
          <div className="goals-edit-form">
            <div className="goal-input-group">
              <label>Daily P&L Target ($)</label>
              <input
                type="number"
                value={editGoals.daily_pnl}
                onChange={(e) => setEditGoals({ ...editGoals, daily_pnl: Number(e.target.value) })}
              />
            </div>
            <div className="goal-input-group">
              <label>Weekly P&L Target ($)</label>
              <input
                type="number"
                value={editGoals.weekly_pnl}
                onChange={(e) => setEditGoals({ ...editGoals, weekly_pnl: Number(e.target.value) })}
              />
            </div>
            <div className="goal-input-group">
              <label>Monthly P&L Target ($)</label>
              <input
                type="number"
                value={editGoals.monthly_pnl}
                onChange={(e) => setEditGoals({ ...editGoals, monthly_pnl: Number(e.target.value) })}
              />
            </div>
            <div className="goal-input-group">
              <label>Max Trades Per Day</label>
              <input
                type="number"
                value={editGoals.max_trades_per_day}
                onChange={(e) => setEditGoals({ ...editGoals, max_trades_per_day: Number(e.target.value) })}
              />
            </div>
            <div className="goal-input-group">
              <label>Max Drawdown ($)</label>
              <input
                type="number"
                value={editGoals.max_drawdown}
                onChange={(e) => setEditGoals({ ...editGoals, max_drawdown: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="goals-actions">
            <button className="btn-save-goals" onClick={saveGoals}>Save Goals</button>
          </div>
        </div>
      ) : (
        <div className="goals-grid">
          {goalItems.map((item, i) => {
            const pct = getProgressPercent(item.current, item.target);
            const color = getProgressColor(pct, item.isInverse);
            const isAchieved = item.isInverse ? item.current <= item.target : item.current >= item.target;
            return (
              <div key={i} className="goal-item">
                <div className="goal-header">
                  <span className="goal-label">{item.icon} {item.label}</span>
                </div>
                <div className="goal-values">
                  <span className="goal-current" style={{ color }}>{item.format(item.current)}</span>
                  <span className="goal-target">/ {item.format(item.target)}</span>
                </div>
                <div className="goal-bar">
                  <div
                    className="goal-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <div className="goal-status" style={{ color }}>
                  {isAchieved ? '✅ Goal met!' : `${pct.toFixed(0)}% complete`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
