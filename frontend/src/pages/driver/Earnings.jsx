import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { rideService } from '../../services/apiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const monthlyData = [
  { month: 'Jan', amount: 8200 }, { month: 'Feb', amount: 9400 },
  { month: 'Mar', amount: 7800 }, { month: 'Apr', amount: 11200 },
  { month: 'May', amount: 10600 }, { month: 'Jun', amount: 12360 },
];

const tooltipStyle = {
  contentStyle: { background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-strong)', borderRadius: 10 },
  labelStyle: { color: 'var(--text-primary)' }
};

export default function Earnings() {
  const { user } = useApp();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await rideService.getDriverAnalytics(user.id);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to load driver analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadAnalytics();
    }
  }, [user]);

  const weeklyData = analytics?.weeklyEarnings || [];
  const monthlyTrend = analytics?.monthlyTrend || monthlyData;
  const recentRides = analytics?.recentRides || [];
  const recentReviews = analytics?.recentReviews || [];
  const totalMonth = analytics?.totalThisMonth ?? 0;
  const totalWeek = analytics?.totalThisWeek ?? 0;
  const avgRide = analytics?.avgPerRide ?? 0;
  const avgPassenger = analytics?.avgPerPassenger ?? 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Earnings Dashboard 💰</h1>
          <p>Your financial performance</p>
        </div>
        <div className="topbar-right">
          <button id="withdraw-btn" className="btn btn-primary">💳 Withdraw</button>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-grid stagger" style={{ marginBottom: 24 }}>
          <div className="stat-card green">
            <div className="stat-icon green">💰</div>
            <div className="stat-value">₹{loading ? '…' : totalMonth.toLocaleString()}</div>
            <div className="stat-label">Total This Month</div>
            <div className="stat-change up">{loading ? 'Loading…' : 'Live earnings from bookings'}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon purple">📅</div>
            <div className="stat-value">₹{loading ? '…' : totalWeek.toLocaleString()}</div>
            <div className="stat-label">This Week</div>
            <div className="stat-change up">{loading ? 'Loading…' : 'Based on recent confirmed rides'}</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon blue">🚗</div>
            <div className="stat-value">₹{loading ? '…' : avgRide.toFixed(0)}</div>
            <div className="stat-label">Avg per Ride</div>
            <div className="stat-change up">{loading ? 'Loading…' : `Over ${recentRides.length} rides`}</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon orange">👥</div>
            <div className="stat-value">₹{loading ? '…' : avgPassenger.toFixed(0)}</div>
            <div className="stat-label">Avg per Passenger</div>
            <div className="stat-change up">{loading ? 'Loading…' : `${analytics?.totalPassengers ?? 0} passengers`}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Weekly */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>This Week</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData.length ? weeklyData : [{ label: 'No Data', amount: 0 }]} margin={{ left: -20 }}>
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(value)=> [`₹${value}`, 'Earnings']} />
                <Bar dataKey="value" fill="url(#barGrad2)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4aa" />
                    <stop offset="100%" stopColor="#7c6af5" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>Monthly Trend (2026)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyTrend.length ? monthlyTrend : monthlyData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="value" stroke="#00d4aa" strokeWidth={3}
                  dot={{ fill: '#00d4aa', r: 4 }} activeDot={{ r: 6, fill: '#7c6af5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Rides */}
        <div className="card">
          <div className="section-header">
            <div><h2>Recent Rides</h2><p>Last 5 completed rides</p></div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Passengers</th>
                  <th>Distance</th>
                  <th>Earnings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentRides.length ? recentRides : [{ id: 'none', date: '-', passengers: 0, distance: '-', earnings: 0, status: 'N/A' }]).map(ride => (
                  <tr key={ride.id} id={`earning-ride-${ride.id}`}>
                    <td>{ride.date}</td>
                    <td><span style={{ color: 'var(--text-primary)' }}>👥 {ride.passengers}</span></td>
                    <td>{ride.distance}</td>
                    <td><span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>₹{ride.earnings}</span></td>
                    <td><span className={`badge ${ride.status?.toLowerCase() === 'completed' ? 'badge-success' : 'badge-secondary'}`}>{ride.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Recent Reviews */}
<div className="card" style={{ marginTop: 24 }}>
  <div className="section-header">
    <div>
      <h2>Recent Reviews ⭐</h2>
      <p>Latest ratings from your riders</p>
    </div>
  </div>

  {recentReviews.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {recentReviews.map((review, index) => (
        <div
          key={index}
          style={{
            padding: 16,
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            background: 'var(--bg-secondary)'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8
          }}>
            <strong>{review.riderName}</strong>
            <span>{review.date}</span>
          </div>

          <div style={{
            color: '#FFD700',
            fontSize: 18,
            marginBottom: 8
          }}>
            {'⭐'.repeat(review.rating)}
          </div>

          <div style={{
            color: 'var(--text-muted)',
            fontStyle: 'italic'
          }}>
            {review.review && review.review.trim() !== ''
              ? `"${review.review}"`
              : 'No written review'}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p style={{ color: 'var(--text-muted)' }}>
      No reviews yet.
    </p>
  )}
</div>
      </div>
    </>
  );
}
