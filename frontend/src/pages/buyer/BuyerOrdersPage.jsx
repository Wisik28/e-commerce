import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  useBuyerOrdersQuery, 
  useChatCreateConversationMutation,
  useBuyerSimulateVaPaymentMutation
} from '../../hooks/useApi';
import { ClipboardList, MessageSquare, CreditCard } from 'lucide-react';

export const BuyerOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: ordersRes, isLoading } = useBuyerOrdersQuery(user?.id);
  const rawOrders = ordersRes?.data || [];
  
  // Sort orders descending (riwayat terbaru paling atas)
  const orders = [...rawOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const createChatMutation = useChatCreateConversationMutation();
  const simulateVaPaymentMutation = useBuyerSimulateVaPaymentMutation(user?.id);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleChatSeller = (sellerId) => {
    createChatMutation.mutate({
      buyerId: user.id,
      sellerId: sellerId
    }, {
      onSuccess: (res) => {
        const convId = res.data.id;
        navigate(`/buyer/chat?convId=${convId}`);
      }
    });
  };

  const handleSimulatePayment = (orderId) => {
    if (window.confirm('Apakah Anda ingin mensimulasikan pembayaran lunas untuk pesanan ini?')) {
      simulateVaPaymentMutation.mutate(orderId, {
        onSuccess: () => {
          alert('Simulasi pembayaran VA berhasil! Pesanan Anda kini berstatus Lunas.');
        },
        onError: (err) => {
          alert(err?.message || 'Gagal memproses simulasi pembayaran.');
        }
      });
    }
  };

  // Status computation for payments
  const getComputedStatus = (order) => {
    const rawStatus = (order?.status || '').toUpperCase();

    if (rawStatus === 'CANCELLED' || rawStatus === 'EXPIRED' || rawStatus === 'DIBATALKAN') {
      return { statusKey: 'CANCELLED', label: 'Dibatalkan' };
    }

    if (rawStatus === 'SHIPPED' || rawStatus === 'DIKIRIM') {
      return { statusKey: 'shipped', label: 'Pesanan Dikirim' };
    }

    if (rawStatus === 'COMPLETED' || rawStatus === 'TERKIRIM') {
      return { statusKey: 'terkirim', label: 'Diterima' };
    }

    if (rawStatus === 'PROCESSING' || rawStatus === 'DIPROSES') {
      return { statusKey: 'processing', label: 'Diproses' };
    }

    if (rawStatus === 'PENDING_PAYMENT' || rawStatus === 'MENUNGGU') {
      return { statusKey: 'PENDING_PAYMENT', label: 'Menunggu Pembayaran' };
    }

    if (rawStatus === 'PAID' || rawStatus === 'LUNAS') {
      return { statusKey: 'PAID', label: 'Lunas' };
    }

    return { statusKey: 'PAID', label: 'Lunas' };
  };

  return (
    <div className="catalog-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <ClipboardList size={28} style={{ color: 'var(--primary)' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--neutral-900)' }}>Daftar Pesanan Saya</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>Pantau status pengiriman dan pembayaran pesanan Anda</p>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
          Memuat riwayat transaksi...
        </div>
      )}

      {!isLoading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--neutral-400)', border: '1px dashed var(--neutral-300)', borderRadius: 'var(--radius-lg)' }}>
          <ClipboardList size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>Belum ada pesanan.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Anda belum berbelanja produk apapun di Toko Nusantara.</p>
          <button className="btn-primary" style={{ marginTop: '1.25rem', marginInline: 'auto' }} onClick={() => navigate('/buyer')}>
            Belanja Sekarang
          </button>
        </div>
      ) : (
        /* Single Column Order List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          {orders.map(order => {
            const computed = getComputedStatus(order);

            return (
              <div 
                key={order.id} 
                className="order-detail-card" 
                style={{
                  border: '1px solid var(--neutral-200)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--white)',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)' }}>ID PESANAN</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--neutral-900)' }}>#{order.id}</h4>
                  </div>
                  <span className={`status-pill ${computed.statusKey}`} style={{ fontWeight: '700' }}>
                    <span className="status-pill-dot"></span>
                    <span>{computed.label}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--neutral-700)', fontWeight: '500' }}>
                        {item.productName || item.name} <strong style={{ color: 'var(--neutral-400)' }}>x{item.quantity || item.qty}</strong>
                      </span>
                      <span className="cell-bold">{formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || item.qty || 1))}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--neutral-200)', paddingTop: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', display: 'block' }}>
                      Metode: <strong style={{ textTransform: 'uppercase' }}>{(order.paymentMethod || 'VIRTUAL_ACCOUNT').replace('_', ' ')}</strong>
                    </span>
                    {order.createdAt && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', display: 'block' }}>
                        Tanggal: {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>Total Pembayaran</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--success)', lineHeight: 1.2 }}>
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {computed.statusKey === 'PENDING_PAYMENT' && (
                    <button 
                      className="btn-primary" 
                      style={{ 
                        padding: '0.45rem 0.75rem', 
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onClick={() => handleSimulatePayment(order.id)}
                      disabled={simulateVaPaymentMutation.isPending}
                    >
                      <CreditCard size={14} />
                      {simulateVaPaymentMutation.isPending ? 'Memproses...' : 'Simulasi Bayar VA'}
                    </button>
                  )}
                  {order.sellerId && (
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => handleChatSeller(order.sellerId)}
                    >
                      <MessageSquare size={14} style={{ marginRight: '4px' }} /> Chat Penjual
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerOrdersPage;
