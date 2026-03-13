/**
 * Vercel Serverless Function: GET /api/checklist
 * 
 * AI Pre-Trade Checklist — analyzes last 14 days and generates
 * 5 personalized checklist items via Groq.
 */

import { supabase } from './lib/supabaseClient.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: journals } = await supabase
      .from('daily_journals')
      .select('date, total_pnl, num_trades, is_gambling, strategy_used, tags, rule_violations, emotional_state, risk_reward_ratio')
      .eq('user_id', user.id)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (!journals || journals.length < 2) {
      return res.json({
        checklist: [
          { text: 'Upload at least 3 trading days to get personalized insights', priority: 'info' },
          { text: 'Stick to your defined strategy today', priority: 'medium' },
          { text: 'Keep trades to a maximum of 2 today', priority: 'high' },
          { text: 'Set your stop loss before entering any trade', priority: 'high' },
          { text: 'Log your mood before trading', priority: 'medium' }
        ]
      });
    }

    const historyText = journals.map(j =>
      `${j.date}: P&L=$${j.total_pnl}, Trades=${j.num_trades}, Gambling=${j.is_gambling}, Strategy=${j.strategy_used}, Mood=${j.emotional_state || 'unknown'}, Violations=[${(j.rule_violations || []).join(',')}], Tags=[${(j.tags || []).join(',')}]`
    ).join('\n');

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: `You are a trading discipline coach. Based on the trader's last 14 days of data, generate exactly 5 pre-trade checklist items for today. Each item should be specific to their patterns, not generic advice.

Rules:
- Return ONLY valid JSON array with objects containing "text" (string) and "priority" ("high"|"medium"|"low")
- Reference specific patterns from THEIR data (dates, numbers, moods, violations)
- If they overtrade, address it. If they have mood-related losses, address it.
- Each item should be actionable and specific
- No markdown, no explanation, ONLY the JSON array

Example format:
[{"text":"You lost $X on 3 of the last 5 Mondays — consider reducing position size today","priority":"high"}]`
        }, {
          role: 'user',
          content: `Here is my trading data for the last 14 days:\n${historyText}\n\nGenerate my pre-trade checklist for today.`
        }],
        temperature: 0.6,
        max_tokens: 512
      })
    });

    if (!response.ok) throw new Error('Groq API failed');

    const data = await response.json();
    const raw = data.choices[0].message.content.trim();

    // Parse JSON from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const checklist = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ checklist });

  } catch (err) {
    console.error('Checklist API error:', err);
    res.status(500).json({ error: err.message });
  }
}
