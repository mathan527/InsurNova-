import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Guard against expired tokens — React would show 'authenticated'
    // but every backend call would silently return 401 until hard refresh.
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          // Token expired — clear and force re-login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }
      } catch (_) {
        // Token is not a valid JWT (e.g. demo-token) — skip expiry check
      }
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const signup = async (userData) => {
    const data = await authService.signup(userData);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const demoLogin = () => {
    const mockUser = {
      id: 'demo-user-001',
      name: 'Demo User',
      email: 'demo@insurnova.ai',
      platform: 'Zomato',
      profileCompleted: true,
      role: 'delivery_partner',
    };
    localStorage.setItem('token', 'demo-token-insurnova-2024');
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    demoLogin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
