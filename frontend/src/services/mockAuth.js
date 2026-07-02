const DEMO_ACCOUNTS = {
  'demo@test.com': {
    password: 'demo123',
    user: {
      id: 1,
      fullName: 'Raj Patel',
      email: 'demo@test.com',
      role: 'RIDER',
      phoneNumber: '+919876543210',
    },
  },
};

export const DEMO_ROLES = {
  rider: {
    id: 1,
    fullName: 'Raj Patel',
    email: 'raj@ddu.ac.in',
    role: 'RIDER',
    phoneNumber: '+919876543210',
  },
  driver: {
    id: 2,
    fullName: 'Anand Shah',
    email: 'anand@gmail.com',
    role: 'DRIVER',
    phoneNumber: '+91988776655',
  },
  admin: {
    id: 3,
    fullName: 'Admin User',
    email: 'admin@ridesync.in',
    role: 'ADMIN',
    phoneNumber: '+919000000000',
  },
};

function mockResponse(user) {
  const token = `mock-token-${user.role.toLowerCase()}-${Date.now()}`;
  localStorage.setItem('mockAuth', 'true');
  return { data: { token, user } };
}

export function mockLogin({ email, password }) {
  const account = DEMO_ACCOUNTS[email.trim().toLowerCase()];
  if (!account || account.password !== password) {
    const err = new Error('Invalid credentials');
    err.response = { data: { message: 'Invalid email or password' } };
    throw err;
  }
  return mockResponse(account.user);
}

export function mockRegister(data) {
  return mockResponse({
    id: Date.now(),
    fullName: data.fullName,
    email: data.email,
    role: data.role || 'RIDER',
    phoneNumber: data.phoneNumber,
  });
}

export function demoLoginAs(role) {
  const user = DEMO_ROLES[role];
  if (!user) {
    const err = new Error('Unknown role');
    err.response = { data: { message: 'Unknown demo role' } };
    throw err;
  }
  return mockResponse(user);
}

export function isNetworkError(err) {
  if (!err.response) return true;
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true;
  if (err.message?.includes('Network Error')) return true;
  return false;
}

export function clearMockAuthFlag() {
  localStorage.removeItem('mockAuth');
}
