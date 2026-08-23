import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSellerProductsQuery } from '../../hooks/useApi';
import { StatCard } from '../../components/shared/StatCard';
import {
  Package,
  ArchiveX,
  Layers,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const SellerDashboardPage = () => {
  const { user } = useAuth();
  const sellerId = user?.sellerId;

  const { data: productsRes, isLoading } = useSellerProductsQuery(sellerId);
  const products = productsRes?.data || [];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
        Memuat data dashboard...
      </div>
    );
  }

  // ─── Kalkulasi ringkasan ───────────────────────────────────────
  const totalProduk = products.length;

  // Stok tersedia  = stok > 0
  const stokTersedia = products.filter(p => p.stock > 0).length;

  // Stok habis = stok = 0
  const stokHabis = products.filter(p => p.stock === 0).length;

  // Stok menipis = stok > 0 tapi ≤ reorderThreshold
  const stokMenipis = products.filter(p => p.stock > 0 && p.stock <= (p.reorderThreshold || 10)).length;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div>
      {/* ─── Stat Cards ─────────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          label="Total Produk"
          value={totalProduk}
          icon={Package}
          caption="Semua produk terdaftar"
        />
        <StatCard
          label="Stok Tersedia"
          value={stokTersedia}
          icon={CheckCircle2}
          caption="Produk dengan stok > 0"
        />
        <StatCard
          label="Stok Habis"
          value={stokHabis}
          icon={ArchiveX}
          caption="Produk perlu diisi ulang"
          highlight={stokHabis > 0 ? 'red' : ''}
        />
      </div>

      {/* ─── Alert stok menipis ─────────────────────────────────── */}
      {stokMenipis > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span style={{ fontWeight: '700', color: '#92400e', fontSize: '0.9rem' }}>
              {stokMenipis} produk stok hampir habis — segera lakukan restok!
            </span>
          </div>
          <Link
            to="/seller/products-inventory"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              color: '#b45309', fontWeight: '700', fontSize: '0.82rem',
              textDecoration: 'none'
            }}
          >
            Kelola Produk <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ─── Quick link ke Produk ────────────────────────────────── */}
      <div style={{ textAlign: 'center' }}>
        <Link to="/seller/products-inventory" className="btn-primary" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem'
        }}>
          <Package size={16} /> Kelola Semua Produk <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};
export default SellerDashboardPage;
