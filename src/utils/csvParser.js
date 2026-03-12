/**
 * Simple CSV parser for v3 Bulk Import.
 * Supports basic Robinhood and IBKR-like headers.
 */

export function parseTradingCSV(csvText, brokerage = 'unknown') {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l !== '');
  if (lines.length < 2) throw new Error('CSV is empty or invalid');

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const rows = lines.slice(1);

  // Map common headers to internal keys
  const headerMap = {
    'date': 'date',
    'timestamp': 'date',
    'ticker': 'ticker',
    'symbol': 'ticker',
    'pnl': 'pnl',
    'profit': 'pnl',
    'amount': 'pnl',
    'type': 'type',
    'action': 'type'
  };

  const internalHeaders = headers.map(h => headerMap[h] || h);

  const trades = rows.map(row => {
    const values = row.split(',');
    const trade = {};
    internalHeaders.forEach((h, i) => {
      trade[h] = values[i]?.trim();
    });
    return trade;
  });

  // Group trades by date to create daily journals
  const sessions = {};
  trades.forEach(t => {
    const date = new Date(t.date).toISOString().split('T')[0];
    if (!sessions[date]) {
      sessions[date] = {
        date,
        total_pnl: 0,
        num_trades: 0,
        trades: []
      };
    }
    const pnl = parseFloat(t.pnl) || 0;
    sessions[date].total_pnl += pnl;
    sessions[date].num_trades += 1;
    sessions[date].trades.push({
      ticker: t.ticker || 'UNKNOWN',
      pnl: pnl,
      option_type: t.type || 'TRADE'
    });
  });

  return Object.values(sessions);
}
