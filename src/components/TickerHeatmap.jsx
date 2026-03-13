import { useMemo } from 'react';
import './TickerHeatmap.css';

export default function TickerHeatmap({ journals }) {
  const tickers = useMemo(() => {
    if (!journals || journals.length === 0) return [];

    const tickerMap = {};
    journals.forEach(j => {
      (j.trades || []).forEach(t => {
        const sym = (t.ticker || 'UNKNOWN').toUpperCase();
        if (!tickerMap[sym]) tickerMap[sym] = { pnl: 0, count: 0, wins: 0 };
        tickerMap[sym].pnl += t.pnl || 0;
        tickerMap[sym].count += 1;
        if (t.pnl > 0) tickerMap[sym].wins += 1;
      });
    });

    return Object.entries(tickerMap)
      .map(([symbol, data]) => ({
        symbol,
        pnl: data.pnl,
        count: data.count,
        winRate: data.count > 0 ? (data.wins / data.count * 100) : 0
      }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
  }, [journals]);

  if (tickers.length === 0) return null;

  const maxPnl = Math.max(...tickers.map(t => Math.abs(t.pnl)), 1);

  const getColor = (pnl) => {
    const intensity = Math.min(Math.abs(pnl) / maxPnl, 1);
    if (pnl >= 0) {
      return `rgba(6, 214, 160, ${0.15 + intensity * 0.45})`;
    }
    return `rgba(239, 71, 111, ${0.15 + intensity * 0.45})`;
  };

  return (
    <div className="card animate-in ticker-heatmap-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🗺️</span> Ticker Performance Map
        </span>
      </div>

      <div className="ticker-grid">
        {tickers.map((t, i) => (
          <div
            key={i}
            className="ticker-cell"
            style={{ background: getColor(t.pnl) }}
            title={`${t.symbol}: $${t.pnl.toFixed(2)} | ${t.count} trades | ${t.winRate.toFixed(0)}% WR`}
          >
            <span className="ticker-symbol">{t.symbol}</span>
            <span className={`ticker-pnl ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>
              ${t.pnl.toFixed(0)}
            </span>
            <span className="ticker-count">{t.count} trades</span>
          </div>
        ))}
      </div>
    </div>
  );
}
