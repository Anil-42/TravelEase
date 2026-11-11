import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('travelease_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('travelease_token') || null;
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('travelease_token');
    localStorage.removeItem('travelease_user');
  }, []);

  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('travelease_token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          if (isMounted) {
            const refreshedUser = {
              userId: profile.id,
              username: profile.username,
              email: profile.email,
              role: profile.role,
            };
            setUser(refreshedUser);
            localStorage.setItem('travelease_user', JSON.stringify(refreshedUser));
          }
        } catch {
          if (isMounted) {
            logout();
          }
        }
      }
      if (isMounted) setLoading(false);
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [logout]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    const authUser = {
      userId: data.userId,
      username: data.username,
      email: data.email,
      role: data.role,
    };
    setToken(data.token);
    setUser(authUser);
    localStorage.setItem('travelease_token', data.token);
    localStorage.setItem('travelease_user', JSON.stringify(authUser));
    return authUser;
  };

  const register = async (userData) => {
    return await authApi.register(userData);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === 'ROLE_ADMIN',
    loading,
    login,
    register,
    logout,
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
