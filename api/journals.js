/**
 * Vercel Serverless Function: GET /api/journals
 */

import { supabase } from './lib/supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- Verify User ---
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = user.id;

  // DELETE /api/journals?id=123
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing journal id' });
    const { error } = await supabase.from('daily_journals').delete().eq('id', id).eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: `Journal ${id} deleted` });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let query = supabase.from('daily_journals').select(`*, trades(*)`).eq('user_id', userId).order('date', { ascending: false });
    if (req.query.start_date) query = query.gte('date', req.query.start_date);
    if (req.query.end_date)   query = query.lte('date', req.query.end_date);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
