import { useState, useEffect } from 'react';
import './Onboarding.css';

export default function Onboarding({ onComplete }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if haven't seen before
    const seen = localStorage.getItem('tj_onboarding_seen');
    if (!seen) {
      setIsVisible(true);
    }
  }, []);

  const handleStart = () => {
    setIsVisible(false);
    localStorage.setItem('tj_onboarding_seen', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="onboarding-overlay" onClick={e => e.stopPropagation()}>
      <div className="onboarding-card animate-in">
        <div className="onboarding-header">
          <span className="onboarding-icon">🚀</span>
          <h2 className="onboarding-title">Welcome to Trading Journal v5</h2>
          <p className="onboarding-subtitle">Your AI-powered trading copilot & performance suite.</p>
        </div>

        <div className="onboarding-steps">
          <div className="onboard-step">
            <span className="onboard-step-icon">📤</span>
            <div className="onboard-step-content">
              <h3>1. Upload Screenshots</h3>
              <p>Drag & drop broker screenshots on the Dashboard. AI vision extracts P&L, tickers, and trades automatically.</p>
            </div>
          </div>
          <div className="onboard-step">
            <span className="onboard-step-icon">🤖</span>
            <div className="onboard-step-content">
              <h3>2. Chat with your Data</h3>
              <p>Use the new AI Chat to ask questions about your trading history, patterns, and performance.</p>
            </div>
          </div>
          <div className="onboard-step">
            <span className="onboard-step-icon">📋</span>
            <div className="onboard-step-content">
              <h3>3. Build Playbooks</h3>
              <p>Define your strategy rules, checklists, and position sizing in the Playbooks tab to maintain discipline.</p>
            </div>
          </div>
          <div className="onboard-step">
            <span className="onboard-step-icon">⌨️</span>
            <div className="onboard-step-content">
              <h3>4. Power User Shortcuts</h3>
              <p>Use keys 1-8 to quickly switch tabs. Press Tab at any time to navigate.</p>
            </div>
          </div>
        </div>

        <div className="onboarding-footer">
          <button className="onboarding-dismiss" onClick={handleStart}>
            Skip Tutorial
          </button>
          <button className="btn-start-trading" onClick={handleStart}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
