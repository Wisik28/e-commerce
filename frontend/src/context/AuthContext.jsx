import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted auth from sessionStorage
    const savedUser = sessionStorage.getItem('ecom_auth_user');
    const savedToken = sessionStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_token');
    if (savedToken) {
      sessionStorage.setItem('ecom_auth_token', savedToken);
      sessionStorage.setItem('ecom_token', savedToken);
      let userData = savedUser ? JSON.parse(savedUser) : {};
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload && payload.sub) {
          userData.id = userData.id || payload.sub;
          userData.sellerId = userData.sellerId || payload.sub;
        }
      } catch (e) {
        console.warn('Failed to parse JWT token in AuthContext:', e);
      }
      setUser(userData);
      sessionStorage.setItem('ecom_auth_user', JSON.stringify(userData));
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await api.auth.login(usernameOrEmail, password);
      if (response.success) {
        const userData = response.data.user;
        const token = response.data.token;

        setUser(userData);
        sessionStorage.setItem('ecom_auth_user', JSON.stringify(userData));
        sessionStorage.setItem('ecom_auth_token', token);
        sessionStorage.setItem('ecom_token', token);
      }
      return response;
    } catch (error) {
      throw new Error(error.message || 'Login gagal.');
    }
  };

  const register = async (registerData) => {
    try {
      const response = await api.auth.register(registerData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Registrasi gagal.');
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('ecom_auth_user');
    sessionStorage.removeItem('ecom_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
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
