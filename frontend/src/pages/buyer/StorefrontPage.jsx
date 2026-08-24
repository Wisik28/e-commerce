import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBuyerProductsQuery, useBuyerAddToCartMutation } from '../../hooks/useApi';
import { Star, ShoppingCart, Tag } from 'lucide-react';

export const StorefrontPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleProductCardClick = (product) => {
    navigate('/buyer/order', { state: { product } });
  };
  
  // Extract search from URL query
  const queryParams = new URLSearchParams(location.search);
  const searchParam = queryParams.get('search') || '';

  // React Query Hooks
  const { data: productsRes, isLoading } = useBuyerProductsQuery({
    search: searchParam
  });
  const products = productsRes?.data || [];

  const addToCartMutation = useBuyerAddToCartMutation(user?.id);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCartMutation.mutate({
      productId: product.id,
      qty: 1
    }, {
      onSuccess: () => {
        alert(`Berhasil menambahkan "${product.name}" ke keranjang belanja!`);
      },
      onError: (err) => {
        alert(err.message || 'Gagal menambahkan ke keranjang.');
      }
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="catalog-container">
      {/* Grid Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--neutral-900)' }}>
          {searchParam ? `Hasil pencarian untuk "${searchParam}"` : `Katalog Produk`}
        </h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: '600' }}>
          Menampilkan {products.length} produk
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--neutral-500)', fontWeight: '600' }}>
          Memuat katalog produk Toko Nusantara...
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--neutral-400)', border: '1px dashed var(--neutral-300)', borderRadius: 'var(--radius-lg)' }}>
          <Tag size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>Maaf, produk tidak ditemukan.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Coba ubah kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(prod => (
            <div key={prod.id} className="product-card" onClick={() => handleProductCardClick(prod)} style={{ cursor: 'pointer' }}>
              <div className="product-card-img-wrapper">
                <img src={prod.imageUrl} alt={prod.name} className="product-card-img" />
                {prod.stock <= prod.reorderThreshold && (
                  <span className="product-card-badge" style={{ color: 'var(--warning)', fontWeight: '800' }}>
                    Stok Terbatas
                  </span>
                )}
                {prod.stock === 0 && (
                  <span className="product-card-badge" style={{ color: 'var(--danger)', fontWeight: '800' }}>
                    Habis
                  </span>
                )}
              </div>

              <div className="product-card-body">
                <span className="product-card-store">🏪 {prod.storeName}</span>
                <h4 className="product-card-title" title={prod.name}>{prod.name}</h4>
                
                <div className="product-card-rating">
                  <Star size={14} className="star-icon" />
                  <span>{prod.rating.toFixed(1)} <span style={{ color: 'var(--neutral-400)', fontWeight: '500' }}>({prod.reviewsCount} ulasan)</span></span>
                </div>

                <div className="product-card-footer">
                  <span className="product-card-price">{formatCurrency(prod.sellPrice)}</span>
                  <button 
                    className="btn-add-cart-circle" 
                    onClick={(e) => handleAddToCart(e, prod)}
                    disabled={prod.stock === 0 || addToCartMutation.isPending}
                    title={prod.stock === 0 ? 'Stok Habis' : 'Masukkan Keranjang'}
                    style={{ 
                      opacity: prod.stock === 0 ? 0.5 : 1, 
                      cursor: prod.stock === 0 ? 'not-allowed' : 'pointer',
                      backgroundColor: prod.stock === 0 ? 'var(--neutral-400)' : 'var(--primary)' 
                    }}
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default StorefrontPage;
