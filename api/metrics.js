/**
 * Vercel Serverless Function: GET /api/metrics
 */

import { supabase } from './lib/supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- Verify User ---
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = user.id;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let { data: metrics, error } = await supabase.from('user_metrics').select('*').eq('user_id', userId).limit(1).single();

    if (error || !metrics) {
      const { data: created } = await supabase.from('user_metrics').insert({ user_id: userId, current_skill_score: 50 }).select().single();
      metrics = created;
    }

    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
