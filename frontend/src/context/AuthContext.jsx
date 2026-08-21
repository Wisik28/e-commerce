import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted auth from localStorage
    const savedUser = localStorage.getItem('ecom_auth_user');
    const savedToken = localStorage.getItem('ecom_auth_token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
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
        localStorage.setItem('ecom_auth_user', JSON.stringify(userData));
        localStorage.setItem('ecom_auth_token', token);
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
    localStorage.removeItem('ecom_auth_user');
    localStorage.removeItem('ecom_auth_token');
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
