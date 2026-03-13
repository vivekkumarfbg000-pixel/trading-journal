import { useMemo, useState } from 'react';
import './WeeklyReport.css';

export default function WeeklyReport({ journals }) {
  const [period, setPeriod] = useState('week'); // 'week' | 'month'

  const report = useMemo(() => {
    if (!journals || journals.length === 0) return null;

    const now = new Date();
    const periodStart = new Date();
    const prevPeriodStart = new Date();
    const prevPeriodEnd = new Date();

    if (period === 'week') {
      periodStart.setDate(now.getDate() - 7);
      prevPeriodEnd.setDate(now.getDate() - 7);
      prevPeriodStart.setDate(now.getDate() - 14);
    } else {
      periodStart.setDate(now.getDate() - 30);
      prevPeriodEnd.setDate(now.getDate() - 30);
      prevPeriodStart.setDate(now.getDate() - 60);
    }

    const currentStr = periodStart.toISOString().split('T')[0];
    const prevStartStr = prevPeriodStart.toISOString().split('T')[0];
    const prevEndStr = prevPeriodEnd.toISOString().split('T')[0];

    const current = journals.filter(j => j.date >= currentStr);
    const previous = journals.filter(j => j.date >= prevStartStr && j.date < prevEndStr);

    if (current.length === 0) return null;

    const totalPnl = current.reduce((s, j) => s + (j.total_pnl || 0), 0);
    const prevPnl = previous.reduce((s, j) => s + (j.total_pnl || 0), 0);
    const totalTrades = current.reduce((s, j) => s + (j.num_trades || 0), 0);
    const wins = current.filter(j => j.total_pnl > 0).length;
    const winRate = current.length > 0 ? (wins / current.length) * 100 : 0;
    const prevWins = previous.filter(j => j.total_pnl > 0).length;
    const prevWinRate = previous.length > 0 ? (prevWins / previous.length) * 100 : 0;
    const avgScore = current.reduce((s, j) => s + (j.skill_score || 0), 0) / current.length;
    const violations = current.filter(j => j.is_gambling).length;
    const avgRR = current.reduce((s, j) => s + (j.risk_reward_ratio || 0), 0) / current.length;

    // Best and worst days
    const sorted = [...current].sort((a, b) => b.total_pnl - a.total_pnl);
    const bestDay = sorted[0];
    const worstDay = sorted[sorted.length - 1];

    return {
      totalPnl, prevPnl, totalTrades,
      winRate, prevWinRate,
      avgScore, violations, avgRR,
      bestDay, worstDay,
      tradingDays: current.length,
      prevDays: previous.length,
      dateRange: `${new Date(currentStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    };
  }, [journals, period]);

  const formatChange = (current, previous) => {
    if (!previous) return null;
    const diff = current - previous;
    const sign = diff >= 0 ? '+' : '';
    return { text: `${sign}${diff.toFixed(1)}`, positive: diff >= 0 };
  };

  if (!report) {
    return (
      <div className="card animate-in">
        <div className="report-empty">
          <span style={{ fontSize: 32 }}>📊</span>
          <p>Not enough data for a report yet. Upload a few more trading days!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container animate-in">
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <span className="icon">📊</span> Performance Report
          </span>
          <div className="report-header-bar">
            <div className="report-toggle">
              <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Weekly</button>
              <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Monthly</button>
            </div>
            <span className="report-period">{report.dateRange}</span>
          </div>
        </div>

        <div className="report-summary-grid">
          <div className="report-stat">
            <div className="report-stat-label">Total P&L</div>
            <div className={`report-stat-value ${report.totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              ${report.totalPnl.toFixed(2)}
            </div>
            {report.prevDays > 0 && (() => {
              const c = formatChange(report.totalPnl, report.prevPnl);
              return c ? <div className={`report-stat-change ${c.positive ? 'text-green' : 'text-red'}`}>
                {c.text} vs prev
              </div> : null;
            })()}
          </div>

          <div className="report-stat">
            <div className="report-stat-label">Win Rate</div>
            <div className={`report-stat-value ${report.winRate >= 50 ? 'text-green' : 'text-red'}`}>
              {report.winRate.toFixed(1)}%
            </div>
            {report.prevDays > 0 && (() => {
              const c = formatChange(report.winRate, report.prevWinRate);
              return c ? <div className={`report-stat-change ${c.positive ? 'text-green' : 'text-red'}`}>
                {c.text}% vs prev
              </div> : null;
            })()}
          </div>

          <div className="report-stat">
            <div className="report-stat-label">Trading Days</div>
            <div className="report-stat-value text-cyan">{report.tradingDays}</div>
          </div>

          <div className="report-stat">
            <div className="report-stat-label">Total Trades</div>
            <div className="report-stat-value text-blue">{report.totalTrades}</div>
          </div>

          <div className="report-stat">
            <div className="report-stat-label">Avg Skill Score</div>
            <div className="report-stat-value" style={{ color: 'var(--accent-purple)' }}>
              {report.avgScore.toFixed(1)}
            </div>
          </div>

          <div className="report-stat">
            <div className="report-stat-label">Violations</div>
            <div className={`report-stat-value ${report.violations > 0 ? 'text-red' : 'text-green'}`}>
              {report.violations}
            </div>
          </div>
        </div>

        <div className="report-highlights" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="highlight-card">
            <h4>🏆 Best Day</h4>
            <div className="highlight-value text-green">
              ${report.bestDay?.total_pnl?.toFixed(2)}
            </div>
            <div className="highlight-date">{report.bestDay?.date}</div>
          </div>
          <div className="highlight-card">
            <h4>📉 Worst Day</h4>
            <div className="highlight-value text-red">
              ${report.worstDay?.total_pnl?.toFixed(2)}
            </div>
            <div className="highlight-date">{report.worstDay?.date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
