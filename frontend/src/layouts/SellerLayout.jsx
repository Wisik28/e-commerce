import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useSellerAnalyticsQuery } from '../hooks/useApi';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  RefreshCw, 
  Calendar,
  TrendingUp,
  Package,
  Bell
} from 'lucide-react';

export const SellerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [timeStr, setTimeStr] = useState('');

  // Fetch analytics to show real-time sidebar badges
  const { data: analyticsRes } = useSellerAnalyticsQuery(user?.sellerId);
  const stats = analyticsRes?.data || {};

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toTimeString().split(' ')[0].slice(0, 5));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    if (user?.sellerId) {
      queryClient.invalidateQueries({ queryKey: ['seller', user.sellerId] });
    }
  };

  const getPageDetails = () => {
    const storeName = stats?.storeName || user?.name || 'Toko Anda';
    switch (location.pathname) {
      case '/seller/dashboard':
        return {
          title: 'Dashboard Penjual',
          subtitle: `${storeName} — Kelola produk & pesanan Anda`
        };
      case '/seller/sales-revenue':
        return {
          title: 'Sales & Revenue Analytics',
          subtitle: 'Analisis mendalam tren penjualan dan pendapatan toko'
        };
      case '/seller/products-inventory':
        return {
          title: 'Produk & Inventaris',
          subtitle: 'Kelola stok, pantau performa produk, dan reorder tepat waktu'
        };
      default:
        return {
          title: 'Seller Panel',
          subtitle: 'Dashboard Toko Nusantara'
        };
    }
  };

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const details = getPageDetails();

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">T</div>
          <div className="logo-text">SellerCenter</div>
        </div>

        <nav className="sidebar-nav">
          <div>
            <div className="nav-group-label">Menu Utama</div>
            <div className="nav-links">
              <Link 
                to="/seller/dashboard" 
                className={`nav-link-item ${location.pathname === '/seller/dashboard' ? 'active' : ''}`}
              >
                <span className="nav-link-item-left">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </span>
              </Link>
              
              <Link 
                to="/seller/sales-revenue" 
                className={`nav-link-item ${location.pathname === '/seller/sales-revenue' ? 'active' : ''}`}
              >
                <span className="nav-link-item-left">
                  <TrendingUp size={18} />
                  <span>Sales & Analytics</span>
                </span>
              </Link>

              <Link 
                to="/seller/products-inventory" 
                className={`nav-link-item ${location.pathname === '/seller/products-inventory' ? 'active' : ''}`}
              >
                <span className="nav-link-item-left">
                  <Package size={18} />
                  <span>Produk & Stok</span>
                </span>
                {stats.lowStockCount > 0 && (
                  <span className="nav-badge danger">{stats.lowStockCount}</span>
                )}
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div className="nav-group-label">Preferensi</div>
            <div className="nav-links">
              <div className="nav-link-item">
                <span className="nav-link-item-left">
                  <Bell size={18} />
                  <span>Notifikasi</span>
                </span>
                {stats.pendingConfirmations > 0 && (
                  <span className="nav-badge">{stats.pendingConfirmations}</span>
                )}
              </div>
              <div className="nav-link-item">
                <span className="nav-link-item-left">
                  <Settings size={18} />
                  <span>Pengaturan</span>
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-footer-card">
            <div className="user-footer-info">
              <div className="user-avatar">{user?.avatarInitial || 'SE'}</div>
              <div className="user-meta">
                <div className="user-name">{user?.name || 'Pemilik Toko'}</div>
                <span className="user-role">Pemilik Toko</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="shell-container">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-title-section">
            <h1>{details.title}</h1>
            <p>{details.subtitle}</p>
          </div>

          <div className="header-actions">
            <div className="header-status-indicator">
              <span className="status-dot active"></span>
              <span>Diperbarui {timeStr}</span>
            </div>

            <div className="header-status-indicator">
              <Calendar size={14} />
              <span>{dateStr}</span>
            </div>

            <button className="icon-btn" onClick={handleRefresh} title="Refresh Data">
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default SellerLayout;
