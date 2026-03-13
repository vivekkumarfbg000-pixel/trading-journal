import { useState, useRef } from 'react';
import { uploadScreenshot } from '../api';
import './UploadZone.css';

const BROKERAGES = [
  'Unknown', 'Thinkorswim', 'Interactive Brokers', 'Robinhood',
  'Zerodha', 'Tastytrade', 'Webull', 'TradingView', 'E*TRADE',
  'Charles Schwab', 'Fidelity', 'TD Ameritrade', 'Other'
];

const MOODS = [
  { value: 'calm', emoji: '🧘', label: 'Calm' },
  { value: 'focused', emoji: '🎯', label: 'Focused' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'fomo', emoji: '🔥', label: 'FOMO' },
  { value: 'tilted', emoji: '😤', label: 'Tilted' }
];

export default function UploadZone({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [brokerage, setBrokerage] = useState('Unknown');
  const [tags, setTags] = useState('');
  const [diary, setDiary] = useState('');
  const [mood, setMood] = useState('calm');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = async (file) => {
    setError(null);
    setResult(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      const data = await uploadScreenshot(file, brokerage.toLowerCase(), tagArray, diary, mood);
      setResult(data);
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setResult(null);
    setError(null);
    setPreview(null);
    setTags('');
    setDiary('');
    setMood('calm');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="card animate-in upload-zone-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📸</span> Upload Daily Screenshot
        </span>
        <div className="upload-header-inputs">
          <select
            className="brokerage-select"
            value={brokerage}
            onChange={(e) => setBrokerage(e.target.value)}
          >
            {BROKERAGES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <input 
            type="text" 
            className="tag-input" 
            placeholder="Add tags (e.g. Breakout, FOMO)" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="mood-picker">
          {MOODS.map(m => (
            <button
              key={m.value}
              className={`mood-btn ${mood === m.value ? 'active' : ''}`}
              onClick={() => setMood(m.value)}
              title={m.label}
              type="button"
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {!result ? (
        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="screenshot-upload"
          />

          {isUploading ? (
            <div className="upload-progress">
              <div className="spinner"></div>
              <p className="upload-status">Analyzing screenshot with AI...</p>
              <p className="upload-hint">Extracting trades, P&L, and positions</p>
            </div>
          ) : preview ? (
            <div className="upload-preview">
              <img src={preview} alt="Preview" />
              <p className="upload-hint">Processing...</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="upload-text">Drop your trading screenshot here</p>
              <p className="upload-hint">or click to browse • PNG, JPG, WEBP</p>
            </div>
          )}
        </div>
      ) : null}

      {!result && (
        <div className="upload-reflection">
          <label className="reflection-label">Daily Reflection (Diary)</label>
          <textarea 
            className="reflection-textarea"
            placeholder="How were you feeling today? Any FOMO, revenge trading thoughts, or was it a disciplined day?"
            value={diary}
            onChange={(e) => setDiary(e.target.value)}
          />
        </div>
      )}

      {result && (
        <div className="upload-result">
          <div className={`result-badge ${result.is_gambling ? 'badge-danger' : 'badge-success'}`}>
            {result.is_gambling ? '⚠️ Violations Detected' : '✅ All Rules Passed'}
          </div>

          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">Date</span>
              <span className="result-value mono">{result.date}</span>
            </div>
            <div className="result-item">
              <span className="result-label">P&L</span>
              <span className={`result-value mono ${result.total_pnl >= 0 ? 'text-green' : 'text-red'}`}>
                ${result.total_pnl?.toFixed(2)}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Trades</span>
              <span className="result-value mono">{result.num_trades}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Skill Score</span>
              <span className="result-value mono text-cyan">{result.skill_score?.toFixed(1)}</span>
            </div>
          </div>

          {result.rule_violations?.length > 0 && (
            <div className="violations-list">
              {result.rule_violations.map((v, i) => (
                <div key={i} className="violation-tag">🚨 {v}</div>
              ))}
            </div>
          )}

          {result.trades?.length > 0 && (
            <div className="extracted-trades">
              <span className="result-label" style={{ marginBottom: '8px', display: 'block' }}>
                Extracted Trades
              </span>
              {result.trades.map((t, i) => (
                <div key={i} className="trade-row">
                  <span className="trade-ticker">{t.ticker}</span>
                  <span className="trade-type">{t.option_type}</span>
                  <span className={`trade-pnl mono ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                    ${t.pnl?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button className="btn-reset" onClick={resetUpload}>Upload Another</button>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <span>❌</span> {error}
        </div>
      )}
    </div>
  );
}
