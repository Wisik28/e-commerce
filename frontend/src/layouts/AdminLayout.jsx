import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  RefreshCw, 
  Calendar
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [timeStr, setTimeStr] = useState('');

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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
    } catch (err) {
      console.warn('Failed to refresh data:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  const getPageDetails = () => {
    switch (location.pathname) {
      case '/admin/dashboard':
        return {
          title: 'Admin Dashboard',
          subtitle: 'Monitoring platform & manajemen penjual'
        };
      default:
        return {
          title: 'Admin Panel',
          subtitle: 'Sistem Administrasi EcomDashboard'
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
          <div className="logo-icon">E</div>
          <div className="logo-text">EcomDashboard</div>
        </div>

        <nav className="sidebar-nav">
          <div>
            <div className="nav-group-label">Menu Utama</div>
            <div className="nav-links">
              <Link 
                to="/admin/dashboard" 
                className={`nav-link-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
              >
                <span className="nav-link-item-left">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </span>
              </Link>
            </div>
          </div>

          {/* <div style={{ marginTop: 'auto' }}>
            <div className="nav-group-label">Preferensi</div>
            <div className="nav-links">
              <div className="nav-link-item">
                <span className="nav-link-item-left">
                  <Settings size={18} />
                  <span>Pengaturan</span>
                </span>
              </div>
            </div>
          </div> */}
        </nav>

        <div className="sidebar-footer">
          <div className="user-footer-card">
            <div className="user-footer-info">
              <div className="user-avatar">{user?.avatarInitial || 'AD'}</div>
              <div className="user-meta">
                <div className="user-name">{user?.name || 'Administrator'}</div>
                <span className="user-role">System Admin</span>
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
            {/* <div className="header-status-indicator">
              <span className="status-dot active"></span>
              <span>Diperbarui {timeStr}</span>
            </div> */}

            <div className="header-status-indicator">
              <Calendar size={14} />
              <span>{dateStr}</span>
            </div>

            <button 
              className={`icon-btn ${isRefreshing ? 'refreshing' : ''}`} 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              title="Refresh Data"
              style={{
                cursor: isRefreshing ? 'wait' : 'pointer',
                opacity: isRefreshing ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
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
export default AdminLayout;
