/**
 * Rules Engine — shared module for Vercel serverless functions
 */

const VALID_STRATEGIES = new Set([
  'credit_spread', 'call_spread', 'put_spread',
  'iron_condor', 'credit spread', 'bull put spread',
  'bear call spread', 'bull_put_spread', 'bear_call_spread'
]);
const RR_TARGET = 2.0;
const RR_TOLERANCE = 0.20;

export function evaluateRules(data) {
  const violations = [];
  const details = {};

  // Rule 1: Max Trades
  const numTrades = data.num_trades || 0;
  if (numTrades > 2) {
    violations.push('Overtrading / Gambling Warning');
    details.maxTrades = { passed: false, message: `Executed ${numTrades} trades (limit: 2)` };
  } else {
    details.maxTrades = { passed: true, message: `Executed ${numTrades} trades (limit: 2)` };
  }

  // Rule 2: Strategy
  const strategy = (data.strategy || '').toLowerCase().trim();
  let strategyValid = !strategy || VALID_STRATEGIES.has(strategy);
  for (const t of (data.trades || [])) {
    const tt = (t.option_type || '').toLowerCase().trim();
    if (tt && !VALID_STRATEGIES.has(tt)) { strategyValid = false; break; }
  }
  if (!strategyValid) {
    violations.push('Strategy Deviation');
    details.strategy = { passed: false, message: `Strategy '${strategy}' is not a credit spread variant` };
  } else {
    details.strategy = { passed: true, message: `Strategy: ${strategy || 'credit_spread'}` };
  }

  // Rule 3: Risk/Reward
  const rr = data.risk_reward_ratio || 0;
  const rrLower = RR_TARGET * (1 - RR_TOLERANCE);
  const rrUpper = RR_TARGET * (1 + RR_TOLERANCE);
  if (rr > 0 && (rr < rrLower || rr > rrUpper)) {
    violations.push('R:R Violation');
    details.riskReward = { passed: false, message: `R:R is ${rr.toFixed(2)} (expected ${rrLower.toFixed(2)}–${rrUpper.toFixed(2)})` };
  } else {
    details.riskReward = { passed: true, message: rr > 0 ? `R:R is ${rr.toFixed(2)}` : 'R:R not calculated' };
  }

  // Rule 4: Capital Buffer
  const marginUsed = data.margin_used || 0;
  const capitalBuffer = data.capital_buffer || 0;
  if (marginUsed > 0 && capitalBuffer < 2 * marginUsed) {
    violations.push('Insufficient Capital Buffer');
    details.capitalBuffer = { passed: false, message: `Buffer $${capitalBuffer.toLocaleString()} < 2× margin $${marginUsed.toLocaleString()}` };
  } else {
    details.capitalBuffer = { passed: true, message: marginUsed > 0 ? `Buffer $${capitalBuffer.toLocaleString()} vs margin $${marginUsed.toLocaleString()}` : 'Not evaluated' };
  }

  return { violations, isGambling: violations.length > 0, details };
}

export function computeSkillScore(currentScore, violations, consecutiveDays) {
  if (violations.length === 0) {
    const newStreak = consecutiveDays + 1;
    const gain = 3 + (1 * newStreak);
    return { newScore: Math.min(currentScore + gain, 100), newStreak };
  } else {
    const penalty = 10 * violations.length;
    return { newScore: Math.max(currentScore - penalty, 0), newStreak: 0 };
  }
}
