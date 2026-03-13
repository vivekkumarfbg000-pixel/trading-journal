import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import MetricsBar from './components/MetricsBar';
import UploadZone from './components/UploadZone';
import StatusWidget from './components/StatusWidget';
import SkillChart from './components/SkillChart';
import DailyLog from './components/DailyLog';
import RiskReward from './components/RiskReward';
import EquityCurve from './components/EquityCurve';
import TradingCalendar from './components/TradingCalendar';
import AIMentor from './components/AIMentor';
import RiskMetrics from './components/RiskMetrics';
import TagPerformance from './components/TagPerformance';
import CSVImport from './components/CSVImport';
import RiskOfRuin from './components/RiskOfRuin';
import StrategyOptimizer from './components/StrategyOptimizer';
import AITradeChat from './components/AITradeChat';
import WeeklyReport from './components/WeeklyReport';
import GoalsWidget from './components/GoalsWidget';
import DrawdownChart from './components/DrawdownChart';
import StreakTracker from './components/StreakTracker';
import TickerHeatmap from './components/TickerHeatmap';
import ExpectancyCalc from './components/ExpectancyCalc';
import { getJournals, getMetrics } from './api';
import './App.css';

import TradeDetailModal from './components/TradeDetailModal';

export default function App() {
  const [journals, setJournals] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJournal, setSelectedJournal] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!session) return;
    try {
      const [j, m] = await Promise.all([getJournals(), getMetrics()]);
      setJournals(j);
      setMetrics(m);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [session, fetchData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUploadSuccess = () => {
    fetchData();
    setActiveTab('dashboard');
  };

  const handleMetricClick = (tab) => {
    setActiveTab(tab);
  };

  const handleJournalClick = (journal) => {
    setSelectedJournal(journal);
  };

  const latestJournal = journals.length > 0 ? journals[0] : null;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <MetricsBar metrics={metrics} onMetricClick={handleMetricClick} />
            <GoalsWidget journals={journals} metrics={metrics} />
            <div className="grid-row-2">
              <UploadZone onUploadSuccess={handleUploadSuccess} />
              <StatusWidget metrics={metrics} latestJournal={latestJournal} />
            </div>
            <SkillChart journals={journals} />
            <RiskReward journals={journals} metrics={metrics} />
          </>
        );
      case 'chat':
        return <AITradeChat />;
      case 'history':
        return <DailyLog journals={journals} onRefresh={fetchData} onEntryClick={handleJournalClick} />;
      case 'analytics':
        return (
          <div className="analytics-view">
            <WeeklyReport journals={journals} />
            <RiskMetrics journals={journals} />
            <RiskOfRuin journals={journals} />
            <ExpectancyCalc journals={journals} />
            <EquityCurve journals={journals} />
            <DrawdownChart journals={journals} />
            <StreakTracker journals={journals} />
            <div className="grid-row-2" style={{ marginTop: 'var(--space-lg)' }}>
              <SkillChart journals={journals} />
              <RiskReward journals={journals} metrics={metrics} />
            </div>
            <TagPerformance journals={journals} />
            <TickerHeatmap journals={journals} />
            <StrategyOptimizer />
          </div>
        );
      case 'calendar':
        return <TradingCalendar journals={journals} />;
      case 'mentor':
        return <AIMentor />;
      case 'settings':
        return (
          <div className="settings-view animate-in">
            <div className="card">
              <h2>Account Settings</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <p>Profile: {session?.user?.email}</p>
                  <button onClick={handleSignOut} className="btn-signout">Sign Out</button>
                </div>
              </div>
            </div>
            <CSVImport onImportSuccess={fetchData} journals={journals} />
          </div>
        );
      default:
        return null;
    }
  };

  if (!session) return <Auth />;

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="app-content">
        <header className="top-bar">
          <div className="top-bar-title">
            {activeTab.replace('-', ' ')}
          </div>
          <div className="header-right">
            <div className="header-status">
              <span className={`header-dot ${latestJournal?.is_gambling ? 'dot-red' : 'dot-green'}`} />
              <span className="header-status-text">
                {latestJournal?.is_gambling ? 'Violations Active' : 'System Clear'}
              </span>
            </div>
          </div>
        </header>

        <main className="app-main">
          {loading ? (
            <div className="loading-screen">
              <div className="spinner" style={{ width: 48, height: 48 }} />
              <p>Loading your journal...</p>
            </div>
          ) : (
            renderContent()
          )}
        </main>

        <footer className="app-footer">
          <span>Trading Journal v4.0 Professional</span>
          <span className="text-muted">•</span>
          <span className="text-muted">High-Performance Strategy & Risk Suite</span>
        </footer>

        {selectedJournal && (
          <TradeDetailModal 
            journal={selectedJournal} 
            onClose={() => setSelectedJournal(null)} 
          />
        )}
      </div>
    </div>
  );
}
