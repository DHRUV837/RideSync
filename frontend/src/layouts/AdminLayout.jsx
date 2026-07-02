import { useState } from 'react';
import { useApp } from '../context/AppContext';

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Overview', icon: '📊', badge: null },
  { id: 'users', label: 'User Management', icon: '👥', badge: null },
  
  { id: 'complaints', label: 'Complaints', icon: '🚨', badge: '2' },
  { id: 'analytics', label: 'Analytics', icon: '📈', badge: null },
];

export default function AdminLayout({ children, activePage, onNavigate }) {
  const { user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg,#f53b6e,#7c6af5)' }}>👨‍💼</div>
          <div className="sidebar-logo-text">
            <h2>RideSync</h2>
            <span>Admin Console</span>
          </div>
        </div>

        <p className="sidebar-section-label">Management</p>
        <nav className="sidebar-nav">
          {ADMIN_NAV.map(item => (
            <button
              key={item.id}
              id={`nav-admin-${item.id}`}
              className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item-badge" style={{ background: '#f53b6e' }}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={logout}>
            <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg,#f53b6e,#7c6af5)', fontSize: 12 }}>
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
