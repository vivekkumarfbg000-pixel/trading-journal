/**
 * Vercel Serverless Function: GET /api/mentor
 * 
 * [AI POLICY] Using Groq for high-latency textual/behavioral analysis.
 * Google Gemini is reserved strictly for Vision/OCR tasks.
 */

import { supabase } from './lib/supabaseClient.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MENTOR_PROMPT = `You are a professional Trading Psychologist and Performance Coach. 
Analyze the following trading history and provide a concise, high-impact behavioral assessment.

Focus on:
1. Revenge Trading: Are there multiple high-risk trades immediately after a loss?
2. Strategy Consistency: Is the user sticking to their "credit_spread" strategy or gambling on random tickers?
3. Emotional Control: Does the skill score drop significantly during losing streaks?
4. Positive Reinforcement: Highlight what they are doing RIGHT (e.g., sticking to risk limits).

FORMAT: Return a JSON object with this structure:
{
  "summary": "Overall behavioral sentiment.",
  "strengths": ["list of positive habits"],
  "weaknesses": ["list of behavioral red flags"],
  "action_plan": ["3 specific, actionable steps to improve discipline"],
  "discipline_rating": <int 0-100>
}

HISTORY:
{{HISTORY}}

Return ONLY the JSON. No conversational filler.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = user.id;

  try {
    // 1. Fetch history
    const { data: journals } = await supabase
      .from('daily_journals')
      .select('date, total_pnl, num_trades, is_gambling, skill_score, strategy_used, tags, diary_notes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (!journals || journals.length === 0) {
      return res.json({ message: "Not enough data for AI Mentorship yet. Upload at least 3-5 days of trading." });
    }

    // 2. Prepare history for Groq
    const historyText = journals.map(j => (
      `Date: ${j.date}, PnL: ${j.total_pnl}, Trades: ${j.num_trades}, Gambling: ${j.is_gambling}, Score: ${j.skill_score}, Strategy: ${j.strategy_used}, Tags: ${j.tags?.join(', ')}, Diary: ${j.diary_notes || 'None'}`
    )).join('\n');

    // 3. Call Groq
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a specialized trading performance bot. You output JSON only." },
          { role: "user", content: MENTOR_PROMPT.replace('{{HISTORY}}', historyText) }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Groq API failed');
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    res.json(analysis);

  } catch (err) {
    console.error('Mentor API error:', err);
    res.status(500).json({ error: err.message });
  }
}
