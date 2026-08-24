import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { 
  ArrowLeft, 
  ShoppingBag, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  Database, 
  DollarSign, 
  Plus, 
  Minus, 
  ShieldCheck,
  Truck,
  Building,
  Copy,
  Check,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const BuyerOrderPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Selected product passed via router state or fallback demo product
  const product = location.state?.product || {
    id: 'demo-product-1',
    name: 'Laptop LENOVO LOQ 5 PRO',
    storeName: 'PWD STORE',
    sellPrice: 12000000,
    description: 'Laptop gaming berperforma tinggi dengan prosesor generasi terbaru dan kartu grafis canggih untuk kebutuhan kerja berat maupun bermain game.',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#EB5E28"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#FFF">Laptop LENOVO</text></svg>'),
    stock: 10
  };

  const [qty, setQty] = useState(1);

  // Toggle fetch data dari database
  const [useDbProfile, setUseDbProfile] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Payment method state ('va_bni', 'va_bca', 'cod')
  const [paymentMethod, setPaymentMethod] = useState('va_bni');

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [error, setError] = useState('');

  // Result state after submitting order for Midtrans VA & 5-hour timer
  const [createdOrderResult, setCreatedOrderResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 59, seconds: 59 });
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);

  // Timer Countdown 5 Jam Effect
  useEffect(() => {
    if (!createdOrderResult || !createdOrderResult.expiresAt) return;

    const targetTime = new Date(createdOrderResult.expiresAt).getTime();

    const updateTimer = () => {
      const diff = targetTime - Date.now();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdOrderResult]);

  const handleCopyVa = (vaNum) => {
    if (!vaNum) return;
    navigator.clipboard.writeText(vaNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Handler toggle fetch database profile
  const handleToggleDbProfile = async () => {
    const nextState = !useDbProfile;
    setUseDbProfile(nextState);

    if (nextState) {
      setFetchingProfile(true);
      setError('');
      try {
        const res = await api.auth.getMe();
        if (res.success && res.data) {
          setFullName(res.data.fullName || user?.name || '');
          setEmail(res.data.email || user?.email || '');
          setPhone(res.data.phone || user?.phoneNumber || '');
        } else {
          setFullName(user?.name || user?.fullName || '');
          setEmail(user?.email || '');
          setPhone(user?.phoneNumber || user?.phone || '');
        }
      } catch (err) {
        console.warn('Gagal mengambil profil:', err);
        setFullName(user?.name || user?.fullName || '');
        setEmail(user?.email || '');
        setPhone(user?.phoneNumber || user?.phone || '');
      } finally {
        setFetchingProfile(false);
      }
    }
  };

  const handleQtyChange = (delta) => {
    const nextQty = qty + delta;
    if (nextQty >= 1 && nextQty <= (product.stock || 99)) {
      setQty(nextQty);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Nama lengkap pembeli harus diisi.');
      return;
    }
    if (!email.trim()) {
      setError('Email pembeli harus diisi.');
      return;
    }
    if (!phone.trim()) {
      setError('Nomor handphone pembeli harus diisi.');
      return;
    }
    if (!shippingAddress.trim()) {
      setError('Alamat lengkap pengiriman harus diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.buyer.directOrder(user?.id, {
        productId: product.id,
        qty,
        buyerName: fullName,
        buyerEmail: email,
        buyerPhone: phone,
        shippingAddress,
        paymentMethod
      });

      setCreatedOrderResult(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = (product.sellPrice || 0) * qty;

  return (
    <div className="order-page-wrapper" style={{ paddingBottom: '3rem' }}>
      {/* Tombol Kembali */}
      <button 
        onClick={() => navigate('/buyer')} 
        className="btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Kembali ke Katalog
      </button>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--neutral-900)' }}>Halaman Pembelian Produk</h2>
        <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Lengkapi informasi pemesanan dan metode pembayaran Anda</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.5rem', border: '1px solid #f9c7c7' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIRTUAL ACCOUNT MIDTRANS & COUNTDOWN DISPLAY MODAL (SETELAH CHECKOUT) */}
      {/* ==================================================================== */}
      {createdOrderResult ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-section" style={{ padding: '2rem' }}>
            
            {/* Header Badge Midtrans */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFF3EB', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                <ShieldCheck size={16} /> Midtrans Payment Gateway
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--neutral-900)' }}>
                {createdOrderResult.paymentMethod === 'cod' ? 'Pesanan Berhasil Dibuat!' : 'Instruksi Pembayaran Virtual Account'}
              </h2>
              <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {createdOrderResult.paymentMethod === 'cod' 
                  ? 'Pesanan Anda dengan metode COD telah dikonfirmasi dan siap diproses oleh penjual.'
                  : 'Silakan lakukan transfer ke nomor Virtual Account Midtrans di bawah ini.'}
              </p>
            </div>

            {/* COUNTDOWN TIMER 5 JAM */}
            {createdOrderResult.paymentMethod !== 'cod' && (
              <div style={{ 
                backgroundColor: isExpired ? '#FEF2F2' : '#FFF7ED', 
                border: `2px solid ${isExpired ? 'var(--danger)' : '#FDBA74'}`, 
                borderRadius: 'var(--radius-lg)', 
                padding: '1.25rem', 
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isExpired ? 'var(--danger)' : '#C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Clock size={18} /> Batas Waktu Pembayaran (5 Jam Terhitung dari Sekarang)
                </span>

                {isExpired ? (
                  <div style={{ color: 'var(--danger)', fontWeight: '800', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                    ⚠️ WAKTU PEMBAYARAN TELAH HABIS (5 JAM). Pesanan Anda telah hangus dan dibatalkan otomatis oleh sistem.
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #FDBA74', borderRadius: '8px', padding: '0.5rem 0.8rem', minWidth: '60px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#C2410C' }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', display: 'block' }}>Jam</span>
                      </div>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#C2410C', alignSelf: 'center' }}>:</span>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #FDBA74', borderRadius: '8px', padding: '0.5rem 0.8rem', minWidth: '60px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#C2410C' }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', display: 'block' }}>Menit</span>
                      </div>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#C2410C', alignSelf: 'center' }}>:</span>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #FDBA74', borderRadius: '8px', padding: '0.5rem 0.8rem', minWidth: '60px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#C2410C' }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', display: 'block' }}>Detik</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--neutral-600)', display: 'block' }}>
                      Jika pembayaran tidak diselesaikan sebelum waktu di atas habis, maka pesanan dianggap hangus & dibatalkan.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* VIRTUAL ACCOUNT BOX */}
            {createdOrderResult.paymentMethod !== 'cod' && (
              <div style={{ backgroundColor: '#F8FAFC', border: '1.5px solid var(--neutral-300)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: createdOrderResult.paymentMethod === 'va_bca' ? '#005699' : '#005E6A', color: '#ffffff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                      {createdOrderResult.paymentMethod === 'va_bca' ? 'BCA' : 'BNI'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--neutral-900)' }}>
                        Virtual Account {createdOrderResult.paymentMethod === 'va_bca' ? 'BCA' : 'BNI'} (Midtrans)
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Bayar melalui Mobile Banking, Internet Banking, atau ATM</span>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1.5px dashed var(--primary)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--neutral-500)', display: 'block' }}>Nomor Virtual Account</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: '800', color: 'var(--neutral-900)', letterSpacing: '0.08em' }}>
                      {createdOrderResult.virtualAccountNumber}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleCopyVa(createdOrderResult.virtualAccountNumber)}
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '700', padding: '0.5rem 0.85rem', backgroundColor: copied ? 'var(--success-bg)' : '#ffffff', color: copied ? 'var(--success)' : 'var(--neutral-800)', border: `1px solid ${copied ? 'var(--success)' : 'var(--neutral-300)'}` }}
                    disabled={isExpired}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Tersalin!' : 'Salin Nomor VA'}
                  </button>
                </div>
              </div>
            )}

            {/* RINGKASAN DATA ORDER */}
            <div style={{ backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '0.75rem', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '0.5rem' }}>
                Rincian Tagihan & Penerima
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Produk:</span>
                  <span style={{ fontWeight: '700', color: 'var(--neutral-900)' }}>{product.name} (x{qty})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Nama Pembeli:</span>
                  <span style={{ fontWeight: '600', color: 'var(--neutral-900)' }}>{fullName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>No Handphone:</span>
                  <span style={{ fontWeight: '600', color: 'var(--neutral-900)' }}>{phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--neutral-500)' }}>Total Pembayaran:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(createdOrderResult.grossAmount)}</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/buyer/orders')}
                className="btn-primary"
                style={{ flex: 1, padding: '0.85rem', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <CheckCircle size={18} /> Saya Sudah Bayar / Lihat Pesanan
              </button>
              <button 
                onClick={() => navigate('/buyer')}
                className="btn-secondary"
                style={{ padding: '0.85rem 1.25rem', fontSize: '0.95rem', fontWeight: '700' }}
              >
                Kembali ke Katalog
              </button>
            </div>

          </div>
        </div>
      ) : (

        /* ================= FORM ORDER SINGLE COLUMN ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Section 1: Detail Produk */}
          <div className="card-section" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} style={{ color: 'var(--primary)' }} /> Detail Produk
            </h3>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--neutral-100)', flexShrink: 0 }}>
                <img 
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60'} 
                  alt={product.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🏪 {product.storeName || 'Toko Penjual'}
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--neutral-900)', margin: '0.25rem 0 0.5rem' }}>
                  {product.name}
                </h4>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)' }}>
                  {formatCurrency(product.sellPrice)}
                </div>
              </div>

              {/* Counter Jumlah Item */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--neutral-500)' }}>Jumlah Item</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <button 
                    type="button" 
                    onClick={() => handleQtyChange(-1)} 
                    style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'var(--neutral-100)', cursor: 'pointer' }}
                    disabled={qty <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ padding: '0.4rem 0.8rem', fontWeight: '700', minWidth: '36px', textAlign: 'center', fontSize: '0.9rem' }}>
                    {qty}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleQtyChange(1)} 
                    style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'var(--neutral-100)', cursor: 'pointer' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Deskripsi Produk */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--neutral-200)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--neutral-700)', display: 'block', marginBottom: '0.35rem' }}>
                Deskripsi Produk:
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', lineHeight: '1.5', margin: 0 }}>
                {product.description || 'Produk berkualitas tinggi dari penjual terpercaya.'}
              </p>
            </div>
          </div>

          {/* Section 2: Form Data Pembeli dengan Toggle Fetch DB */}
          <div className="card-section" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} style={{ color: 'var(--primary)' }} /> Data Informasi Pembeli
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: '0.2rem' }}>
                  Isi data penerima pesanan di bawah ini
                </p>
              </div>

              {/* Toggle Switch Fetch DB */}
              <div 
                onClick={handleToggleDbProfile}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  backgroundColor: useDbProfile ? '#FFF3EB' : 'var(--neutral-100)', 
                  border: `1.5px solid ${useDbProfile ? 'var(--primary)' : 'var(--neutral-300)'}`,
                  padding: '0.4rem 0.85rem', 
                  borderRadius: 'var(--radius-full)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <Database size={15} style={{ color: useDbProfile ? 'var(--primary)' : 'var(--neutral-500)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: useDbProfile ? 'var(--primary)' : 'var(--neutral-700)' }}>
                  {fetchingProfile ? 'Memuat Data DB...' : 'Gunakan Data Anda'}
                </span>

                {/* Pill switch indicator */}
                <div style={{ 
                  width: '34px', 
                  height: '18px', 
                  borderRadius: '10px', 
                  backgroundColor: useDbProfile ? 'var(--primary)' : 'var(--neutral-300)', 
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ 
                    width: '14px', 
                    height: '14px', 
                    borderRadius: '50%', 
                    backgroundColor: '#ffffff', 
                    position: 'absolute', 
                    top: '2px', 
                    left: useDbProfile ? '18px' : '2px',
                    transition: 'all 0.2s ease'
                  }} />
                </div>
              </div>
            </div>

            {useDbProfile && (
              <div style={{ backgroundColor: '#F0FDF4', color: '#166534', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: '600', marginBottom: '1.25rem', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={15} /> Data Nama, Email, dan No HP berhasil di-fetch otomatis dari database registrasi.
              </div>
            )}

            <form onSubmit={handleSubmitOrder} id="buyer-order-form">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--neutral-700)' }}>Nama Lengkap Pembeli</label>
                <input 
                  type="text"
                  placeholder="Masukkan nama lengkap Anda..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={useDbProfile}
                  style={{ backgroundColor: useDbProfile ? 'var(--neutral-100)' : '#ffffff' }}
                  required
                />
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--neutral-700)' }}>Email Pembeli</label>
                  <input 
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={useDbProfile}
                    style={{ backgroundColor: useDbProfile ? 'var(--neutral-100)' : '#ffffff' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--neutral-700)' }}>Nomor Handphone</label>
                  <input 
                    type="text"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    readOnly={useDbProfile}
                    style={{ backgroundColor: useDbProfile ? 'var(--neutral-100)' : '#ffffff' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--neutral-700)' }}>
                  Alamat Lengkap Pengiriman (Isi Manual)
                </label>
                <textarea 
                  rows={3}
                  placeholder="Tuliskan jalan, nomor rumah, RT/RW, kecamatan, kota/kabupaten, dan kode pos..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-300)', fontSize: '0.875rem' }}
                  required
                />
              </div>
            </form>
          </div>

          {/* Section 3: Metode Pembayaran (Tanpa Bulatan Radio) */}
          <div className="card-section" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} style={{ color: 'var(--primary)' }} /> Pilih Metode Pembayaran
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: '1.25rem' }}>
              Pilih salah satu metode pembayaran di bawah ini
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              
              {/* Option 1: Virtual Account BNI */}
              <div 
                onClick={() => setPaymentMethod('va_bni')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justify: 'space-between', 
                  padding: '1rem 1.25rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: `2px solid ${paymentMethod === 'va_bni' ? 'var(--primary)' : 'var(--neutral-200)'}`,
                  backgroundColor: paymentMethod === 'va_bni' ? '#FFF8F5' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#005E6A', color: '#ffffff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                    BNI
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--neutral-900)' }}>Virtual Account BNI (Midtrans)</h5>
                    <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Pembayaran otomatis via BNI Mobile / ATM</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Virtual Account BCA */}
              <div 
                onClick={() => setPaymentMethod('va_bca')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justify: 'space-between', 
                  padding: '1rem 1.25rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: `2px solid ${paymentMethod === 'va_bca' ? 'var(--primary)' : 'var(--neutral-200)'}`,
                  backgroundColor: paymentMethod === 'va_bca' ? '#FFF8F5' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#005699', color: '#ffffff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                    BCA
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--neutral-900)' }}>Virtual Account BCA (Midtrans)</h5>
                    <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Pembayaran otomatis via myBCA / KlikBCA / ATM</span>
                  </div>
                </div>
              </div>

              {/* Option 3: COD */}
              <div 
                onClick={() => setPaymentMethod('cod')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justify: 'space-between', 
                  padding: '1rem 1.25rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: `2px solid ${paymentMethod === 'cod' ? 'var(--primary)' : 'var(--neutral-200)'}`,
                  backgroundColor: paymentMethod === 'cod' ? '#FFF8F5' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: 'var(--warning)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} />
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--neutral-900)' }}>COD (Bayar di Tempat / Pembayaran Manual)</h5>
                    <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>Bayar tunai langsung saat kurir mengantarkan barang</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: Ringkasan & Submit */}
          <div className="card-section" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--neutral-900)', marginBottom: '1.25rem', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '0.75rem' }}>
              Ringkasan Pembayaran
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neutral-600)' }}>
                <span>Harga Satuan</span>
                <span style={{ fontWeight: '600', color: 'var(--neutral-900)' }}>{formatCurrency(product.sellPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neutral-600)' }}>
                <span>Jumlah Pembelian</span>
                <span style={{ fontWeight: '600', color: 'var(--neutral-900)' }}>{qty} Barang</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neutral-600)' }}>
                <span>Metode Pembayaran</span>
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                  {paymentMethod === 'va_bni' ? 'VA BNI (Midtrans)' : paymentMethod === 'va_bca' ? 'VA BCA (Midtrans)' : 'COD'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed var(--neutral-200)', paddingTop: '1rem', marginTop: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--neutral-900)' }}>Total Pembayaran</span>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(totalPrice)}</span>
            </div>

            <button 
              type="submit" 
              form="buyer-order-form"
              className="btn-primary" 
              style={{ width: '100%', padding: '0.875rem', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang'}
            </button>

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--neutral-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--success)' }} /> Transaksi Aman & Terenkripsi oleh Midtrans
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default BuyerOrderPage;
