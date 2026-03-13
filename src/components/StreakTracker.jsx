import { useMemo } from 'react';
import './StreakTracker.css';

export default function StreakTracker({ journals }) {
  const streaks = useMemo(() => {
    if (!journals || journals.length < 2) return null;

    const sorted = [...journals].sort((a, b) => a.date.localeCompare(b.date));

    const streakData = [];
    let currentStreak = { type: null, count: 0, startDate: null };

    sorted.forEach((j, idx) => {
      const isWin = j.total_pnl > 0;
      const type = isWin ? 'win' : 'loss';

      if (type === currentStreak.type) {
        currentStreak.count++;
      } else {
        if (currentStreak.type !== null) {
          streakData.push({ ...currentStreak, endDate: sorted[idx - 1]?.date });
        }
        currentStreak = { type, count: 1, startDate: j.date };
      }
    });
    if (currentStreak.type !== null) {
      streakData.push({ ...currentStreak, endDate: sorted[sorted.length - 1]?.date });
    }

    const longestWin = streakData.filter(s => s.type === 'win').sort((a, b) => b.count - a.count)[0];
    const longestLoss = streakData.filter(s => s.type === 'loss').sort((a, b) => b.count - a.count)[0];
    const currentType = streakData.length > 0 ? streakData[streakData.length - 1] : null;

    return { data: streakData.slice(-30), longestWin, longestLoss, current: currentType };
  }, [journals]);

  if (!streaks) return null;

  const maxCount = Math.max(...streaks.data.map(s => s.count), 1);

  return (
    <div className="card animate-in streak-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🔥</span> Win/Loss Streaks
        </span>
      </div>

      <div className="streak-bars">
        {streaks.data.map((s, i) => (
          <div key={i} className="streak-bar-item" title={`${s.type === 'win' ? 'W' : 'L'}${s.count} (${s.startDate})`}>
            <div
              className="streak-bar"
              style={{
                height: `${(s.count / maxCount) * 100}%`,
                background: s.type === 'win'
                  ? 'linear-gradient(to top, rgba(6, 214, 160, 0.3), rgba(6, 214, 160, 0.8))'
                  : 'linear-gradient(to top, rgba(239, 71, 111, 0.3), rgba(239, 71, 111, 0.8))'
              }}
            />
          </div>
        ))}
      </div>

      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-stat-label">🏆 Longest Win Streak</span>
          <span className="streak-stat-value text-green">{streaks.longestWin?.count || 0} days</span>
        </div>
        <div className="streak-stat">
          <span className="streak-stat-label">📉 Longest Loss Streak</span>
          <span className="streak-stat-value text-red">{streaks.longestLoss?.count || 0} days</span>
        </div>
        <div className="streak-stat">
          <span className="streak-stat-label">📍 Current Streak</span>
          <span className={`streak-stat-value ${streaks.current?.type === 'win' ? 'text-green' : 'text-red'}`}>
            {streaks.current?.type === 'win' ? '🟢' : '🔴'} {streaks.current?.count || 0} days
          </span>
        </div>
      </div>
    </div>
  );
}
