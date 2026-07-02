import { formatStatisticsForDisplay } from '../../services/StatisticsService';

export default function OptimizationStatistics({ statistics }) {
  if (!statistics) return null;

  const formatted = formatStatisticsForDisplay(statistics);

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Optimization Statistics</h3>
      
      {/* Core route metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { icon: '📏', label: 'Original Distance', value: formatted.originalDistance, sub: 'Before optimization', color: 'gray' },
          { icon: '🎯', label: 'Optimized Distance', value: formatted.optimizedDistance, sub: 'After optimization', color: 'green' },
          { icon: '📉', label: 'Distance Saved', value: formatted.distanceSaved, sub: 'Reduction in travel', color: 'green' },
          { icon: '⏱️', label: 'Optimization Time', value: formatted.totalTime, sub: 'Solver + OSRM', color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color}`}>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Savings and passenger metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { icon: '⛽', label: 'Fuel Saved', value: formatted.fuelSaved, sub: `Based on ${statistics.fuelMileage} km/L`, color: 'green' },
          { icon: '💵', label: 'Estimated Money Saved', value: formatted.moneySaved, sub: `At ₹${statistics.fuelPrice}/L`, color: 'green' },
          { icon: '🧾', label: 'Average Passenger Fare', value: formatted.averageFare || '₹0', sub: 'Per rider segment', color: 'blue' },
          { icon: '💰', label: 'Total Driver Earnings', value: formatted.totalEarnings || '₹0', sub: 'Estimated from fares', color: 'blue' },
        ].map((stat, i) => (
          <div key={i + 3} className={`stat-card ${stat.color}`}>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Accepted rider and performance metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: '🚗', label: 'Accepted Riders', value: statistics.acceptedRiders, sub: 'Passengers to pick up', color: 'blue' },
          { icon: '📍', label: 'Pickup Stops', value: statistics.pickupStops, sub: 'Intermediate stops', color: 'blue' },
          { icon: '🤖', label: 'Solver Time', value: formatted.solverTime, sub: 'OR-Tools execution', color: 'purple' },
          { icon: '🗺️', label: 'OSRM Routing Time', value: formatted.osrmTime, sub: 'Road routing calculation', color: 'purple' },
        ].map((stat, i) => (
          <div key={i + 6} className={`stat-card ${stat.color}`}>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
