import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted auth from localStorage or sessionStorage
    const savedUser = localStorage.getItem('ecom_auth_user') || sessionStorage.getItem('ecom_auth_user');
    const savedToken = localStorage.getItem('ecom_auth_token') || sessionStorage.getItem('ecom_auth_token');
    if (savedToken) {
      localStorage.setItem('ecom_auth_token', savedToken);
      sessionStorage.setItem('ecom_auth_token', savedToken);
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
      localStorage.setItem('ecom_auth_user', JSON.stringify(userData));
      sessionStorage.setItem('ecom_auth_user', JSON.stringify(userData));
    }
    setLoading(false);
  }, []);

  const _persistUser = (response) => {
    const userData = response.data.user;
    const token = response.data.token;
    setUser(userData);
    localStorage.setItem('ecom_auth_user', JSON.stringify(userData));
    localStorage.setItem('ecom_auth_token', token);
    sessionStorage.setItem('ecom_auth_user', JSON.stringify(userData));
    sessionStorage.setItem('ecom_auth_token', token);
  };

  const login = async (usernameOrEmail, password, recaptchaToken) => {
    try {
      const response = await api.auth.login(usernameOrEmail, password, recaptchaToken);
      if (response.success) {
        _persistUser(response);
      }
      return response;
    } catch (error) {
      throw new Error(error.message || 'Login gagal.');
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await api.auth.loginWithGoogle(idToken);
      if (response.success) {
        _persistUser(response);
      }
      return response;
    } catch (error) {
      // Re-throw as-is agar komponen bisa menangkap error USER_NOT_REGISTERED
      throw error;
    }
  };

  const registerGoogleBuyer = async ({ idToken, phone }) => {
    try {
      const response = await api.auth.registerGoogleBuyer({ idToken, phone });
      if (response.success) {
        _persistUser(response);
      }
      return response;
    } catch (error) {
      throw new Error(error.message || 'Registrasi Google gagal.');
    }
  };

  const registerGoogleSeller = async ({ idToken, phone, storeName, storeDescription }) => {
    try {
      const response = await api.auth.registerGoogleSeller({ idToken, phone, storeName, storeDescription });
      if (response.success) {
        _persistUser(response);
      }
      return response;
    } catch (error) {
      throw new Error(error.message || 'Registrasi Google Penjual gagal.');
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
    localStorage.removeItem('ecom_token');
    sessionStorage.removeItem('ecom_auth_user');
    sessionStorage.removeItem('ecom_auth_token');
    sessionStorage.removeItem('ecom_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogle,
        registerGoogleBuyer,
        registerGoogleSeller,
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
