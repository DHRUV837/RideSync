import { useState } from 'react';
import { authService } from '../services/apiService';
import { useApp } from '../context/AppContext';

export default function AuthPage() {
  const { login } = useApp();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: 'demo@test.com', password: 'demo123' });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'RIDER',
  });

  const completeAuth = (response) => {
    const responseData = response.data;
    const authUser = responseData.user ?? responseData;
    if (responseData.token) {
      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(authUser));
      login(authUser);
    } else {
      setError(responseData.message || 'Authentication failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      completeAuth(await authService.login(loginForm));
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!registerForm.phoneNumber.startsWith('+')) {
      setError('Phone number must include country code (e.g. +919876543210)');
      return;
    }

    setLoading(true);
    try {
      completeAuth(await authService.register(registerForm));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      completeAuth(await authService.demoLogin(role));
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '🤖', title: 'AI Route Matching', desc: 'K-Means clustering finds your best ride' },
    { icon: '🗺️', title: 'Smart Optimization', desc: 'OR-Tools minimizes detours for drivers' },
    { icon: '🌿', title: 'Carbon Tracking', desc: 'See your environmental impact in real time' },
    { icon: '🔐', title: 'Safety OTP', desc: 'Verified rides with secure OTP check-in' },
  ];

  return (
    <div className="auth-split">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-badge">AI-Powered Carpooling</div>
          <h1>Share rides.<br /><span className="gradient-text">Save smarter.</span></h1>
          <p>The intelligent carpooling platform for commuters. Cut costs, reduce emissions, and travel with confidence.</p>
          <div className="auth-features">
            {features.map(f => (
              <div key={f.title} className="auth-feature">
                <span className="auth-feature-icon">{f.icon}</span>
                <div>
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-hero-glow" />
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🚗</div>
            <h1>RideSync</h1>
            <p>Sign in to your account</p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="auth-alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-with-icon">
                  <span className="input-icon">✉️</span>
                  <input
                    className="input-field"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    className="input-field"
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  className="input-field"
                  type="text"
                  required
                  value={registerForm.fullName}
                  onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  className="input-field"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input
                  className="input-field"
                  type="tel"
                  required
                  value={registerForm.phoneNumber}
                  onChange={e => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                  placeholder="+919876543210"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  className="input-field"
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="Create a strong password"
                />
              </div>

              <label className="input-label">I am a</label>
              <div className="role-selector">
                {[
                  { value: 'RIDER', icon: '👤', name: 'Rider' },
                  { value: 'DRIVER', icon: '🚗', name: 'Driver' },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`role-btn ${registerForm.role === r.value ? 'active' : ''}`}
                    onClick={() => setRegisterForm({ ...registerForm, role: r.value })}
                  >
                    <span className="role-icon">{r.icon}</span>
                    <span className="role-name">{r.name}</span>
                  </button>
                ))}
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>
          )}

          <div className="auth-demo">
            <p className="auth-demo-label">Backend offline? Use demo mode:</p>
            <div className="auth-demo-buttons">
              <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => handleDemoLogin('rider')}>
                👤 Rider
              </button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => handleDemoLogin('driver')}>
                🚗 Driver
              </button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => handleDemoLogin('admin')}>
                👨‍💼 Admin
              </button>
            </div>
            <p className="auth-demo-hint">
              Or sign in with <code>demo@test.com</code> / <code>demo123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
