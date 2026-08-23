import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import { 
  ShoppingBag, 
  ShoppingCart, 
  MessageSquare, 
  ClipboardList, 
  LogOut, 
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  User
} from 'lucide-react';
import { useBuyerCartQuery, useBuyerUpdateCartItemMutation, useBuyerRemoveFromCartMutation, useBuyerCheckoutMutation } from '../hooks/useApi';

export const BuyerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchVal, setSearchVal] = useState('');
  const debouncedSearchVal = useDebounce(searchVal, 500);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transfer_bank');

  // Debounced auto-search navigation without pressing Enter
  useEffect(() => {
    if (debouncedSearchVal !== undefined) {
      if (debouncedSearchVal.trim()) {
        navigate(`/buyer?search=${encodeURIComponent(debouncedSearchVal.trim())}`);
      } else if (window.location.search.includes('search=')) {
        navigate('/buyer');
      }
    }
  }, [debouncedSearchVal, navigate]);

  // Fetch cart details
  const { data: cartRes } = useBuyerCartQuery(user?.id);
  const cartItems = cartRes?.data || [];
  
  // Cart Mutations
  const updateCartItemMutation = useBuyerUpdateCartItemMutation(user?.id);
  const removeFromCartMutation = useBuyerRemoveFromCartMutation(user?.id);
  const checkoutMutation = useBuyerCheckoutMutation(user?.id);

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQtyChange = (productId, currentQty, increment, stock) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty <= 0) {
      removeFromCartMutation.mutate(productId);
    } else if (newQty <= stock) {
      updateCartItemMutation.mutate({ productId, qty: newQty });
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    checkoutMutation.mutate({ paymentMethod }, {
      onSuccess: () => {
        setCheckoutModalOpen(false);
        setCartOpen(false);
        alert('Pesanan berhasil dibuat! Silakan buka menu "Pesanan Saya" untuk melihat status dan mengunggah bukti bayar.');
      },
      onError: (err) => {
        alert(err.message || 'Checkout gagal.');
      }
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Redirect to buyer page with search parameters
    navigate(`/buyer?search=${encodeURIComponent(searchVal)}`);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="buyer-layout">
      {/* Top Navbar */}
      <header className="buyer-topbar">
        <div className="buyer-brand" onClick={() => navigate('/buyer')}>
          <ShoppingBag size={24} style={{ color: 'var(--primary)' }} />
          <span>Paingan Store</span>
        </div>

        <form onSubmit={handleSearchSubmit} className="buyer-search">
          <Search className="header-search-icon" size={16} />
          <input
            type="text"
            placeholder="Cari produk batik, sneakers, tas..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </form>

        <div className="buyer-nav-actions">
          {/* <Link to="/buyer" className="buyer-action-link">
            Katalog
          </Link>
           */}
          {/* <Link to="/buyer/orders" className="buyer-action-link">
            <ClipboardList size={18} />
            <span>Pesanan Saya</span>
          </Link> */}

          {/* <Link to="/buyer/chat" className="buyer-action-link">
            <MessageSquare size={18} />
            <span>Chat</span>
          </Link> */}

          {/* <button className="cart-icon-btn" onClick={() => setCartOpen(true)} title="Keranjang Belanja">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button> */}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid var(--neutral-200)', paddingLeft: '1rem' }}>
            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
              {user?.avatarInitial || 'RW'}
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Log Out" style={{ padding: '0.25rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3>Keranjang Belanja ({cartCount})</h3>
              <button className="close-btn" onClick={() => setCartOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-drawer-items">
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--neutral-400)' }}>
                  <ShoppingCart size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                  <p>Keranjang Anda masih kosong.</p>
                  <button className="btn-outline-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setCartOpen(false)}>
                    Mulai Belanja
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.productId} className="cart-item-row">
                    <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-info">
                      <span className="cart-item-store">{item.storeName}</span>
                      <h4 className="cart-item-title">{item.name}</h4>
                      <div className="cart-item-price">{formatCurrency(item.price)}</div>
                      
                      <div className="cart-item-controls">
                        <div className="qty-selector">
                          <button className="qty-btn" onClick={() => handleQtyChange(item.productId, item.qty, false, item.stock)}>
                            <Minus size={12} />
                          </button>
                          <span className="qty-value">{item.qty}</span>
                          <button className="qty-btn" onClick={() => handleQtyChange(item.productId, item.qty, true, item.stock)}>
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        <button className="btn-remove-item" onClick={() => removeFromCartMutation.mutate(item.productId)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Pengiriman</span>
                  <span style={{ color: 'var(--success)', fontWeight: '600' }}>Gratis</span>
                </div>
                <div className="cart-summary-row total">
                  <span>Total Bayar</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '0.85rem' }}
                  onClick={() => setCheckoutModalOpen(true)}
                >
                  Lanjut ke Pembayaran
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="modal-overlay" onClick={() => setCheckoutModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Konfirmasi Pembayaran</h3>
              <button className="close-btn" onClick={() => setCheckoutModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', marginBottom: '1.25rem' }}>
                  Silakan pilih metode pembayaran untuk total pesanan Anda sebesar <strong>{formatCurrency(cartTotal)}</strong>.
                </p>

                <div className="form-group">
                  <label>Pilih Metode Pembayaran</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="transfer_bank">Transfer Bank (Manual Upload)</option>
                    <option value="gopay">GoPay (Virtual Account)</option>
                    <option value="ovo">OVO (Virtual Account)</option>
                    <option value="qris">QRIS (Instant)</option>
                    <option value="dana">Dana (Virtual Account)</option>
                    <option value="cod">COD (Bayar di Tempat)</option>
                  </select>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', fontSize: '0.8rem' }}>
                  {paymentMethod === 'transfer_bank' && (
                    <div>
                      <h5 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>🏦 Instruksi Rekening:</h5>
                      <p>Kirim ke rekening <strong>Bank BCA: 1234-567-890</strong> a.n. <strong>PT Toko Nusantara</strong>.</p>
                      <p style={{ color: 'var(--primary)', marginTop: '4px' }}>* Wajib unggah foto/screenshot bukti transfer di menu "Pesanan Saya" setelah checkout.</p>
                    </div>
                  )}
                  {paymentMethod === 'cod' && (
                    <p>Pesanan akan langsung diproses oleh Penjual. Pembayaran dilakukan secara tunai kepada kurir saat barang tiba.</p>
                  )}
                  {['gopay', 'ovo', 'qris', 'dana'].includes(paymentMethod) && (
                    <p>Pembayaran VA akan dikonfirmasi otomatis oleh sistem. Nomor VA / kode QR akan diterbitkan setelah pesanan dikonfirmasi.</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setCheckoutModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={checkoutMutation.isPending}>
                  {checkoutMutation.isPending ? 'Memproses...' : 'Buat Pesanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};
export default BuyerLayout;
