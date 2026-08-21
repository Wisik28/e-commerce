import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  useSellerProductsQuery, 
  useSellerAnalyticsQuery,
  useSellerUpdateProductMutation,
  useSellerDeleteProductMutation
} from '../../hooks/useApi';
import { StatCard } from '../../components/shared/StatCard';
import { DonutChart } from '../../components/shared/Charts';
import { DataTable } from '../../components/shared/DataTable';
import { Package, AlertTriangle, AlertCircle, Coins, Search, RefreshCw, ShoppingCart } from 'lucide-react';

export const ProductsInventoryPage = () => {
  const { user } = useAuth();
  const sellerId = user?.sellerId;

  // React Query Hooks
  const { data: productsRes, isLoading: isProductsLoading } = useSellerProductsQuery(sellerId);
  const { data: analyticsRes, isLoading: isAnalyticsLoading } = useSellerAnalyticsQuery(sellerId);
  
  const updateProductMutation = useSellerUpdateProductMutation(sellerId);
  const deleteProductMutation = useSellerDeleteProductMutation(sellerId);

  // States
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [searchQuery, setSearchQuery] = useState('');

  const products = productsRes?.data || [];
  const stats = analyticsRes?.data || {
    lowStockCount: 0,
    lowStockProducts: [],
    monthlyRevenue: 0
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleReorder = (product) => {
    const restockQty = 50;
    const newStock = product.stock + restockQty;
    
    updateProductMutation.mutate({
      productId: product.id,
      productData: {
        ...product,
        stock: newStock
      }
    }, {
      onSuccess: () => {
        alert(`Berhasil memesan restok! ${restockQty} unit ditambahkan ke stok produk "${product.name}".`);
      }
    });
  };

  if (isProductsLoading || isAnalyticsLoading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>Memuat data Inventaris...</div>;
  }

  // Filter Categories
  const categories = ['Semua', 'Aksesori', 'Atasan Pria', 'Atasan Wanita', 'Bawahan Pria', 'Bawahan Wanita', 'Outerwear', 'Sepatu'];

  // Filter products by category, status, and search
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesStatus = statusFilter === 'Semua Status' || p.status === statusFilter.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Calculate metrics
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);

  // Stock health distribution matching donut chart helper
  const healthyCount = products.filter(p => p.stock > p.reorderThreshold).length;
  const lowCount = stats.lowStockCount - outOfStockCount; // excluding out of stock
  
  const stockHealthData = {
    sehat: healthyCount,
    rendah: Math.max(0, lowCount),
    habis: outOfStockCount,
    lambat: 8 // static simulation matching spec
  };

  // Columns for inventory table
  const columns = [
    {
      header: 'Nama Produk',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={row.imageUrl} alt={row.name} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
          <div>
            <span className="cell-bold" style={{ fontSize: '0.85rem' }}>{row.name}</span>
            <span className="cell-sub" style={{ fontSize: '0.75rem' }}>SKU: {row.sku}</span>
          </div>
        </div>
      )
    },
    { header: 'Kategori', accessor: 'category', sortable: true },
    { header: 'Harga Jual', accessor: 'sellPrice', sortable: true, render: (row) => formatCurrency(row.sellPrice) },
    {
      header: 'HPP',
      accessor: 'costPrice',
      sortable: true,
      render: (row) => {
        const margin = Math.round(((row.sellPrice - row.costPrice) / row.sellPrice) * 100) || 0;
        return (
          <div>
            <span className="cell-bold">{formatCurrency(row.costPrice)}</span>
            <span className="cell-sub" style={{ color: 'var(--success)', fontWeight: '700' }}>Margin {margin}%</span>
          </div>
        );
      }
    },
    {
      header: 'Stok',
      accessor: 'stock',
      sortable: true,
      render: (row) => {
        let levelClass = '';
        if (row.stock === 0) levelClass = 'status-pill nonaktif';
        else if (row.stock <= row.reorderThreshold) levelClass = 'status-pill rendah';
        return <span className={levelClass ? levelClass : 'cell-bold'} style={{ padding: levelClass ? '0.2rem 0.6rem' : '0', borderRadius: 'var(--radius-sm)' }}>{row.stock} unit</span>;
      }
    },
    { header: 'Terjual (30h)', accessor: 'sold30d', sortable: true },
    { header: 'Revenue (30h)', accessor: 'revenue30d', sortable: true, render: (row) => <span className="cell-bold">{formatCurrency(row.revenue30d)}</span> }
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard 
          label="Total SKU Aktif" 
          value={products.length} 
          icon={Package} 
          caption="12 kategori produk" 
        />
        <StatCard 
          label="Stok Hampir Habis" 
          value={stats.lowStockCount} 
          icon={AlertTriangle} 
          caption="Di bawah threshold reorder" 
          highlight="amber"
        />
        <StatCard 
          label="Habis Stok" 
          value={outOfStockCount} 
          icon={AlertCircle} 
          caption="Perlu restok segera" 
          highlight="red"
        />
        <StatCard 
          label="Nilai Inventaris" 
          value={formatCurrency(inventoryValue)} 
          icon={Coins} 
          caption="Total nilai modal stok saat ini" 
        />
      </div>

      {/* Main filter chips scrollable */}
      <div className="filter-chips-container">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product List Table */}
      <div className="card-section">
        <div className="card-header-flex">
          <div className="card-title-block">
            <h3>Tabel Produk & Inventaris</h3>
            <p>Daftar stok barang, margin laba, dan performa penjualan 30 hari terakhir</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--neutral-200)',
                fontSize: '0.85rem',
                outline: 'none',
                backgroundColor: 'var(--white)'
              }}
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>

            <div className="header-search" style={{ width: '240px' }}>
              <Search className="header-search-icon" size={16} />
              <input 
                type="text" 
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredProducts}
        />
      </div>

      {/* Analytics split: Stock Health & Reorder Suggestions */}
      <div className="dashboard-split" style={{ marginTop: '1.5rem' }}>
        {/* Kesehatan Stok */}
        <div className="card-section" style={{ marginBottom: 0 }}>
          <div className="card-title-block" style={{ marginBottom: '1.25rem' }}>
            <h3>Kesehatan Stok</h3>
            <p>Distribusi status stok dari total {products.length} SKU</p>
          </div>

          <DonutChart data={stockHealthData} />
        </div>

        {/* Saran Reorder */}
        <div className="card-section" style={{ marginBottom: 0 }}>
          <div className="card-title-block" style={{ marginBottom: '1.25rem' }}>
            <h3>Saran Reorder</h3>
            <p>Rekomendasi pemesanan stok barang yang menipis</p>
          </div>

          <div className="split-list">
            {stats.lowStockProducts.length === 0 ? (
              <div style={{ color: 'var(--neutral-400)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                Semua stok produk mencukupi. Tidak ada reorder yang disarankan.
              </div>
            ) : (
              stats.lowStockProducts.map(prod => (
                <div key={prod.id} className="split-list-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700' }}>{prod.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>HPP: {formatCurrency(prod.costPrice)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="status-pill rendah" style={{ fontWeight: '700' }}>Sisa {prod.stock}</span>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => handleReorder(prod)}
                    >
                      <ShoppingCart size={12} /> Reorder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductsInventoryPage;
