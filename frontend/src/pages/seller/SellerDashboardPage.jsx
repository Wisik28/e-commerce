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

  // Kategori unik
  const kategoriSet = new Set(products.map(p => p.category || 'Umum'));
  const totalKategori = kategoriSet.size;

  // Stok tersedia  = stok > 0
  const stokTersedia = products.filter(p => p.stock > 0).length;

  // Stok habis = stok = 0
  const stokHabis = products.filter(p => p.stock === 0).length;

  // Stok menipis = stok > 0 tapi ≤ reorderThreshold
  const stokMenipis = products.filter(p => p.stock > 0 && p.stock <= (p.reorderThreshold || 10)).length;

  // ─── Kelompokkan produk per kategori ──────────────────────────
  const perKategori = {};
  products.forEach(p => {
    const cat = p.category || 'Umum';
    if (!perKategori[cat]) perKategori[cat] = [];
    perKategori[cat].push(p);
  });

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
          label="Total Kategori"
          value={totalKategori}
          icon={Layers}
          caption="Variasi kategori produk"
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

      {/* ─── Ringkasan per kategori ─────────────────────────────── */}
      <div className="card-section" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title-block" style={{ marginBottom: '1.25rem' }}>
          <h3>Ringkasan per Kategori</h3>
          <p>Jumlah produk dan kondisi stok dikelompokkan berdasarkan kategori</p>
        </div>

        {totalKategori === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-400)', fontSize: '0.9rem' }}>
            Belum ada produk yang ditambahkan.{' '}
            <Link to="/seller/products-inventory" style={{ color: 'var(--primary)', fontWeight: '700' }}>
              Tambah sekarang →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {Object.entries(perKategori).map(([cat, prods]) => {
              const tersedia = prods.filter(p => p.stock > 0).length;
              const habis = prods.filter(p => p.stock === 0).length;
              const menipis = prods.filter(p => p.stock > 0 && p.stock <= (p.reorderThreshold || 10)).length;
              const totalNilai = prods.reduce((s, p) => s + (p.sellPrice * p.stock), 0);

              return (
                <div
                  key={cat}
                  style={{
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--white)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--neutral-900)' }}>
                      {cat}
                    </span>
                    <span style={{
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      borderRadius: '9999px',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {prods.length} produk
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: '#d1fae5', color: '#065f46',
                      borderRadius: '9999px', padding: '0.15rem 0.55rem',
                      fontSize: '0.72rem', fontWeight: '700'
                    }}>
                      ✓ Tersedia: {tersedia}
                    </span>
                    {habis > 0 && (
                      <span style={{
                        backgroundColor: '#fee2e2', color: '#991b1b',
                        borderRadius: '9999px', padding: '0.15rem 0.55rem',
                        fontSize: '0.72rem', fontWeight: '700'
                      }}>
                        ✗ Habis: {habis}
                      </span>
                    )}
                    {menipis > 0 && (
                      <span style={{
                        backgroundColor: '#fef3c7', color: '#92400e',
                        borderRadius: '9999px', padding: '0.15rem 0.55rem',
                        fontSize: '0.72rem', fontWeight: '700'
                      }}>
                        ⚠ Menipis: {menipis}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', borderTop: '1px solid var(--neutral-100)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    Nilai stok: <strong style={{ color: 'var(--neutral-800)' }}>{formatCurrency(totalNilai)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
