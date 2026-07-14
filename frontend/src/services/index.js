import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export const claimsService = {
  getAll: () => api.get('/api/claims'),
  getById: (id) => api.get(`/api/claims/${id}`),
  create: (claimData) => api.post('/api/claims', claimData),
};

export const policiesService = {
  getAll: () => api.get('/api/policies'),
  getById: (id) => api.get(`/api/policies/${id}`),
  create: (policyData) => api.post('/api/policies', policyData),
};

export const eventsService = {
  createTest: () => api.post('/create-test-event'),
  process: (eventData) => api.post('/process-event', eventData),
  simulate: (eventData) => api.post('/api/events/simulate', eventData),
  runMockTriggers: (payload = {}) => api.post('/api/triggers/mock-disruptions', payload),
  quickClaim: (payload) => api.post('/quick-claim', payload),
};

export const analyticsService = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getClaimsStats: () => api.get('/api/analytics/claims'),
  getPoliciesStats: () => api.get('/api/analytics/policies'),
};

export const userService = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
  getWallet: () => api.get('/api/user/wallet'),
};

export const deliveryService = {
  getProfile: (params) => api.get('/mock/delivery-profile', { params }),
};

export const fraudService = {
  check: (payload) => api.post('/api/fraud/check', payload),
};

export const recommendationService = {
  get: (params) => api.get('/api/recommendation', { params }),
};

export const pricingService = {
  getPricing: (data) => api.post('/get-pricing', data),
};
