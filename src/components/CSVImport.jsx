import { useState } from 'react';
import { parseTradingCSV } from '../utils/csvParser';
import { bulkImport } from '../api';
import './CSVImport.css';

export default function CSVImport({ onImportSuccess, journals }) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccessCount(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const sessions = parseTradingCSV(text);
        
        await bulkImport(sessions);
        
        setSuccessCount(sessions.length);
        if (onImportSuccess) onImportSuccess();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!journals || journals.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = ['Date', 'Total P&L', 'Num Trades', 'Strategy', 'Skill Score', 'Risk Reward', 'Is Gambling', 'Violations', 'Tags', 'Diary Notes', 'Emotional State'];
    const rows = journals.map(j => [
      j.date,
      j.total_pnl?.toFixed(2) || '0',
      j.num_trades || 0,
      j.strategy_used || '',
      j.skill_score?.toFixed(1) || '',
      j.risk_reward_ratio?.toFixed(2) || '',
      j.is_gambling ? 'Yes' : 'No',
      (j.rule_violations || []).join('; '),
      (j.tags || []).join('; '),
      (j.diary_notes || '').replace(/,/g, ' '),
      j.emotional_state || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading_journal_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card animate-in csv-import-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📂</span> Data Management
        </span>
      </div>
      
      <div className="import-body">
        <div className="data-actions">
          <div className="action-box">
            <h4>Bulk Import</h4>
            <p className="description">Import history from broker CSVs.</p>
            <button 
              className={`btn-import ${isImporting ? 'loading' : ''}`}
              onClick={() => document.getElementById('csv-upload').click()}
              disabled={isImporting}
            >
              {isImporting ? 'Processing...' : 'Upload CSV'}
            </button>
          </div>
          
          <div className="action-box">
            <h4>Data Export</h4>
            <p className="description">Download all records as CSV.</p>
            <button className="btn-export" onClick={handleExport}>
              Export All Data
            </button>
          </div>
        </div>

        {successCount > 0 && (
          <div className="import-success">
            ✅ Successfully parsed {successCount} daily sessions.
          </div>
        )}

        {error && (
          <div className="import-error">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}
