import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';

export default function AdminDashboard({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const [analyticsRes, complaintsRes] = await Promise.all([
          adminService.getAnalytics(),
          adminService.getComplaints(),
        ]);
        setAnalytics(analyticsRes.data);
        setComplaints(complaintsRes.data || []);
      } catch (err) {
        console.error('Failed to load overview:', err);
        setError('Failed to load overview data');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-left">
            <h1>Overview 📊</h1>
            <p>Platform health and activity summary</p>
          </div>
        </div>
        <div className="page-content">
          <div className="stats-grid stagger">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card skeleton">
                <div className="stat-icon skeleton-shimmer" />
                <div className="stat-value skeleton-shimmer" />
                <div className="stat-label skeleton-shimmer" />
                <div className="stat-change skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !analytics) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-left">
            <h1>Overview 📊</h1>
            <p>Platform health and activity summary</p>
          </div>
        </div>
        <div className="page-content">
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>Unable to load overview</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error || 'No data available'}</p>
          </div>
        </div>
      </>
    );
  }

  const { platformOverview, rideAnalytics, revenueAnalytics, complaintAnalytics } = analytics;
  const openComplaints = complaints.filter(c => c.status === 'pending' || c.status === 'under_review').length;

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
    return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Overview 📊</h1>
          <p>Platform health and activity summary</p>
        </div>
      </div>

      <div className="page-content">
        {/* Key Stats */}
        <div className="stats-grid stagger">
          {[
            { icon: '👥', val: platformOverview?.totalUsers || 0, label: 'Total Users', sub: `${platformOverview?.totalDrivers || 0} drivers, ${platformOverview?.totalRiders || 0} riders`, color: 'green' },
            { icon: '🚗', val: rideAnalytics?.totalRides || 0, label: 'Total Rides', sub: `${rideAnalytics?.activeRides || 0} active right now`, color: 'purple' },
            { icon: '💰', val: formatCurrency(revenueAnalytics?.totalRevenue), label: 'Total Revenue', sub: `${formatCurrency(revenueAnalytics?.currentMonthRevenue)} this month`, color: 'blue' },
            { icon: '🚨', val: openComplaints, label: 'Open Complaints', sub: 'Needs attention', color: 'orange' },
          ].map((s, i) => (
            <div key={i} className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-change up">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Quick Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Verified Drivers</span>
                <span style={{ fontWeight: 600 }}>{platformOverview?.verifiedDrivers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Completed Rides</span>
                <span style={{ fontWeight: 600, color: '#00d4aa' }}>{rideAnalytics?.completedRides || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Today's Revenue</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(revenueAnalytics?.todayRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Complaint Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending</span>
                <span style={{ fontWeight: 600, color: '#f5a623' }}>{complaintAnalytics?.pendingComplaints || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Under Review</span>
                <span style={{ fontWeight: 600, color: '#4f9cf9' }}>{complaintAnalytics?.underReview || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Resolved</span>
                <span style={{ fontWeight: 600, color: '#00d4aa' }}>{complaintAnalytics?.resolved || 0}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => onNavigate('users')} style={{ width: '100%' }}>
                👥 Manage Users
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate('complaints')} style={{ width: '100%' }}>
                🚨 View Complaints
              </button>
              <button className="btn btn-primary" onClick={() => onNavigate('analytics')} style={{ width: '100%' }}>
                📈 View Full Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="section-header">
            <div><h2>Recent Complaints</h2></div>
            <button id="view-all-complaints" className="btn btn-secondary btn-sm" onClick={() => onNavigate('complaints')}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {complaints.length > 0 ? (
              complaints.slice(0, 3).map(c => (
                <div key={c.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)', padding: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      🚨 Against {c.respondentName || c.respondentEmail || 'User'}
                    </span>
                    <span className={`badge ${c.status === 'open' ? 'badge-danger' : c.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>By {c.complainantName} • {new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No complaints</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
