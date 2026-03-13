/**
 * Vercel Serverless Function: POST /api/chat
 * 
 * AI Trade Chat — natural language questions about your trading data.
 * Powered by Groq (LLama 3.3 70B).
 */

import { supabase } from './lib/supabaseClient.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a professional Trading Performance Analyst embedded inside a trading journal app. 
You have access to the user's complete trading history data provided below.

Your job is to:
1. Answer questions about their trading performance accurately using the data
2. Identify patterns, trends, and anomalies
3. Give actionable, specific advice based on their actual numbers
4. Be concise but thorough — use bullet points and numbers
5. If they ask about something not in the data, say so honestly

RULES:
- Always reference specific dates, P&L values, and trade counts from the data
- Use $ for currency values, % for percentages
- When calculating averages/totals, show your math briefly
- Be encouraging but honest about weaknesses
- Format responses with markdown (bold, bullets, numbers)

TRADING HISTORY DATA:
{{HISTORY}}

METRICS SUMMARY:
{{METRICS}}`;

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = user.id;

  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    // Fetch user's trading data for context
    const [journalsRes, metricsRes] = await Promise.all([
      supabase
        .from('daily_journals')
        .select('date, total_pnl, num_trades, is_gambling, skill_score, strategy_used, tags, diary_notes, rule_violations, risk_reward_ratio, emotional_state')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(60),
      supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single()
    ]);

    const journals = journalsRes.data || [];
    const metrics = metricsRes.data || {};

    const historyText = journals.map(j => (
      `Date: ${j.date} | P&L: $${j.total_pnl} | Trades: ${j.num_trades} | Score: ${j.skill_score} | Gambling: ${j.is_gambling} | Strategy: ${j.strategy_used} | R:R: ${j.risk_reward_ratio} | Tags: ${(j.tags || []).join(', ')} | Mood: ${j.emotional_state || 'N/A'} | Diary: ${j.diary_notes || 'None'} | Violations: ${(j.rule_violations || []).join(', ') || 'None'}`
    )).join('\n');

    const metricsText = `Win Rate: ${metrics.win_rate?.toFixed(1) || 0}% | Skill Score: ${metrics.current_skill_score?.toFixed(1) || 50} | Total Entries: ${metrics.total_entries || 0} | Total Wins: ${metrics.total_wins || 0} | Avg R:R: ${metrics.avg_risk_reward?.toFixed(2) || 0} | Streak: ${metrics.consecutive_disciplined_days || 0} days`;

    const systemMessage = SYSTEM_PROMPT
      .replace('{{HISTORY}}', historyText || 'No trading data yet.')
      .replace('{{METRICS}}', metricsText);

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Groq API failed');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: err.message });
  }
}
