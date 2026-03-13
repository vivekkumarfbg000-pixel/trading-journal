/**
 * Vercel Serverless Function: GET /api/journals
 */

import { supabase } from './lib/supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, PATCH, OPTIONS');
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

  // PATCH /api/journals — update diary_notes, tags, emotional_state
  if (req.method === 'PATCH') {
    const { id, diary_notes, tags, emotional_state } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing journal id' });
    const updates = {};
    if (diary_notes !== undefined) updates.diary_notes = diary_notes;
    if (tags !== undefined) updates.tags = tags;
    if (emotional_state !== undefined) updates.emotional_state = emotional_state;
    const { data, error } = await supabase.from('daily_journals')
      .update(updates).eq('id', id).eq('user_id', userId).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
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
