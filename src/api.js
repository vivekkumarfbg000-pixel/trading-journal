/**
 * API client — communicates with Vercel Serverless Functions
 * Images are sent as base64 JSON (no multipart needed).
 */

import { supabase } from './lib/supabaseClient';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : ''
  };
}

/** Convert a File object to base64 string */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is "data:image/png;base64,XXXXX" — strip the prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadScreenshot(file, brokerage = 'unknown', tags = [], diary = '') {
  const imageBase64 = await fileToBase64(file);
  const mimeType = file.type || 'image/png';

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ imageBase64, mimeType, brokerage, tags, diary })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function getJournals(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate)   params.set('end_date', endDate);

  const url = `${API_BASE}/api/journals${params.toString() ? '?' + params : ''}`;
  const res = await fetch(url, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch journals');
  return res.json();
}

export async function getMetrics() {
  const res = await fetch(`${API_BASE}/api/metrics`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function deleteJournal(id) {
  const res = await fetch(`${API_BASE}/api/journals?id=${id}`, { 
    method: 'DELETE',
    headers: await getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete journal');
  return res.json();
}

export async function getMentorAnalysis() {
  const res = await fetch(`${API_BASE}/api/mentor`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch AI analysis');
  return res.json();
}

export async function bulkImport(sessions) {
  const res = await fetch(`${API_BASE}/api/bulk-import`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ sessions })
  });
  if (!res.ok) throw new Error('Bulk import failed');
  return res.json();
}

export async function getStrategyOptimization() {
  const res = await fetch(`${API_BASE}/api/optimize`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch optimization tips');
  return res.json();
}
