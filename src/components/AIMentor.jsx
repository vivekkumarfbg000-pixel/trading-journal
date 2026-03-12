import { useState, useEffect } from 'react';
import { getMentorAnalysis } from '../api';
import './AIMentor.css';

export default function AIMentor() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMentorAnalysis();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="mentor-loading card animate-in">
        <div className="spinner"></div>
        <h3>AI Mentor is analyzing your behavior...</h3>
        <p>Connecting dots between your trades, strategy, and discipline.</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mentor-error card animate-in">
        <span className="icon">⚠️</span>
        <h3>Couldn't get AI analysis</h3>
        <p>{error || "Try uploading more trade history first."}</p>
        <button onClick={fetchAnalysis} className="btn-retry">Retry Analysis</button>
      </div>
    );
  }

  return (
    <div className="mentor-container animate-in">
      {/* Summary Header */}
      <div className="card mentor-hero">
        <div className="hero-content">
          <div className="hero-badge">AI MINDSHARE</div>
          <h2>Mental Performance Assessment</h2>
          <p className="summary-text">"{analysis.summary}"</p>
          <div className="discipline-meter">
            <div className="meter-label">
              <span>Discipline Rating</span>
              <span className="text-cyan">{analysis.discipline_rating}/100</span>
            </div>
            <div className="meter-bar">
              <div 
                className="meter-fill" 
                style={{ 
                  width: `${analysis.discipline_rating}%`,
                  background: analysis.discipline_rating > 70 ? 'var(--accent-cyan)' : analysis.discipline_rating > 40 ? 'var(--accent-amber)' : 'var(--accent-red)'
                }}
              ></div>
            </div>
          </div>
        </div>
        <div className="hero-icon">🤖</div>
      </div>

      <div className="mentor-grid">
        {/* Strengths */}
        <div className="card mentor-card highlight-green">
          <div className="card-header">
            <span className="card-title">Strengths</span>
          </div>
          <ul className="mentor-list">
            {analysis.strengths?.map((s, i) => (
              <li key={i}>✅ {s}</li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="card mentor-card highlight-red">
          <div className="card-header">
            <span className="card-title">Behavioral Risks</span>
          </div>
          <ul className="mentor-list">
            {analysis.weaknesses?.map((w, i) => (
              <li key={i}>🚨 {w}</li>
            ))}
          </ul>
        </div>

        {/* Action Plan */}
        <div className="card mentor-card highlight-blue full-width">
          <div className="card-header">
            <span className="card-title">Action Plan for v3 Improvement</span>
          </div>
          <div className="action-steps">
            {analysis.action_plan?.map((step, i) => (
              <div key={i} className="action-step">
                <span className="step-num">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
