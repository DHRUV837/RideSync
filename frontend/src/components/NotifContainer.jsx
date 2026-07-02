import { useApp } from '../context/AppContext';

export default function NotifContainer() {
  const { notifications } = useApp();

  const icons = { success: '✅', warning: '⚠️', danger: '🚨', info: 'ℹ️' };

  return (
    <div className="notif-container">
      {notifications.map(n => (
        <div key={n.id} className={`notif-toast ${n.type || 'success'}`}>
          <span className="notif-toast-icon">{icons[n.type] || '✅'}</span>
          <div className="notif-toast-body">
            <h4>{n.title}</h4>
            <p>{n.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
