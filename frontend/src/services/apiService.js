import axios from 'axios';
import api from './api';
import { mockLogin, mockRegister, demoLoginAs, isNetworkError } from './mockAuth';

const useMockOnly = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

async function withAuthFallback(apiCall, mockCall) {
  if (useMockOnly) return mockCall();

  try {
    const response = await apiCall();
    localStorage.removeItem('mockAuth');
    return response;
  } catch (err) {
    if (isNetworkError(err)) {
      return mockCall();
    }
    throw err;
  }
}

export const authService = {
  login: (data) => withAuthFallback(
    () => api.post('/auth/login', data),
    () => mockLogin(data),
  ),
  register: (data) => withAuthFallback(
    () => api.post('/auth/register', data),
    () => mockRegister(data),
  ),
  demoLogin: (role) => demoLoginAs(role),
  getProfile: () => api.get('/users/me'),
};

export const rideService = {
  createRide: (data) => api.post('/rides/create', data),
  getAvailableRides: () => api.get('/rides/available'),
  searchRides: (params) => api.get('/rides/search', { params }),
  getRideById: (id) => api.get(`/rides/${id}`),
  getDriverRides: (driverId) => api.get(`/rides/driver/${driverId}`),
  getDriverRequests: (driverId) => api.get(`/rides/driver/${driverId}/requests`),
  getDriverAnalytics: (driverId) => api.get(`/rides/driver/${driverId}/analytics`),
  bookRide: (data) => api.post('/rides/book', data),
  getMyBookings: () => api.get('/rides/bookings'),
  updateBookingStatus: (bookingId, data) => api.put(`/rides/bookings/${bookingId}/status`, data),
  cancelBooking: (bookingId) => api.put(`/rides/bookings/${bookingId}/cancel`),
  cancelRide: (rideId) => api.put(`/rides/${rideId}/cancel`),
  verifyOtp: (bookingId, data) => api.post(`/rides/bookings/${bookingId}/verify-otp`, data),
  completeBooking: (bookingId) => api.post(`/rides/bookings/${bookingId}/complete`),
  // M3: Dynamic Fare Engine
  getFareMatrix: (rideId) => api.get(`/rides/${rideId}/fares`),
  calculateFare: (rideId, pickup, dropoff) => api.get(`/rides/${rideId}/fare`, { params: { pickup, dropoff } }),
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  getComplaints: () => api.get('/admin/complaints'),
  updateComplaintStatus: (complaintId, data) => api.put(`/admin/complaints/${complaintId}`, data),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  warnDriver: (data) => api.post("/admin/warn-driver", data),
  getAnalytics: () => api.get('/admin/analytics/dashboard'),
  getPlatformOverview: () => api.get('/admin/analytics/platform-overview'),
  getRideAnalytics: () => api.get('/admin/analytics/ride-analytics'),
  getRevenueAnalytics: () => api.get('/admin/analytics/revenue-analytics'),
  getComplaintAnalytics: () => api.get('/admin/analytics/complaint-analytics'),
  getBookingAnalytics: () => api.get('/admin/analytics/booking-analytics'),
  getDriverPerformance: () => api.get('/admin/analytics/driver-performance'),
  getUserActivity: () => api.get('/admin/analytics/user-activity'),
  getMonthlyGrowth: () => api.get('/admin/analytics/monthly-growth'),
  getRideStatusDistribution: () => api.get('/admin/analytics/ride-status-distribution'),
  getComplaintStatusDistribution: () => api.get('/admin/analytics/complaint-status-distribution'),
};
export const complaintService = {
  createComplaint: (data) => api.post('/complaints', data),
  getMyComplaints: () => api.get('/complaints/my'),
};
export const ratingService = {
  submitRating: (data) => api.post('/ratings', data),
  getDriverRatings: (driverId) => api.get(`/ratings/driver/${driverId}`),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  getUnreadNotifications: () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const carbonService = {
  getCarbonSavings: (userId) =>
    api.get(`/carbon-savings/${userId}`),
};

export const mlService = {
  clusterLocations: (data) => mlApi.post('/cluster', data),
  matchRiders: (data) => mlApi.post('/match-riders', data),
  optimizeRoute: (data) => mlApi.post('/optimize-route', data),
};
