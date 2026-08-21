import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  useSellerAnalyticsQuery,
  useSellerProductsQuery,
  useSellerOrdersQuery,
  useSellerAddProductMutation,
  useSellerUpdateProductMutation,
  useSellerDeleteProductMutation,
  useSellerUpdateOrderStatusMutation,
  useSellerConfirmManualPaymentMutation
} from '../../hooks/useApi';
import { StatCard } from '../../components/shared/StatCard';
import { TrendChart, DonutChart } from '../../components/shared/Charts';
import { DataTable } from '../../components/shared/DataTable';
import { 
  Package, 
  ShoppingBag, 
  CheckCircle, 
  TrendingUp,
  AlertTriangle,
  Users,
  Search,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  Eye,
  FileText
} from 'lucide-react';

export const SellerDashboardPage = () => {
  const { user } = useAuth();
  const sellerId = user?.sellerId;

  // React Query Hooks
  const { data: analyticsRes, isLoading: isAnalyticsLoading } = useSellerAnalyticsQuery(sellerId);
  const { data: productsRes, isLoading: isProductsLoading } = useSellerProductsQuery(sellerId);
  const { data: ordersRes, isLoading: isOrdersLoading } = useSellerOrdersQuery(sellerId);
  
  const addProductMutation = useSellerAddProductMutation(sellerId);
  const updateProductMutation = useSellerUpdateProductMutation(sellerId);
  const deleteProductMutation = useSellerDeleteProductMutation(sellerId);
  const updateOrderStatusMutation = useSellerUpdateOrderStatusMutation(sellerId);
  const confirmPaymentMutation = useSellerConfirmManualPaymentMutation(sellerId);

  // States
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [searchQuery, setSearchQuery] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if adding, product object if editing
  const [viewProofUrl, setViewProofUrl] = useState(null);

  // Form states for Product Add/Edit
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Atasan Pria');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodThreshold, setProdThreshold] = useState('10');

  const stats = analyticsRes?.data || {
    totalProducts: 0,
    totalOrders: 0,
    pendingConfirmations: 0,
    monthlyRevenue: 0,
    aov: 0,
    returnRate: 0,
    todayRevenue: 0,
    todayTarget: 1,
    todayOrders: 0,
    lowStockCount: 0,
    lowStockProducts: [],
    topProducts: [],
    highValueOrders: [],
    paymentDistribution: {}
  };

  const products = productsRes?.data || [];
  const orders = ordersRes?.data || [];

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Atasan Pria');
    setProdPrice('');
    setProdCost('');
    setProdStock('');
    setProdThreshold('10');
    setProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdPrice(product.sellPrice);
    setProdCost(product.costPrice);
    setProdStock(product.stock);
    setProdThreshold(product.reorderThreshold);
    setProductModalOpen(true);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      category: prodCategory,
      sellPrice: Number(prodPrice),
      costPrice: Number(prodCost || prodPrice * 0.5),
      stock: Number(prodStock),
      reorderThreshold: Number(prodThreshold),
      storeName: stats.storeName || user.name
    };

    if (editingProduct) {
      updateProductMutation.mutate({
        productId: editingProduct.id,
        productData: payload
      }, {
        onSuccess: () => {
          setProductModalOpen(false);
          alert('Produk berhasil diperbarui!');
        }
      });
    } else {
      addProductMutation.mutate(payload, {
        onSuccess: () => {
          setProductModalOpen(false);
          alert('Produk berhasil ditambahkan!');
        }
      });
    }
  };

  const handleDeleteProduct = (productId, name) => {
    if (confirm(`Hapus produk "${name}"?`)) {
      deleteProductMutation.mutate(productId, {
        onSuccess: () => {
          alert('Produk berhasil dihapus.');
        }
      });
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filter local lists
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayProgressPercent = Math.min(100, Math.round((stats.todayRevenue / stats.todayTarget) * 100)) || 0;

  // Chart data: weekly revenue (7 weeks)
  const weeklyRevenueData = [1200000, 2400000, 1800000, 2900000, 3100000, 2600000, stats.todayRevenue + 1500000];
  const weeklyRevenueLabels = ['W1 Jul', 'W2 Jul', 'W3 Jul', 'W4 Jul', 'W1 Agu', 'W2 Agu', 'W3 Agu'];

  // Table Columns for Tab: Products
  const productColumns = [
    {
      header: 'Produk',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={row.imageUrl} alt={row.name} style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
          <div>
            <span className="cell-bold" style={{ fontSize: '0.85rem' }}>{row.name}</span>
            <span className="cell-sub">{row.category}</span>
          </div>
        </div>
      )
    },
    { header: 'Harga', accessor: 'sellPrice', sortable: true, render: (row) => formatCurrency(row.sellPrice) },
    { header: 'Stok', accessor: 'stock', sortable: true, render: (row) => <span className={`cell-bold ${row.stock <= row.reorderThreshold ? 'status-pill rendah' : ''}`} style={{ padding: row.stock <= row.reorderThreshold ? '0.2rem 0.5rem' : '0', borderRadius: 'var(--radius-sm)' }}>{row.stock} unit</span> },
    { header: 'Terjual', accessor: 'sold30d', sortable: true },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="icon-btn" onClick={() => openEditProductModal(row)} title="Edit Produk">
            <Edit2 size={14} />
          </button>
          <button className="icon-btn" onClick={() => handleDeleteProduct(row.id, row.name)} title="Hapus Produk" style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}>
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  // Table Columns for Tab: Orders
  const orderColumns = [
    { header: 'Order ID', accessor: 'id', sortable: true, render: (row) => <span className="cell-bold">{row.id}</span> },
    { header: 'Pelanggan', accessor: 'buyerName', sortable: true },
    {
      header: 'Produk',
      accessor: 'items',
      render: (row) => (
        <div style={{ maxWidth: '200px', fontSize: '0.8rem' }}>
          {row.items.map((item, idx) => (
            <div key={idx} className="cell-bold">{item.name} <span style={{ color: 'var(--neutral-400)' }}>x{item.qty}</span></div>
          ))}
        </div>
      )
    },
    { header: 'Jumlah', accessor: 'totalAmount', sortable: true, render: (row) => <span className="cell-bold">{formatCurrency(row.totalAmount)}</span> },
    { header: 'Metode', accessor: 'paymentMethod', render: (row) => <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-500)' }}>{row.paymentMethod.replace('_', ' ')}</span> },
    { header: 'Tanggal', accessor: 'createdAt', sortable: true, render: (row) => new Date(row.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={row.status}
            onChange={(e) => updateOrderStatusMutation.mutate({ orderId: row.id, status: e.target.value })}
            className={`status-pill ${row.status}`}
            style={{ border: 'none', padding: '0.2rem 0.5rem', fontWeight: '700', borderRadius: '9999px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="menunggu">Menunggu</option>
            <option value="proof_submitted">Bukti Diupload</option>
            <option value="diproses">Diproses</option>
            <option value="dikirim">Dikirim</option>
            <option value="terkirim">Terkirim</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {row.status === 'proof_submitted' && row.paymentProofUrl && (
            <button 
              className="icon-btn" 
              onClick={() => setViewProofUrl(row.paymentProofUrl)} 
              title="Lihat Bukti Transfer"
              style={{ color: 'var(--pending)', borderColor: '#fbd38d' }}
            >
              <Eye size={14} />
            </button>
          )}
        </div>
      )
    },
    {
      header: 'Konfirmasi',
      accessor: 'id',
      render: (row) => {
        if (row.status === 'proof_submitted') {
          return (
            <button
              className="btn-primary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => confirmPaymentMutation.mutate(row.id)}
            >
              <Check size={12} /> Terima
            </button>
          );
        }
        return <span style={{ color: 'var(--neutral-400)', fontSize: '0.75rem' }}>-</span>;
      }
    }
  ];

  if (isAnalyticsLoading || isProductsLoading || isOrdersLoading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>Memuat data Dashboard Penjual...</div>;
  }

  return (
    <div>
      {/* Top 4 Stat Cards */}
      <div className="stats-grid">
        <StatCard label="Total Produk" value={stats.totalProducts} icon={Package} caption="Produk aktif terdaftar" />
        <StatCard label="Pesanan Masuk" value={stats.totalOrders} icon={ShoppingBag} caption="Total order masuk" />
        <StatCard label="Perlu Konfirmasi" value={stats.pendingConfirmations} icon={CheckCircle} caption="Bukti bayar manual pending" highlight={stats.pendingConfirmations > 0 ? 'amber' : ''} />
        <StatCard label="Revenue Bulan Ini" value={formatCurrency(stats.monthlyRevenue)} icon={TrendingUp} caption="Agustus 2026" />
      </div>

      {/* Grid: Ringkasan Hari Ini & Chart Mingguan */}
      <div className="dashboard-split">
        {/* Ringkasan Hari Ini */}
        <div className="card-section">
          <div className="card-title-block" style={{ marginBottom: '1.25rem' }}>
            <h3>Ringkasan Performa Hari Ini</h3>
            <p>Pantau metrik penjualan toko Anda hari ini</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Revenue progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--neutral-500)' }}>Revenue Hari Ini: <strong style={{ color: 'var(--neutral-900)' }}>{formatCurrency(stats.todayRevenue)}</strong></span>
                <span style={{ color: 'var(--primary)' }}>Target: {formatCurrency(stats.todayTarget)} ({todayProgressPercent}%)</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${todayProgressPercent}%` }}></div>
              </div>
            </div>

            {/* Metrik horizontal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <span className="stat-label">Total Pesanan</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '2px' }}>{stats.todayOrders} order</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '700' }}>↗ +4% vs Kemarin</span>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <span className="stat-label">Rata-rata Pesanan (AOV)</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '2px' }}>{formatCurrency(stats.aov)}</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '700' }}>↗ +1.8% vs Kemarin</span>
              </div>
            </div>

            {/* Highlight Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {stats.pendingConfirmations > 0 && (
                <div className="status-pill pending" style={{ padding: '0.4rem 0.75rem', fontWeight: '600' }}>
                  <AlertTriangle size={14} style={{ marginRight: '4px' }} /> {stats.pendingConfirmations} pesanan perlu dikonfirmasi
                </div>
              )}
              {stats.lowStockCount > 0 && (
                <div className="status-pill rendah" style={{ padding: '0.4rem 0.75rem', fontWeight: '600' }}>
                  <AlertTriangle size={14} style={{ marginRight: '4px' }} /> {stats.lowStockCount} produk stok hampir habis
                </div>
              )}
              <div className="status-pill aktif" style={{ padding: '0.4rem 0.75rem', fontWeight: '600' }}>
                <Users size={14} style={{ marginRight: '4px' }} /> +18 Pelanggan Baru Hari Ini
              </div>
            </div>
          </div>
        </div>

        {/* Chart Revenue */}
        <div className="card-section">
          <div className="card-header-flex">
            <div className="card-title-block">
              <h3>Tren Pendapatan Mingguan</h3>
              <p>Total pendapatan toko dalam 7 minggu terakhir</p>
            </div>
            <span className="status-pill aktif">+15,2% MoM</span>
          </div>
          <TrendChart data={weeklyRevenueData} labels={weeklyRevenueLabels} height={190} />
        </div>
      </div>

      {/* Split lists: Low Stock, Top Products */}
      <div className="dashboard-split" style={{ marginBottom: '2rem' }}>
        {/* Stok Hampir Habis */}
        <div className="card-section" style={{ marginBottom: 0 }}>
          <div className="card-header-flex">
            <div className="card-title-block">
              <h3>Stok Hampir Habis</h3>
              <p>Stok produk berada di bawah batas minimal</p>
            </div>
            <a href="/seller/products-inventory" className="buyer-action-link" style={{ fontSize: '0.8rem', fontWeight: '700' }}>Kelola ↗</a>
          </div>

          <div className="split-list">
            {stats.lowStockProducts.length === 0 ? (
              <div style={{ color: 'var(--neutral-400)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                Stok semua produk dalam kondisi aman.
              </div>
            ) : (
              stats.lowStockProducts.map(prod => {
                const stockPercent = Math.max(0, Math.min(100, Math.round((prod.stock / prod.reorderThreshold) * 100)));
                return (
                  <div key={prod.id} className="split-list-item warning">
                    <div className="list-item-meta">
                      <div className="list-item-details">
                        <h4>{prod.name}</h4>
                        <p>Threshold: {prod.reorderThreshold} unit</p>
                      </div>
                    </div>
                    
                    <div className="list-item-right" style={{ width: '120px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', fontWeight: '700', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--danger)' }}>Sisa: {prod.stock} unit</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: '4px', width: '100%' }}>
                        <div className="progress-bar-fill danger" style={{ width: `${stockPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card-section" style={{ marginBottom: 0 }}>
          <div className="card-title-block" style={{ marginBottom: '1.25rem' }}>
            <h3>Top Produk Terlaris</h3>
            <p>Berdasarkan revenue penjualan 30 hari terakhir</p>
          </div>
          
          <div className="split-list">
            {stats.topProducts.length === 0 ? (
              <div style={{ color: 'var(--neutral-400)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                Belum ada data transaksi.
              </div>
            ) : (
              stats.topProducts.map((prod, idx) => (
                <div key={prod.id} className="split-list-item">
                  <div className="list-item-meta">
                    <span className="list-item-rank">{idx + 1}</span>
                    <div className="list-item-details">
                      <h4>{prod.name}</h4>
                      <p>{prod.sold30d} terjual</p>
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className="list-item-val">{formatCurrency(prod.revenue30d)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Table Tabs: Products / Orders */}
      <div className="card-section">
        <div className="tab-pills">
          <div 
            className={`tab-pill ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
          >
            Produk ({products.length})
          </div>
          <div 
            className={`tab-pill ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
          >
            Pesanan ({orders.length})
          </div>
        </div>

        {/* Search & Actions toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="header-search" style={{ width: '320px' }}>
            <Search className="header-search-icon" size={16} />
            <input 
              type="text" 
              placeholder={activeTab === 'products' ? "Cari nama atau SKU produk..." : "Cari order ID atau nama pelanggan..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'products' && (
            <button className="btn-primary" onClick={openAddProductModal}>
              <Plus size={16} /> Tambah Produk
            </button>
          )}
        </div>

        {/* Tables */}
        {activeTab === 'products' ? (
          <DataTable
            columns={productColumns}
            data={filteredProducts}
          />
        ) : (
          <DataTable
            columns={orderColumns}
            data={filteredOrders}
          />
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {productModalOpen && (
        <div className="modal-overlay" onClick={() => setProductModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button className="close-btn" onClick={() => setProductModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nama Produk</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kemeja Batik Parang Premium"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Kategori</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      required
                    >
                      <option value="Atasan Pria">Atasan Pria</option>
                      <option value="Atasan Wanita">Atasan Wanita</option>
                      <option value="Bawahan Pria">Bawahan Pria</option>
                      <option value="Bawahan Wanita">Bawahan Wanita</option>
                      <option value="Outerwear">Outerwear</option>
                      <option value="Sepatu">Sepatu</option>
                      <option value="Aksesori">Aksesori</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Harga Jual (Rp)</label>
                    <input
                      type="number"
                      placeholder="Harga ke pembeli"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Harga Pokok (HPP) (Rp)</label>
                    <input
                      type="number"
                      placeholder="Harga modal"
                      value={prodCost}
                      onChange={(e) => setProdCost(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Stok Awal</label>
                    <input
                      type="number"
                      placeholder="Jumlah stok"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Threshold Reorder (Batas Stok Rendah)</label>
                  <input
                    type="number"
                    placeholder="Peringatan stok ketika di bawah jumlah ini"
                    value={prodThreshold}
                    onChange={(e) => setProdThreshold(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setProductModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={addProductMutation.isPending || updateProductMutation.isPending}>
                  {editingProduct ? 'Perbarui Produk' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Proof Modal */}
      {viewProofUrl && (
        <div className="modal-overlay" onClick={() => setViewProofUrl(null)}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bukti Pembayaran</h3>
              <button className="close-btn" onClick={() => setViewProofUrl(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
              <img src={viewProofUrl} alt="Bukti Transfer" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }} />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewProofUrl(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SellerDashboardPage;
