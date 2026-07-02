import { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { authService, notificationService } from '../services/apiService';
import { isNetworkError } from '../services/mockAuth';
import { useRef } from 'react';
const AppContext = createContext(null);

export function normalizeUser(raw) {
  if (!raw) return null;
  const user = raw.user ?? raw;
  const name = user.fullName || user.name || 'User';
  const role = (user.role || 'rider').toLowerCase();
  const id = user.id ?? user.userId;
  return {
    ...user,
    id,
    name,
    role,
    avatar: (name[0] || 'U').toUpperCase(),
  };
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [serverNotifications, setServerNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const addNotification = useCallback((notif) => {
    const id = Date.now();

    setNotifications(prev => [...prev, { ...notif, id }]);

    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
}, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await authService.getProfile();
        const profile = response.data;
        setUser(normalizeUser(profile));
        localStorage.setItem('user', JSON.stringify(profile));
      } catch (err) {
        if (isNetworkError(err) && userData) {
          try {
            setUser(normalizeUser(JSON.parse(userData)));
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('mockAuth');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);
const shownNotifications = useRef(new Set());
 useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
    try {

        // Fetch all notifications
        const notifRes = await notificationService.getNotifications();

        // Store backend notifications separately
        setServerNotifications(notifRes.data);

        // Show popup only once for each notification
        notifRes.data.forEach(notification => {

            if (!shownNotifications.current.has(notification.id)) {

                shownNotifications.current.add(notification.id);

                addNotification({
                    title: notification.title,
                    message: notification.message,
                    type: "success"
                });

            }

        });

        // Fetch unread count
        const unreadRes = await notificationService.getUnreadCount();

        setUnreadCount(unreadRes.data.count || 0);

    } catch (error) {
        console.error("Error fetching notifications:", error);
    }
};
    // Initial fetch
    fetchNotifications();

    // Poll every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);

}, [user?.id, addNotification]);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mockAuth');
  };

  

  return (
    <AppContext.Provider value={{ user, login, logout, loading, notifications, addNotification, unreadCount }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
