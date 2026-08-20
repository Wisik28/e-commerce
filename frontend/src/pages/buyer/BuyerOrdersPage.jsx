import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  useBuyerOrdersQuery, 
  useBuyerUploadPaymentProofMutation,
  useChatCreateConversationMutation
} from '../../hooks/useApi';
import { ClipboardList, AlertCircle, Upload, CheckCircle2, MessageSquare, ArrowRight, X } from 'lucide-react';

export const BuyerOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: ordersRes, isLoading } = useBuyerOrdersQuery(user?.id);
  const orders = ordersRes?.data || [];

  const uploadProofMutation = useBuyerUploadPaymentProofMutation(user?.id);
  const createChatMutation = useChatCreateConversationMutation();

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [mockProofUrl, setMockProofUrl] = useState('');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleOpenProofModal = (orderId) => {
    setSelectedOrderId(orderId);
    // Generate a default mock receipt SVG
    const mockReceiptSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="#DEF7EC"/><text x="50%" y="20%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="14" fill="#03543F">BUKTI TRANSFER</text><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#03543F">ID: ${orderId}</text><text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="16" fill="#03543F">LUNAS</text></svg>`;
    setMockProofUrl('data:image/svg+xml;utf8,' + encodeURIComponent(mockReceiptSvg));
    setProofModalOpen(true);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    uploadProofMutation.mutate({
      orderId: selectedOrderId,
      proofDataUrl: mockProofUrl
    }, {
      onSuccess: () => {
        setProofModalOpen(false);
        alert('Bukti transfer berhasil diunggah! Penjual akan segera memverifikasi pembayaran Anda.');
      },
      onError: (err) => {
        alert(err.message || 'Gagal mengunggah bukti.');
      }
    });
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

  const getStatusLabel = (status) => {
    const statusMap = {
      menunggu: 'Menunggu Pembayaran',
      proof_submitted: 'Bukti Pembayaran Diunggah',
      diproses: 'Pesanan Diproses',
      dikirim: 'Pesanan Dikirim',
      terkirim: 'Diterima',
      cancelled: 'Dibatalkan'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="catalog-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
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
        <div className="buyer-orders-container">
          {/* Orders list left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orders.map(order => (
              <div 
                key={order.id} 
                className="order-detail-card" 
                style={{
                  border: '1px solid var(--neutral-200)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)' }}>ID PESANAN</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--neutral-900)' }}>#{order.id}</h4>
                  </div>
                  <span className={`status-pill ${order.status}`} style={{ fontWeight: '700' }}>
                    <span className="status-pill-dot"></span>
                    <span>{getStatusLabel(order.status)}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--neutral-700)', fontWeight: '500' }}>
                        {item.name} <strong style={{ color: 'var(--neutral-400)' }}>x{item.qty}</strong>
                      </span>
                      <span className="cell-bold">{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--neutral-200)', paddingTop: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', display: 'block' }}>Metode: <strong style={{ textTransform: 'uppercase' }}>{order.paymentMethod.replace('_', ' ')}</strong></span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', display: 'block' }}>Tanggal: {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>Total Pembayaran</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)', lineHeight: 1.2 }}>{formatCurrency(order.totalAmount)}</div>
                  </div>
                </div>

                {/* Operations */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleChatSeller(order.sellerId)}
                  >
                    <MessageSquare size={14} style={{ marginRight: '4px' }} /> Chat Penjual
                  </button>
                  
                  {order.status === 'menunggu' && order.paymentMethod === 'transfer_bank' && (
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => handleOpenProofModal(order.id)}
                    >
                      <Upload size={14} style={{ marginRight: '4px' }} /> Unggah Bukti
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Guides Right Column */}
          <div className="card-section" style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '0.75rem' }}>Panduan Pembayaran Manual</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--neutral-500)', marginBottom: '1.25rem' }}>
              Jika Anda memilih metode <strong>Transfer Bank</strong>, silakan selesaikan pembayaran ke nomor rekening di bawah ini:
            </p>

            <div style={{ backgroundColor: 'var(--neutral-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', fontWeight: '700', textTransform: 'uppercase' }}>Nama Bank</span>
                <div style={{ fontWeight: '700', color: 'var(--neutral-900)' }}>Bank Central Asia (BCA)</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', fontWeight: '700', textTransform: 'uppercase' }}>Nomor Rekening</span>
                <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1rem' }}>1234 - 567 - 890</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', fontWeight: '700', textTransform: 'uppercase' }}>Atas Nama (Beneficiary)</span>
                <div style={{ fontWeight: '700', color: 'var(--neutral-900)' }}>PT Toko Nusantara</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>⚠️ Catatan Penting:</h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--neutral-500)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Gunakan nominal transfer yang <strong>persis sama</strong> dengan total pembayaran Anda.</li>
              <li>Pastikan foto/screenshot bukti bayar terlihat <strong>jelas</strong> (nomor rekening pengirim, penerima, jumlah, dan tanggal transfer).</li>
              <li>Penjual akan memproses pesanan Anda dalam waktu maksimal 1x24 jam setelah bukti transfer terkonfirmasi.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Upload Proof Modal */}
      {proofModalOpen && (
        <div className="modal-overlay" onClick={() => setProofModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Unggah Bukti Transfer</h3>
              <button className="close-btn" onClick={() => setProofModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '1rem' }}>
                  Unggah bukti transfer Anda untuk pesanan <strong>#{selectedOrderId}</strong>. Sistem telah membuatkan draf tanda terima otomatis untuk keperluan simulasi.
                </p>

                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', marginBottom: '1.25rem' }}>
                  <img src={mockProofUrl} alt="Tanda Terima" style={{ border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-sm)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', display: 'block', marginTop: '0.5rem' }}>Preview Bukti Bayar Simulasi</span>
                </div>

                <div className="form-group">
                  <label>Pilih File (Simulasi otomatis terisi)</label>
                  <input type="text" value="bukti_transfer_bca.png" disabled style={{ opacity: 0.7 }} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setProofModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={uploadProofMutation.isPending}>
                  {uploadProofMutation.isPending ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BuyerOrdersPage;
