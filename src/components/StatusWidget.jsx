import './StatusWidget.css';

export default function StatusWidget({ metrics, latestJournal }) {
  const isGambling = latestJournal?.is_gambling || false;
  const lastGamblingTime = metrics?.last_gambling_timestamp;
  const streak = metrics?.consecutive_disciplined_days || 0;
  const score = metrics?.current_skill_score || 50;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`card animate-in status-widget ${isGambling ? 'status-gambling' : 'status-disciplined'}`}>
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🎯</span> Current Status
        </span>
      </div>

      <div className="status-indicator">
        <div className={`status-orb ${isGambling ? 'orb-red' : 'orb-green'}`}>
          <span className="status-emoji">{isGambling ? '🎰' : '🧘'}</span>
        </div>
        <h2 className={`status-label ${isGambling ? 'text-red' : 'text-green'}`}>
          {isGambling ? 'GAMBLING MODE' : 'DISCIPLINED'}
        </h2>
      </div>

      <div className="status-details">
        <div className="status-row">
          <span className="status-key">Skill Score</span>
          <div className="skill-bar-container">
            <div
              className="skill-bar-fill"
              style={{
                width: `${score}%`,
                background: score >= 70 ? 'var(--accent-green)' : score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)'
              }}
            />
            <span className="skill-bar-label mono">{score.toFixed(1)}</span>
          </div>
        </div>

        <div className="status-row">
          <span className="status-key">Discipline Streak</span>
          <span className="status-val mono">
            {streak} day{streak !== 1 ? 's' : ''} {streak >= 5 ? '🔥' : streak >= 3 ? '⚡' : ''}
          </span>
        </div>

        <div className="status-row">
          <span className="status-key">Last Violation</span>
          <span className={`status-val mono ${lastGamblingTime ? 'text-red' : 'text-green'}`}>
            {formatDate(lastGamblingTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
