import './MetricsBar.css';

export default function MetricsBar({ metrics, onMetricClick }) {
  const items = [
    {
      id: 'win-rate',
      label: 'Win Rate',
      value: `${(metrics?.win_rate || 0).toFixed(1)}%`,
      icon: '📊',
      color: (metrics?.win_rate || 0) >= 50 ? 'var(--accent-green)' : 'var(--accent-red)',
      targetTab: 'history'
    },
    {
      id: 'skill-score',
      label: 'Skill Score',
      value: (metrics?.current_skill_score || 50).toFixed(1),
      icon: '⚡',
      color: 'var(--accent-cyan)',
      targetTab: 'analytics'
    },
    {
      id: 'total-entries',
      label: 'Total Entries',
      value: metrics?.total_entries || 0,
      icon: '📝',
      color: 'var(--accent-blue)',
      targetTab: 'history'
    },
    {
      id: 'streak',
      label: 'Streak',
      value: `${metrics?.consecutive_disciplined_days || 0}d`,
      icon: '🔥',
      color: 'var(--accent-amber)',
      targetTab: 'dashboard'
    },
    {
      id: 'avg-rr',
      label: 'Avg R:R',
      value: (metrics?.avg_risk_reward || 0).toFixed(2),
      icon: '📐',
      color: 'var(--accent-purple)',
      targetTab: 'analytics'
    },
    {
      id: 'wins',
      label: 'Wins',
      value: `${metrics?.total_wins || 0}/${metrics?.total_entries || 0}`,
      icon: '🏆',
      color: 'var(--accent-green)',
      targetTab: 'history'
    }
  ];

  return (
    <div className="metrics-bar">
      {items.map((item, i) => (
        <div 
          key={i} 
          className="metric-card card animate-in"
          onClick={() => onMetricClick && onMetricClick(item.targetTab)}
          style={{ cursor: onMetricClick ? 'pointer' : 'default' }}
        >
          <div className="metric-icon">{item.icon}</div>
          <div className="metric-value mono" style={{ color: item.color }}>
            {item.value}
          </div>
          <div className="metric-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
