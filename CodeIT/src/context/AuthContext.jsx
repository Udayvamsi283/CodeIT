import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh user state by calling /api/auth/me with cookies
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          return data.user;
        }
      }
      setUser(null);
      return null;
    } catch (error) {
      console.warn('Authentication check failed or server unreachable:', error.message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial authentication check on app mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      throw error;
    }
  };

  // Register handler
  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      throw error;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
