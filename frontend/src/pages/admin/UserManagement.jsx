import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';

export default function UserManagement() {
  const { addNotification } = useApp();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [warnModal, setWarnModal] = useState(null);
const [warningTitle, setWarningTitle] = useState("");
const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await adminService.getUsers();
        setUsers(response.data || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const toggleBlock = async (id) => {
    const existing = users.find(u => u.id === id);
    if (!existing) return;
    const next = existing.status === 'blocked' ? 'active' : 'blocked';
    try {
      const response = await adminService.updateUserStatus(id, { isBlocked: next === 'blocked' });
      setUsers(prev => prev.map(u => u.id === id ? response.data : u));
      addNotification({
        title: next === 'blocked' ? 'User Blocked 🚫' : 'User Unblocked ✅',
        message: `${existing.fullName || existing.name || existing.email} has been ${next}.`,
        type: next === 'blocked' ? 'danger' : 'success'
      });
    } catch (error) {
      console.error('Failed to update user status:', error);
      addNotification({ title: 'Update failed', message: 'Unable to change user status.', type: 'danger' });
    }
  };
const sendWarning = async () => {
  if (!warnModal) return;

  try {

    await adminService.warnDriver({
      driverUserId: warnModal.id,
      title: warningTitle,
      message: warningMessage
    });

    addNotification({
      title: "Warning Sent",
      message: "Driver has been warned successfully.",
      type: "success"
    });

    setWarnModal(null);
    setWarningTitle("");
    setWarningMessage("");

  } catch (error) {

    console.error(error);

    addNotification({
      title: "Error",
      message: "Could not send warning.",
      type: "danger"
    });
  }
};
  const verifyDriver = async (id) => {
    try {
      const response = await adminService.updateUserStatus(id, { isVerified: true });
      setUsers(prev => prev.map(u => u.id === id ? response.data : u));
      const u = users.find(usr => usr.id === id);
      addNotification({
        title: 'Driver Verified ✅',
        message: `${u?.fullName || u?.name || 'Driver'} is now a verified driver.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to verify driver:', error);
      addNotification({ title: 'Verification failed', message: 'Unable to verify driver.', type: 'danger' });
    }
  };

  const filtered = users
    .filter(u => filter === 'all' || u.role === filter || u.status === filter)
    .filter(u => (u.fullName || u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()));

  const statusConfig = {
    active: { cls: 'badge-success', label: 'Active' },
    verified: { cls: 'badge-purple', label: 'Verified' },
    blocked: { cls: 'badge-danger', label: 'Blocked' },
    pending: { cls: 'badge-warning', label: 'Pending' },
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>User Management 👥</h1>
          <p>{users.length} total users on platform</p>
        </div>
      </div>

      <div className="page-content">
        {/* Filters & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'rider', 'driver', 'blocked', 'pending'].map(f => (
              <button key={f} id={`user-filter-${f}`}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
                style={{ textTransform: 'capitalize' }}>
                {f === 'all' ? '👥 All' : f === 'rider' ? '👤 Riders' : f === 'driver' ? '🚗 Drivers' : f === 'blocked' ? '🚫 Blocked' : '⏳ Pending'}
              </button>
            ))}
          </div>
          <div className="input-with-icon" style={{ width: 260 }}>
            <span className="input-icon">🔍</span>
            <input id="user-search" className="input-field" placeholder="Search users..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h3>Loading users…</h3>
            <p>Fetching admin user data from the backend.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Rides</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} id={`user-row-${user.id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {(user.fullName || user.name || user.email || 'U')[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{user.fullName || user.name || user.email}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'driver' ? 'badge-purple' : 'badge-blue'}`}>
                        {user.role === 'driver' ? '🚗' : '👤'} {user.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{user.rides ?? 0}</td>
                    <td>
                      <span className={`badge ${statusConfig[user.status]?.cls || 'badge-success'}`}>
                        {statusConfig[user.status]?.label || user.status}
                      </span>
                    </td>
                    <td>{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {user.role === "driver" && (
  <button
    className="btn btn-sm btn-warning"
    onClick={() => setWarnModal(user)}
  >
    ⚠ Warn
  </button>
)}
                        {user.role === 'driver' && user.status === 'pending' && (
                          <button id={`verify-${user.id}`} className="btn btn-sm"
                            style={{ background: 'rgba(124,106,245,0.15)', color: 'var(--accent-secondary)', border: '1px solid rgba(124,106,245,0.3)' }}
                            onClick={() => verifyDriver(user.id)}>
                            ✅ Verify
                          </button>
                        )}
                        <button id={`block-${user.id}`}
                          className={`btn btn-sm ${user.status === 'blocked' ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => toggleBlock(user.id)}>
                          {user.status === 'blocked' ? '🔓 Unblock' : '🚫 Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No users found</h3>
              <p>Try adjusting your search or filter</p>
            </div>
          )}
          </>
        )}
      </div>
      {warnModal && (
  <div className="modal-overlay">
    <div className="modal">

      <div className="modal-header">
        <h3>Warn Driver</h3>
        <button
          className="modal-close"
          onClick={() => setWarnModal(null)}
        >
          ✕
        </button>
      </div>

      <div className="input-group">

        <label>Title</label>

        <input
          className="input-field"
          value={warningTitle}
          onChange={(e) => setWarningTitle(e.target.value)}
          placeholder="Official Warning"
        />

      </div>

      <div className="input-group">

        <label>Message</label>

        <textarea
          rows="5"
          className="input-field"
          value={warningMessage}
          onChange={(e) => setWarningMessage(e.target.value)}
          placeholder="Write warning..."
        />

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20
        }}
      >

        <button
          className="btn btn-secondary"
          onClick={() => setWarnModal(null)}
        >
          Cancel
        </button>

        <button
          className="btn btn-danger"
          onClick={sendWarning}
        >
          Send Warning
        </button>

      </div>

    </div>
  </div>
)}
    </>
  );
}
