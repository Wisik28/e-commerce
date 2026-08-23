import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useSellerProductsQuery,
  useSellerAddProductMutation,
  useSellerUpdateProductMutation,
  useSellerDeleteProductMutation
} from '../../hooks/useApi';
import {
  Plus, Search, Edit2, Trash2, X, Package,
  CheckCircle2, ArchiveX, Tag
} from 'lucide-react';

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0);

const StatusBadge = ({ stock, reorderThreshold = 10 }) => {
  if (stock === 0)
    return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.73rem' }}>Habis</span>;
  if (stock <= reorderThreshold)
    return <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.73rem' }}>Menipis</span>;
  return <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.73rem' }}>Tersedia</span>;
};

// ─── Modal Tambah/Edit Produk ─────────────────────────────────────────────────
const ProductModal = ({ editingProduct, onClose, onSubmit, isPending }) => {
  const isEdit = !!editingProduct;

  const [name, setName] = useState(editingProduct?.name || '');
  const [category, setCategory] = useState(editingProduct?.category || 'Umum');
  const [price, setPrice] = useState(editingProduct?.sellPrice || '');
  const [stock, setStock] = useState(editingProduct?.stock ?? '');
  const [weight, setWeight] = useState(editingProduct?.weightGram || '');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      category,
      price: Number(price),
      sellPrice: Number(price),
      stock: Number(stock),
      weightGram: Number(weight) || 1000,
      description: description || category,
      reorderThreshold: 10
    });
  };

  const categories = ['Umum', 'Fashion', 'Elektronik', 'Makanan', 'Kesehatan', 'Olahraga', 'Rumah', 'Otomotif', 'Mainan'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Nama Produk */}
            <div className="form-group">
              <label>Nama Produk <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                placeholder="Masukkan nama produk..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Kategori & Harga */}
            <div className="form-grid">
              <div className="form-group">
                <label>Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Harga Jual (Rp) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="number"
                  placeholder="Contoh: 50000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Stok & Berat */}
            <div className="form-grid">
              <div className="form-group">
                <label>Stok <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="number"
                  placeholder="Jumlah stok"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Berat (gram)</label>
                <input
                  type="number"
                  placeholder="Contoh: 500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="form-group">
              <label>Deskripsi Produk</label>
              <input
                type="text"
                placeholder="Deskripsi singkat produk (opsional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Menyimpan...' : (isEdit ? 'Perbarui Produk' : 'Tambah Produk')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ProductsInventoryPage = () => {
  const { user } = useAuth();
  const sellerId = user?.sellerId;

  const { data: productsRes, isLoading } = useSellerProductsQuery(sellerId);
  const addMutation = useSellerAddProductMutation(sellerId);
  const updateMutation = useSellerUpdateProductMutation(sellerId);
  const deleteMutation = useSellerDeleteProductMutation(sellerId);

  const products = productsRes?.data || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
        Memuat data produk...
      </div>
    );
  }

  // ─── Filter produk ──────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const stock = p.stock;
    const threshold = p.reorderThreshold || 10;

    if (filterStatus === 'tersedia') return matchSearch && stock > threshold;
    if (filterStatus === 'menipis') return matchSearch && stock > 0 && stock <= threshold;
    if (filterStatus === 'habis') return matchSearch && stock === 0;
    return matchSearch;
  });

  // ─── Handlers ───────────────────────────────────────────────────
  const openAdd = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (product) => { setEditingProduct(product); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingProduct(null); };

  const handleSubmit = (payload) => {
    if (editingProduct) {
      updateMutation.mutate({ productId: editingProduct.id, productData: payload }, {
        onSuccess: () => { closeModal(); alert('Produk berhasil diperbarui!'); },
        onError: (err) => alert('Gagal memperbarui: ' + err.message)
      });
    } else {
      addMutation.mutate(payload, {
        onSuccess: () => { closeModal(); alert('Produk berhasil ditambahkan!'); },
        onError: (err) => alert('Gagal menambahkan: ' + err.message)
      });
    }
  };

  const handleDelete = (product) => {
    if (confirm(`Hapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteMutation.mutate(product.id, {
        onSuccess: () => alert('Produk berhasil dihapus.'),
        onError: (err) => alert('Gagal menghapus: ' + err.message)
      });
    }
  };

  // ─── Summary counts ─────────────────────────────────────────────
  const totalProduk = products.length;
  const stokHabis = products.filter(p => p.stock === 0).length;
  const stokMenipis = products.filter(p => p.stock > 0 && p.stock <= (p.reorderThreshold || 10)).length;
  const stokAman = products.filter(p => p.stock > (p.reorderThreshold || 10)).length;

  return (
    <div>
      {/* ─── Mini Summary ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Produk', value: totalProduk, icon: Package, color: '#EB5E28', bg: '#fff7f4' },
          { label: 'Stok Aman', value: stokAman, icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Stok Menipis', value: stokMenipis, icon: Tag, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Stok Habis', value: stokHabis, icon: ArchiveX, color: '#ef4444', bg: '#fef2f2' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--neutral-200)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', fontWeight: '600' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Tabel Produk ──────────────────────────────────────────── */}
      <div className="card-section">
        {/* Header toolbar */}
        <div className="card-header-flex" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="card-title-block">
            <h3>Daftar Produk</h3>
            <p>{filteredProducts.length} dari {totalProduk} produk ditampilkan</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="header-search" style={{ width: '220px' }}>
              <Search className="header-search-icon" size={15} />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter status stok */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'var(--white)' }}
            >
              <option value="semua">Semua Stok</option>
              <option value="tersedia">Stok Aman</option>
              <option value="menipis">Stok Menipis</option>
              <option value="habis">Stok Habis</option>
            </select>

            {/* Tambah produk */}
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={16} /> Tambah Produk
            </button>
          </div>
        </div>

        {/* Table */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-400)' }}>
            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <p style={{ fontWeight: '600' }}>
              {searchQuery || filterStatus !== 'semua' ? 'Tidak ada produk yang sesuai dengan filter.' : 'Belum ada produk. Klik "Tambah Produk" untuk mulai.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--neutral-200)' }}>
                  {['Produk', 'Kategori', 'Harga Jual', 'Stok', 'Berat', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: '700', fontSize: '0.78rem', color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, idx) => (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: '1px solid var(--neutral-100)',
                      backgroundColor: idx % 2 === 0 ? 'var(--white)' : 'var(--neutral-50)',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff7f4'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'var(--white)' : 'var(--neutral-50)'}
                  >
                    {/* Produk */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#EB5E28',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: '800' }}>
                            {product.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--neutral-900)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--neutral-400)' }}>
                            ID: {product.id?.toString().slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--neutral-600)' }}>
                      {product.category || '—'}
                    </td>

                    {/* Harga */}
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--neutral-900)' }}>
                      {formatCurrency(product.sellPrice)}
                    </td>

                    {/* Stok */}
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>
                      {product.stock} unit
                    </td>

                    {/* Berat */}
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--neutral-500)' }}>
                      {product.weightGram ? `${product.weightGram} g` : '—'}
                    </td>

                    {/* Status stok */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <StatusBadge stock={product.stock} reorderThreshold={product.reorderThreshold} />
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(product)}
                          title="Edit Produk"
                          style={{ color: 'var(--primary)', borderColor: '#fbd0b0' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleDelete(product)}
                          title="Hapus Produk"
                          style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <ProductModal
          editingProduct={editingProduct}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isPending={addMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};
export default ProductsInventoryPage;
