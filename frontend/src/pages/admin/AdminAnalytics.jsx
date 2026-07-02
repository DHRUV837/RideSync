import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const tooltipStyle = {
  contentStyle: { background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-strong)', borderRadius: 10 },
  labelStyle: { color: 'var(--text-primary)' }
};

const PIE_COLORS = ['#00d4aa', '#7c6af5', '#4f9cf9', '#f5a623'];
const CHART_COLORS = ['#00d4aa', '#7c6af5', '#4f9cf9', '#f5a623', '#ff6b6b'];

export default function AdminAnalytics({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const analyticsRes = await adminService.getAnalytics();
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-left">
            <h1>Analytics 📈</h1>
            <p>Detailed platform metrics and insights</p>
          </div>
        </div>
        <div className="page-content">
          <div className="stats-grid stagger">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card skeleton">
                <div style={{ height: 150, background: 'var(--bg-card)', borderRadius: 8 }} />
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
            <h1>Analytics 📈</h1>
            <p>Detailed platform metrics and insights</p>
          </div>
        </div>
        <div className="page-content">
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>Unable to load analytics</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error || 'No data available'}</p>
          </div>
        </div>
      </>
    );
  }

  const { platformOverview, rideAnalytics, revenueAnalytics, complaintAnalytics, bookingAnalytics, driverPerformance, userActivity, monthlyGrowth } = analytics;

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
    return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const monthlyRideData = monthlyGrowth?.monthlyRideCounts || [];
  const monthlyRevenueData = monthlyGrowth?.monthlyRevenues || [];
  const rideStatusData = [
    { name: 'Pending', value: rideAnalytics?.totalRides ? (rideAnalytics.totalRides - rideAnalytics.activeRides - rideAnalytics.completedRides - rideAnalytics.cancelledRides) : 0 },
    { name: 'Ongoing', value: rideAnalytics?.activeRides || 0 },
    { name: 'Completed', value: rideAnalytics?.completedRides || 0 },
    { name: 'Cancelled', value: rideAnalytics?.cancelledRides || 0 },
  ];
  const complaintStatusData = [
    { name: 'Pending', value: complaintAnalytics?.pendingComplaints || 0 },
    { name: 'Under Review', value: complaintAnalytics?.underReview || 0 },
    { name: 'Resolved', value: complaintAnalytics?.resolved || 0 },
    { name: 'Rejected', value: complaintAnalytics?.rejected || 0 },
  ];
  const topDriversByTrips = driverPerformance?.driversByCompletedTrips?.slice(0, 5) || [];
  const topRatedDrivers = driverPerformance?.topRatedDrivers?.slice(0, 5) || [];
  const lowestRatedDrivers = driverPerformance?.lowestRatedDrivers?.slice(0, 5) || [];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Analytics 📈</h1>
          <p>Detailed platform metrics and insights</p>
        </div>
      </div>

      <div className="page-content">
        {/* Monthly Growth Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Monthly Ride Count - Bar Chart */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Monthly Ride Count (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRideData} margin={{ left: -20 }}>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={v => [`${v} rides`, 'Count']} />
                <Bar dataKey="rideCount" fill="url(#rideGrad)" radius={[3, 3, 0, 0]} />
                <defs>
                  <linearGradient id="rideGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c6af5" />
                    <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue - Line Chart */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Monthly Revenue (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyRevenueData} margin={{ left: -20 }}>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={v => [formatCurrency(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Ride Status Distribution - Doughnut Chart */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Ride Status Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={rideStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" paddingAngle={3}>
                    {rideStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={v => [v, 'Rides']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rideStatusData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>{item.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14, color: PIE_COLORS[i] }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Complaint Status Distribution - Pie Chart */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Complaint Status Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={complaintStatusData} cx="50%" cy="50%" outerRadius={80}
                    dataKey="value" paddingAngle={3}>
                    {complaintStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={v => [v, 'Complaints']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {complaintStatusData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>{item.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14, color: PIE_COLORS[i] }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Platform Overview */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Platform Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Users</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{platformOverview?.totalUsers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Drivers</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{platformOverview?.totalDrivers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Riders</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{platformOverview?.totalRiders || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Verified Drivers</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#00d4aa' }}>{platformOverview?.verifiedDrivers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Blocked Users</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#ff6b6b' }}>{platformOverview?.blockedUsers || 0}</span>
              </div>
            </div>
          </div>

          {/* Ride Analytics */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Ride Analytics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Rides</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{rideAnalytics?.totalRides || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Active Rides</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#7c6af5' }}>{rideAnalytics?.activeRides || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Completed Rides</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#00d4aa' }}>{rideAnalytics?.completedRides || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cancelled Rides</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#ff6b6b' }}>{rideAnalytics?.cancelledRides || 0}</span>
              </div>
            </div>
          </div>

          {/* Revenue Analytics */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Revenue Analytics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Revenue</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{formatCurrency(revenueAnalytics?.totalRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Today's Revenue</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{formatCurrency(revenueAnalytics?.todayRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>This Month</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{formatCurrency(revenueAnalytics?.currentMonthRevenue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Top 5 Drivers by Completed Trips - Horizontal Bar Chart */}
          <div className="card">
            <div className="section-header">
              <div><h2>Top 5 Drivers by Completed Trips</h2><p>Most active drivers</p></div>
            </div>
            {topDriversByTrips.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topDriversByTrips} layout="vertical" margin={{ left: 120 }}>
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="driverName" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={v => [`${v} trips`, 'Completed']} />
                  <Bar dataKey="completedTrips" fill="#7c6af5" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No driver data available</div>
            )}
          </div>

          {/* Top 5 Highest Rated Drivers */}
          <div className="card">
            <div className="section-header">
              <div><h2>Top 5 Highest Rated Drivers</h2><p>Best performers</p></div>
            </div>
            {topRatedDrivers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topRatedDrivers.map((driver, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--glass-border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>#{i + 1} {driver.driverName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{driver.totalRatings} ratings</div>
                    </div>
                    <div style={{
                      padding: '6px 12px', background: 'linear-gradient(135deg, #00d4aa, #7c6af5)',
                      borderRadius: 20, fontWeight: 700, fontSize: 16, color: 'white'
                    }}>
                      ⭐ {driver.averageRating?.toFixed(1) || '0.0'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No rating data available</div>
            )}
          </div>
        </div>

        {/* Booking & User Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Booking Analytics */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Booking Analytics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Bookings</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{bookingAnalytics?.totalBookings || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Completed Bookings</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#00d4aa' }}>{bookingAnalytics?.completedBookings || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cancelled Bookings</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#ff6b6b' }}>{bookingAnalytics?.cancelledBookings || 0}</span>
              </div>
            </div>
          </div>

          {/* User Activity */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>User Activity (This Month)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>New Users</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{userActivity?.newUsersThisMonth || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>New Drivers</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{userActivity?.newDriversThisMonth || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>New Riders</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{userActivity?.newRidersThisMonth || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
