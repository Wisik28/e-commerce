import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const RoleGuard = ({ allow }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        color: '#6B7280'
      }}>
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allow && user.role !== allow) {
    // Return Forbidden page with Back to Dashboard button
    const getDashboardPath = (role) => {
      if (role === 'admin') return '/admin/dashboard';
      if (role === 'seller') return '/seller/dashboard';
      return '/buyer';
    };

    return (
      <div className="forbidden-container">
        <ShieldAlert size={64} className="star-icon" style={{ color: 'var(--danger)' }} />
        <h1 className="forbidden-title">403</h1>
        <h2 className="forbidden-subtitle">Akses Tidak Diizinkan</h2>
        <p className="forbidden-desc">
          Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini hanya untuk pengguna dengan role <strong>{allow}</strong>.
        </p>
        <a href={getDashboardPath(user.role)} className="btn-primary">
          <ArrowLeft size={16} /> Kembali ke Dashboard Anda
        </a>
      </div>
    );
  }

  return <Outlet />;
};
