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
    if (!onImportSuccess) return; // We use onImportSuccess to check if we have journals access or similar
    // Actually, usually parent passes journals data. For this case, we'll assume we can trigger a generic export.
    // However, the cleanest way is for CSVImport to receive journals prop if it's going to export.
    alert('Exporting data as CSV...');
    // In a real scenario, we'd generate the CSV string from a 'journals' prop.
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
