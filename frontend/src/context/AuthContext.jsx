import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('worklog_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current session
  useEffect(() => {
    async function checkAuth() {
      const savedToken = localStorage.getItem('worklog_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid token');
        logout();
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const loginWithToken = (sessionToken, userData) => {
    localStorage.setItem('worklog_token', sessionToken);
    setToken(sessionToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('worklog_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const demoLogin = async (role) => {
    setLoading(true);
    try {
      const res = await authApi.demoLogin(role);
      if (res.data.success) {
        loginWithToken(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Demo login failed' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role || null,
        loginWithToken,
        logout,
        refreshUser,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
