/**
 * Vercel Serverless Function: POST /api/bulk-import
 * 
 * Handles real bulk insertion of trade sessions.
 */

import { supabase } from './lib/supabaseClient.js';
import { evaluateRules, computeSkillScore } from './lib/rulesEngine.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = user.id;

  try {
    const { sessions } = req.body;
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ error: 'Invalid sessions data' });
    }

    // Get current metrics
    let { data: metrics } = await supabase.from('user_metrics').select('*').eq('user_id', userId).limit(1).single();
    if (!metrics) {
      await supabase.from('user_metrics').insert({ user_id: userId, current_skill_score: 50 });
      ({ data: metrics } = await supabase.from('user_metrics').select('*').eq('user_id', userId).limit(1).single());
    }

    let currentScore = metrics.current_skill_score;
    let currentStreak = metrics.consecutive_disciplined_days;
    const results = [];

    for (const session of sessions) {
      // 1. Check if exists
      const { data: existing } = await supabase.from('daily_journals').select('id').eq('user_id', userId).eq('date', session.date).single();
      if (existing) continue;

      // 2. Rules Engine
      const rulesResult = evaluateRules(session);
      const { newScore, newStreak } = computeSkillScore(currentScore, rulesResult.violations, currentStreak);
      currentScore = newScore;
      currentStreak = newStreak;

      // 3. Insert Journal
      const { data: journal } = await supabase.from('daily_journals').insert({
        user_id: userId,
        date: session.date,
        total_pnl: session.total_pnl,
        num_trades: session.num_trades,
        strategy_used: 'bulk_import',
        rule_violations: rulesResult.violations,
        is_gambling: rulesResult.isGambling,
        skill_score: newScore,
        tags: ['Bulk Import']
      }).select().single();

      // 4. Insert Trades
      if (session.trades?.length > 0) {
        const tradesToInsert = session.trades.map(t => ({
          journal_id: journal.id,
          ticker: t.ticker,
          pnl: t.pnl,
          option_type: t.option_type || 'TRADE'
        }));
        await supabase.from('trades').insert(tradesToInsert);
      }
      
      results.push(session.date);
    }

    // Update final metrics
    await supabase.from('user_metrics').update({
      current_skill_score: currentScore,
      consecutive_disciplined_days: currentStreak,
      updated_at: new Date().toISOString()
    }).eq('id', metrics.id);

    res.json({ message: `Successfully imported ${results.length} sessions`, imported: results });

  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ error: err.message });
  }
}
