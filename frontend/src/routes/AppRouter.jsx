import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from './RoleGuard';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import SellerLayout from '../layouts/SellerLayout';
import BuyerLayout from '../layouts/BuyerLayout';

// Pages
import Login from '../pages/auth/Login';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import SellerDashboardPage from '../pages/seller/SellerDashboardPage';
import SalesRevenueAnalyticsPage from '../pages/seller/SalesRevenueAnalyticsPage';
import ProductsInventoryPage from '../pages/seller/ProductsInventoryPage';
import StorefrontPage from '../pages/buyer/StorefrontPage';
import BuyerOrdersPage from '../pages/buyer/BuyerOrdersPage';
import BuyerChatPage from '../pages/buyer/BuyerChatPage';

// Root Gateway Redirector
const RootGateway = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#6B7280' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'seller':
      return <Navigate to="/seller/dashboard" replace />;
    case 'buyer':
      return <Navigate to="/buyer" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* Root portal */}
      <Route path="/" element={<RootGateway />} />
      
      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route element={<RoleGuard allow="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
      </Route>

      {/* Seller routes */}
      <Route element={<RoleGuard allow="seller" />}>
        <Route element={<SellerLayout />}>
          <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
          <Route path="/seller/sales-revenue" element={<SalesRevenueAnalyticsPage />} />
          <Route path="/seller/products-inventory" element={<ProductsInventoryPage />} />
        </Route>
      </Route>

      {/* Buyer routes */}
      <Route element={<RoleGuard allow="buyer" />}>
        <Route element={<BuyerLayout />}>
          <Route path="/buyer" element={<StorefrontPage />} />
          <Route path="/buyer/orders" element={<BuyerOrdersPage />} />
          <Route path="/buyer/chat" element={<BuyerChatPage />} />
        </Route>
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
