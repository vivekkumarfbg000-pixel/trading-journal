/**
 * Vercel Serverless Function: GET /api/optimize
 * 
 * Analyzes detailed trade data via Groq to find performance sweet spots.
 */

import { supabase } from './lib/supabaseClient.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const OPTIMIZE_PROMPT = `You are a Trading Data Scientist. 
Analyze these individual trades and identify 3 high-probability "Optimization Wins".

Look for:
1. Tick Performance: Are certain tickers consistently losing?
2. Option Strategy: Is one strategy (e.g. Put Spreads) significantly more profitable than others?
3. Trade Size: Is the user over-leveraging on certain trades?
4. Setup Success: Based on tags, which setup has the highest expectancy?

FORMAT: Return a JSON object:
{
  "recommendations": [
    { "title": "...", "insight": "...", "impact": "High/Medium" }
  ],
  "best_ticker": "SYM",
  "worst_ticker": "SYM",
  "ideal_strategy": "Name"
}

TRADES DATA:
{{TRADES}}

Return ONLY JSON.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Fetch individual trades across all journals
    const { data: trades } = await supabase
      .from('trades')
      .select('ticker, option_type, pnl, credit_received, max_risk')
      .limit(100);

    if (!trades || trades.length < 5) {
      return res.json({ message: "Need more trade data for optimization analysis." });
    }

    const tradeText = trades.map(t => (
      `Ticker: ${t.ticker}, Type: ${t.option_type}, PnL: ${t.pnl}, Credit: ${t.credit_received}, Risk: ${t.max_risk}`
    )).join('\n');

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You output JSON only." },
          { role: "user", content: OPTIMIZE_PROMPT.replace('{{TRADES}}', tradeText) }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    res.json(JSON.parse(data.choices[0].message.content));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
