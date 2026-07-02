import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import NotifContainer from './components/NotifContainer';

import AuthPage from './pages/AuthPage';
import RiderLayout from './layouts/RiderLayout';
import DriverLayout from './layouts/DriverLayout';
import AdminLayout from './layouts/AdminLayout';
import RideHistory from './pages/driver/RideHistory';
import RiderHome from './pages/rider/RiderHome';
import RideSearch from './pages/rider/RideSearch';
import MyBookings from './pages/rider/MyBookings';
import LiveTracking from './pages/rider/LiveTracking';
import CarbonSavings from './pages/rider/CarbonSavings';

import DriverHome from './pages/driver/DriverHome';
import CreateRide from './pages/driver/CreateRide';
import PassengerRequests from './pages/driver/PassengerRequests';
import OptimizedRoute from './pages/driver/OptimizedRoute';
import Earnings from './pages/driver/Earnings';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Complaints from './pages/admin/Complaints';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="app-loading-logo">🚗</div>
      <div className="app-loading-spinner" />
      <p className="app-loading-text">RideSync</p>
    </div>
  );
}

function RiderPortal() {
  const [page, setPage] = useState('dashboard');

  const content = {
    dashboard: <RiderHome onNavigate={setPage} />,
    search: <RideSearch onNavigate={setPage} />,
    bookings: <MyBookings />,
    tracking: <LiveTracking />,
    carbon: <CarbonSavings />,
    history: <MyBookings />,
  }[page] || <RiderHome onNavigate={setPage} />;

  return (
    <RiderLayout activePage={page} onNavigate={setPage}>
      {content}
    </RiderLayout>
  );
}

function DriverPortal() {
  const [page, setPage] = useState('dashboard');

  const content = {
    dashboard: <DriverHome onNavigate={setPage} />,
    create: <CreateRide onNavigate={setPage} />,
    requests: <PassengerRequests onNavigate={setPage} />,
    route: <OptimizedRoute />,
    earnings: <Earnings />,
    history: <RideHistory />,
  }[page] || <DriverHome onNavigate={setPage} />;

  return (
    <DriverLayout activePage={page} onNavigate={setPage}>
      {content}
    </DriverLayout>
  );
}

function AdminPortal() {
  const [page, setPage] = useState('dashboard');

  const content = {
    dashboard: <AdminDashboard onNavigate={setPage} />,
    users: <UserManagement />,
    complaints: <Complaints />,
    analytics: <AdminAnalytics onNavigate={setPage} />,
  }[page] || <AdminDashboard onNavigate={setPage} />;

  return (
    <AdminLayout activePage={page} onNavigate={setPage}>
      {content}
    </AdminLayout>
  );
}

function AppContent() {
  const { user, loading } = useApp();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage />;

  const role = user.role?.toLowerCase();

if (role === "rider") return <RiderPortal />;
if (role === "driver") return <DriverPortal />;
if (role === "admin") return <AdminPortal />;

  return <AuthPage />;
}

export default function App() {
  return (
    <AppProvider>
      <NotifContainer />
      <AppContent />
    </AppProvider>
  );
}
