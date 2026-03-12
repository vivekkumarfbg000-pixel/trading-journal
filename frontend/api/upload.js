/**
 * Vercel Serverless Function: POST /api/upload
 * 
 * Receives a base64-encoded screenshot + brokerage name as JSON.
 * 
 * [AI POLICY] Remaining on Google Gemini Vision for OCR/Extraction.
 * All other non-vision AI tasks should use Groq.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './lib/supabaseClient.js';
import { evaluateRules, computeSkillScore } from './lib/rulesEngine.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EXTRACTION_PROMPT = `You are a financial data extraction expert. Analyze this trading platform screenshot and extract the following information as a JSON object.

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanation text.

Extract this structure:
{
  "date": "YYYY-MM-DD",
  "total_pnl": <float>,
  "num_trades": <int>,
  "strategy": "credit_spread",
  "margin_used": <float>,
  "capital_buffer": <float>,
  "credit_received": <float>,
  "risk_reward_ratio": <float>,
  "trades": [
    {
      "ticker": "<symbol>",
      "option_type": "<call_spread|put_spread|credit_spread|iron_condor>",
      "strike_short": <float>,
      "strike_long": <float>,
      "expiry": "<date>",
      "credit_received": <float>,
      "max_risk": <float>,
      "pnl": <float>,
      "is_winner": <bool>
    }
  ]
}

Rules:
1. Use 0 or null for unknown values.
2. risk_reward_ratio = credit_received / max_risk aggregated.
3. For credit spreads: max_risk = (strike width x 100) - credit_received.
4. Count each distinct spread as one trade.
BROKERAGE: {{BROKERAGE}}
Return ONLY the JSON.`;

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- Verify User ---
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = user.id;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, mimeType = 'image/png', brokerage = 'unknown', date: manualDate, tags = [], diary = '' } = req.body;

    if (!imageBase64) return res.status(400).json({ error: 'No image data provided' });

    // --- 1. Gemini Vision extraction ---
    let extracted = {};
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = EXTRACTION_PROMPT.replace('{{BROKERAGE}}', brokerage);
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType } }
      ]);
      let text = result.response.text().trim();
      if (text.startsWith('```')) text = text.split('\n').slice(1, -1).join('\n');
      if (text.startsWith('json')) text = text.slice(4).trim();
      extracted = JSON.parse(text);
    } catch (err) {
      console.warn('Vision extraction warning:', err.message);
      extracted = {};
    }

    const defaults = { date: null, total_pnl: 0, num_trades: 0, strategy: 'credit_spread', margin_used: 0, capital_buffer: 0, credit_received: 0, risk_reward_ratio: 0, trades: [] };
    for (const [k, v] of Object.entries(defaults)) {
      if (extracted[k] == null) extracted[k] = v;
    }

    // --- 2. Parse date ---
    let journalDate;
    try {
      journalDate = manualDate || extracted.date || new Date().toISOString().split('T')[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(journalDate)) journalDate = new Date().toISOString().split('T')[0];
    } catch { journalDate = new Date().toISOString().split('T')[0]; }

    // --- 3. Check duplicate ---
    const { data: existing } = await supabase.from('daily_journals').select('id').eq('user_id', userId).eq('date', journalDate).single();
    if (existing) return res.status(409).json({ error: `Journal entry already exists for ${journalDate}. Delete it first to re-upload.` });

    // --- 4. Rules Engine ---
    const rulesResult = evaluateRules(extracted);

    // --- 5. Get current metrics ---
    let { data: metrics } = await supabase.from('user_metrics').select('*').eq('user_id', userId).limit(1).single();
    if (!metrics) {
      await supabase.from('user_metrics').insert({ user_id: userId, current_skill_score: 50 });
      ({ data: metrics } = await supabase.from('user_metrics').select('*').eq('user_id', userId).limit(1).single());
    }

    const { newScore, newStreak } = computeSkillScore(
      metrics.current_skill_score,
      rulesResult.violations,
      metrics.consecutive_disciplined_days
    );

    // --- 6. Upload screenshot to Supabase Storage ---
    let screenshotPath = null;
    try {
      const fileName = `screenshot_${journalDate}_${Date.now()}.png`;
      const buffer = Buffer.from(imageBase64, 'base64');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(fileName, buffer, { contentType: mimeType, upsert: false });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(fileName);
        screenshotPath = publicUrl;
      }
    } catch (e) { console.warn('Storage upload failed:', e.message); }

    // --- 7. Insert journal ---
    const { data: journal, error: journalError } = await supabase.from('daily_journals').insert({
      user_id: userId,
      date: journalDate,
      total_pnl: extracted.total_pnl || 0,
      num_trades: extracted.num_trades || 0,
      strategy_used: extracted.strategy || 'credit_spread',
      margin_used: extracted.margin_used || 0,
      capital_buffer: extracted.capital_buffer || 0,
      credit_received: extracted.credit_received || 0,
      risk_reward_ratio: extracted.risk_reward_ratio || 0,
      rule_violations: rulesResult.violations,
      is_gambling: rulesResult.isGambling,
      skill_score: newScore,
      screenshot_path: screenshotPath,
      raw_extraction: extracted,
      tags: tags,
      diary_notes: diary
    }).select().single();

    if (journalError) throw journalError;

    // --- 8. Insert trades ---
    const tradeResponses = [];
    if ((extracted.trades || []).length > 0) {
      const tradesToInsert = extracted.trades.map(t => ({
        journal_id: journal.id,
        ticker: t.ticker || 'UNKNOWN',
        option_type: t.option_type || 'credit_spread',
        strike_short: t.strike_short || null,
        strike_long: t.strike_long || null,
        expiry: t.expiry || null,
        credit_received: t.credit_received || 0,
        max_risk: t.max_risk || 0,
        risk_reward_ratio: t.risk_reward_ratio || 0,
        pnl: t.pnl || 0,
        is_winner: t.is_winner || (t.pnl > 0)
      }));
      const { data: insertedTrades } = await supabase.from('trades').insert(tradesToInsert).select();
      tradeResponses.push(...(insertedTrades || []));
    }

    // --- 9. Update metrics ---
    const isWinningDay = (extracted.total_pnl || 0) > 0;
    const newTotal = metrics.total_entries + 1;
    const newWins = metrics.total_wins + (isWinningDay ? 1 : 0);
    const rr = extracted.risk_reward_ratio || 0;
    const newActualRR = metrics.actual_rr_sum + rr;
    await supabase.from('user_metrics').update({
      current_skill_score: newScore,
      total_entries: newTotal,
      total_wins: newWins,
      win_rate: (newWins / newTotal) * 100,
      consecutive_disciplined_days: newStreak,
      last_gambling_timestamp: rulesResult.isGambling ? new Date().toISOString() : metrics.last_gambling_timestamp,
      avg_risk_reward: rr > 0 ? newActualRR / newTotal : metrics.avg_risk_reward,
      expected_rr_sum: metrics.expected_rr_sum + (rr > 0 ? 2.0 : 0),
      actual_rr_sum: newActualRR,
      updated_at: new Date().toISOString()
    }).eq('id', metrics.id).eq('user_id', userId);

    res.json({
      message: 'Screenshot analyzed successfully',
      journal_id: journal.id,
      date: journalDate,
      total_pnl: extracted.total_pnl || 0,
      num_trades: extracted.num_trades || 0,
      rule_violations: rulesResult.violations,
      is_gambling: rulesResult.isGambling,
      skill_score: newScore,
      trades: tradeResponses,
      tags: tags
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
