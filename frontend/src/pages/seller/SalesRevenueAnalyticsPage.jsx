import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSellerAnalyticsQuery } from '../../hooks/useApi';
import { StatCard } from '../../components/shared/StatCard';
import { TrendChart, DonutChart, HorizontalBarList } from '../../components/shared/Charts';
import { DataTable } from '../../components/shared/DataTable';
import { DollarSign, ShoppingBag, Award, Activity, Calendar } from 'lucide-react';

export const SalesRevenueAnalyticsPage = () => {
  const { user } = useAuth();
  const sellerId = user?.sellerId;
  const [period, setPeriod] = useState('daily');

  const { data: analyticsRes, isLoading } = useSellerAnalyticsQuery(sellerId);
  const stats = analyticsRes?.data || {
    monthlyRevenue: 0,
    totalOrders: 0,
    aov: 0,
    returnRate: 2.9,
    highValueOrders: [],
    paymentDistribution: {}
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>Memuat data Analisis Pendapatan...</div>;
  }

  // Target Revenue Bulanan
  const targetRevenue = 400000000; // Target Rp 400jt
  const achievedRevenue = stats.monthlyRevenue || 347200000;
  const achievedPercent = Math.min(100, Math.round((achievedRevenue / targetRevenue) * 100));
  const remainingRevenue = Math.max(0, targetRevenue - achievedRevenue);

  // Chart data mock based on selected period
  const trendData = {
    daily: {
      data: [12400000, 18500000, 15300000, 24100000, 22000000, 31000000, 28700000],
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    },
    weekly: {
      data: [64000000, 78000000, 89000000, 92000000, 114000000, 98000000, 120000000],
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']
    },
    monthly: {
      data: [210000000, 240000000, 290000000, 312000000, 347200000, 380000000],
      labels: ['Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu']
    }
  };

  const selectedTrend = trendData[period];

  // Payment method items formatted for HorizontalBarList
  const paymentItems = Object.keys(stats.paymentDistribution || {}).map(key => {
    const val = stats.paymentDistribution[key] || 0;
    const nameMap = {
      transfer_bank: 'Transfer Bank',
      gopay: 'GoPay',
      ovo: 'OVO',
      qris: 'QRIS',
      dana: 'DANA',
      cod: 'COD'
    };
    return {
      name: nameMap[key] || key,
      value: val
    };
  }).sort((a, b) => b.value - a.value);

  // Columns for high value orders table
  const orderColumns = [
    { header: 'Order ID', accessor: 'id', sortable: true, render: (row) => <span className="cell-bold">{row.id}</span> },
    { header: 'Pelanggan', accessor: 'buyerName', sortable: true },
    {
      header: 'Produk',
      accessor: 'items',
      render: (row) => (
        <div style={{ fontSize: '0.8rem' }}>
          {row.items.map((item, idx) => (
            <div key={idx} className="cell-bold">{item.name} <span style={{ color: 'var(--neutral-400)' }}>x{item.qty}</span></div>
          ))}
        </div>
      )
    },
    { header: 'Jumlah ↕', accessor: 'totalAmount', sortable: true, render: (row) => <span className="cell-bold">{formatCurrency(row.totalAmount)}</span> },
    { header: 'Margin ↕', accessor: 'marginPercentage', sortable: true, render: (row) => <span style={{ color: 'var(--success)', fontWeight: '700' }}>{row.marginPercentage}%</span> },
    { header: 'Metode', accessor: 'paymentMethod', render: (row) => <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-500)' }}>{row.paymentMethod.replace('_', ' ')}</span> },
    { header: 'Tanggal ↕', accessor: 'createdAt', sortable: true, render: (row) => new Date(row.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: '2-digit', year: 'numeric' }) }
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard 
          label="Revenue Bulan Ini" 
          value={formatCurrency(achievedRevenue)} 
          icon={DollarSign} 
          caption="Agustus 2026" 
        />
        <StatCard 
          label="Total Pesanan" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          caption="Agustus 2026" 
        />
        <StatCard 
          label="Nilai Rata-rata Pesanan (AOV)" 
          value={formatCurrency(stats.aov)} 
          icon={Award} 
          caption="Per Transaksi" 
        />
        <StatCard 
          label="Tingkat Retur" 
          value={`${stats.returnRate}%`} 
          icon={Activity} 
          caption="14 pesanan dikembalikan" 
        />
      </div>

      {/* Target Progress Card */}
      <div className="card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--neutral-900)' }}>Progress Target Revenue Bulanan</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
              Target: {formatCurrency(targetRevenue)} · Tercapai: {formatCurrency(achievedRevenue)}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>{achievedPercent}%</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', display: 'block' }}>Tercapai</span>
          </div>
        </div>

        <div className="progress-bar-wrapper">
          <div className="progress-bar-track" style={{ height: '12px' }}>
            <div className="progress-bar-fill success" style={{ width: `${achievedPercent}%` }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', color: 'var(--neutral-500)', marginTop: '0.5rem' }}>
            <span>Rp 0</span>
            <span>Sisa: {formatCurrency(remainingRevenue)} dalam 11 hari</span>
            <span>Rp 400jt</span>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart & Segmented Control */}
      <div className="card-section">
        <div className="card-header-flex">
          <div className="card-title-block">
            <h3>Tren Revenue</h3>
            <p>Total {formatCurrency(achievedRevenue)} · {stats.totalOrders} pesanan</p>
          </div>
          
          <div className="segmented-control">
            <button 
              className={`segment-btn ${period === 'daily' ? 'active' : ''}`}
              onClick={() => setPeriod('daily')}
            >
              Harian
            </button>
            <button 
              className={`segment-btn ${period === 'weekly' ? 'active' : ''}`}
              onClick={() => setPeriod('weekly')}
            >
              Mingguan
            </button>
            <button 
              className={`segment-btn ${period === 'monthly' ? 'active' : ''}`}
              onClick={() => setPeriod('monthly')}
            >
              Bulanan
            </button>
          </div>
        </div>

        <TrendChart data={selectedTrend.data} labels={selectedTrend.labels} height={200} />
      </div>

      {/* Payment methods list */}
      <div className="card-section" style={{ marginTop: '1.5rem' }}>
          <div className="card-title-block" style={{ marginBottom: '1.25rem' }}>
            <h3>Metode Pembayaran</h3>
            <p>Distribusi revenue per metode pembayaran</p>
          </div>

          <HorizontalBarList items={paymentItems} />
        </div>

      {/* High Value Orders Table */}
      <div className="card-section" style={{ marginTop: '1.5rem' }}>
        <div className="card-title-block" style={{ marginBottom: '1.25rem' }}>
          <h3>Pesanan Nilai Tinggi</h3>
          <p>Daftar transaksi dengan nilai terbesar bulan ini</p>
        </div>

        <DataTable
          columns={orderColumns}
          data={stats.highValueOrders}
        />
      </div>
    </div>
  );
};
export default SalesRevenueAnalyticsPage;
