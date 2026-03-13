/**
 * Vercel Serverless Function: /api/playbooks
 * CRUD for trading playbooks (strategy templates)
 * 
 * GET    - list all playbooks for user
 * POST   - create a new playbook
 * PATCH  - update a playbook
 * DELETE - delete a playbook (?id=xxx)
 */

import { supabase } from './lib/supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  const userId = user.id;

  try {
    // GET — list playbooks
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }

    // POST — create playbook
    if (req.method === 'POST') {
      const { name, strategy_type, entry_rules, exit_rules, position_sizing, checklist, target_rr, max_loss_per_day } = req.body;
      if (!name) return res.status(400).json({ error: 'Playbook name required' });

      const { data, error } = await supabase.from('playbooks').insert({
        user_id: userId,
        name,
        strategy_type: strategy_type || 'credit_spread',
        entry_rules: entry_rules || [],
        exit_rules: exit_rules || [],
        position_sizing: position_sizing || '',
        checklist: checklist || [],
        target_rr: target_rr || 2.0,
        max_loss_per_day: max_loss_per_day || 500
      }).select().single();
      if (error) throw error;
      return res.json(data);
    }

    // PATCH — update playbook
    if (req.method === 'PATCH') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing playbook id' });
      const { data, error } = await supabase
        .from('playbooks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    // DELETE
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing playbook id' });
      const { error } = await supabase.from('playbooks').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return res.json({ message: 'Playbook deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Playbooks error:', err);
    res.status(500).json({ error: err.message });
  }
}
