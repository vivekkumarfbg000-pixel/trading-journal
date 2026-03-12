import { useMemo } from 'react';
import './TradingCalendar.css';

export default function TradingCalendar({ journals }) {
  const calendarData = useMemo(() => {
    const today = new Date();
    const days = [];
    
    // Last 6 months
    for (let i = 180; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const journal = journals?.find(j => j.date === dateStr);
      
      days.push({
        date: dateStr,
        dayOfMonth: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        pnl: journal?.total_pnl || 0,
        hasEntry: !!journal
      });
    }
    return days;
  }, [journals]);

  // Group by month
  const months = useMemo(() => {
    const groups = {};
    calendarData.forEach(day => {
      const key = `${day.year}-${day.month}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(day);
    });
    return Object.values(groups);
  }, [calendarData]);

  const getIntensity = (pnl) => {
    if (pnl === 0) return 'neutral';
    if (pnl > 0) {
      if (pnl > 1000) return 'win-high';
      if (pnl > 500) return 'win-med';
      return 'win-low';
    } else {
      const absPnl = Math.abs(pnl);
      if (absPnl > 1000) return 'loss-high';
      if (absPnl > 500) return 'loss-med';
      return 'loss-low';
    }
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="card animate-in trading-calendar-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📅</span> Performance Heatmap
        </span>
        <div className="calendar-legend">
          <span className="legend-item"><div className="square win-high"></div> Profit</span>
          <span className="legend-item"><div className="square loss-high"></div> Loss</span>
        </div>
      </div>
      
      <div className="calendar-grid">
        {months.map((monthDays, midx) => (
          <div key={midx} className="month-column">
            <span className="month-label">
              {monthNames[monthDays[0].month]}
            </span>
            <div className="days-row">
              {monthDays.map((day, didx) => (
                <div 
                  key={didx} 
                  className={`day-square ${day.hasEntry ? getIntensity(day.pnl) : 'empty'}`}
                  title={`${day.date}: $${day.pnl.toFixed(2)}`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
