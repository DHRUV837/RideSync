import { useState } from 'react';
import { useApp } from '../context/AppContext';

const DRIVER_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', badge: null },
  { id: 'create', label: 'Create Ride', icon: '➕', badge: null },
  { id: 'requests', label: 'Passenger Requests', icon: '📥', badge: '2' },
  { id: 'route', label: 'Optimized Route', icon: '🗺️', badge: null },
  { id: 'earnings', label: 'Earnings', icon: '💰', badge: null },
  { id: 'history', label: 'Ride History', icon: '📋', badge: null },
];

export default function DriverLayout({ children, activePage, onNavigate }) {
  const { user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🚗</div>
          <div className="sidebar-logo-text">
            <h2>RideSync</h2>
            <span>Driver Portal</span>
          </div>
        </div>

        <p className="sidebar-section-label">Navigation</p>
        <nav className="sidebar-nav">
          {DRIVER_NAV.map(item => (
            <button
              key={item.id}
              id={`nav-driver-${item.id}`}
              className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={logout}>
            <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg, #7c6af5, #4f9cf9)' }}>
              {user?.avatar}
            </div>
            <div className="sidebar-user-info">
              <h4>{user?.name}</h4>
              <p>Sign out</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">
          ☰
        </button>
        {children}
      </div>
    </div>
  );
}
