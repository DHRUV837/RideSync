import { useState } from 'react';
import { useApp } from '../context/AppContext';

const RIDER_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', badge: null },
  { id: 'search', label: 'Find a Ride', icon: '🔍', badge: null },
  { id: 'bookings', label: 'My Bookings', icon: '🎫', badge: '1' },
  { id: 'tracking', label: 'Live Tracking', icon: '📍', badge: null },
  { id: 'carbon', label: 'Carbon Savings', icon: '🌿', badge: null },
  { id: 'history', label: 'Ride History', icon: '📋', badge: null },
];

export default function RiderLayout({ children, activePage, onNavigate }) {
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
            <span>Rider Portal</span>
          </div>
        </div>

        <p className="sidebar-section-label">Navigation</p>
        <nav className="sidebar-nav">
          {RIDER_NAV.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
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
            <div className="sidebar-avatar">{user?.avatar}</div>
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
