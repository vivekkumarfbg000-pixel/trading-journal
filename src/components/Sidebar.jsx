import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'chat', label: 'AI Chat', icon: '💬' },
    { id: 'history', label: 'Trade History', icon: '📜' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'playbooks', label: 'Playbooks', icon: '📋' },
    { id: 'calendar', label: 'P&L Calendar', icon: '📅' },
    { id: 'mentor', label: 'AI Mentor', icon: '🤖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)}></div>}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🚀</span>
            {!collapsed && <span className="logo-text">Trading Journal</span>}
          </div>
          <button className="collapse-btn desktop-only" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
          <button className="collapse-btn mobile-only" onClick={() => setMobileOpen(false)}>
            ✕
          </button>
        </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {activeTab === item.id && !collapsed && <div className="active-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="footer-status">
            <div className="status-dot online"></div>
            <span>System Active</span>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
