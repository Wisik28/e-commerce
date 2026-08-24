import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from 'react-google-recaptcha';
import { ArrowRight } from 'lucide-react';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

// Komponen tombol Google yang sudah punya style
const GoogleButton = ({ onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.65rem',
      padding: '0.7rem 1rem',
      border: '1.5px solid var(--neutral-200)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: '#fff',
      color: 'var(--neutral-800)',
      fontWeight: '600',
      fontSize: '0.9rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.14)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
  >
    {/* Google SVG Icon */}
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.16 7.09-10.36 7.09-17.14z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    </svg>
    {children}
  </button>
);

const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--neutral-200)' }} />
    <span style={{ color: 'var(--neutral-400)', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' }}>atau</span>
    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--neutral-200)' }} />
  </div>
);

export const Login = () => {
  const { login, register, loginWithGoogle, registerGoogleBuyer, registerGoogleSeller } = useAuth();
  const navigate = useNavigate();
  const loginRecaptchaRef = useRef(null);
  const regRecaptchaRef = useRef(null);

  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('buyer');
  const [regStoreName, setRegStoreName] = useState('');

  // reCAPTCHA states
  const [loginCaptchaToken, setLoginCaptchaToken] = useState('');
  const [regCaptchaToken, setRegCaptchaToken] = useState('');

  // Google OAuth: state untuk saat user belum terdaftar (perlu isi no HP dll)
  const [googlePendingToken, setGooglePendingToken] = useState(null);
  const [googlePendingUser, setGooglePendingUser] = useState(null);
  const [googleRegRole, setGoogleRegRole] = useState('buyer');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleStoreName, setGoogleStoreName] = useState('');
  const [googleStoreDesc, setGoogleStoreDesc] = useState('');

  // Reset captcha when switching views
  const toggleView = (toLogin) => {
    setError('');
    setSuccess('');
    setIsLoginView(toLogin);
    setLoginCaptchaToken('');
    setRegCaptchaToken('');
    loginRecaptchaRef.current?.reset();
    regRecaptchaRef.current?.reset();
  };

  // ==================== NAVIGASI SETELAH LOGIN ====================
  const navigateByRole = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'seller') navigate('/seller/dashboard');
    else navigate('/buyer');
  };

  // ==================== LOGIN BIASA ====================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginCaptchaToken) {
      setError('Harap selesaikan verifikasi reCAPTCHA terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(emailOrUser, password, loginCaptchaToken);
      if (res.success) navigateByRole(res.data.user.role);
    } catch (err) {
      setError(err.message || 'Login gagal.');
      loginRecaptchaRef.current?.reset();
      setLoginCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  // ==================== REGISTRASI BIASA ====================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const phoneRegex = /^[0-9]{12}$/;
    if (!phoneRegex.test(regPhoneNumber)) {
      setError('Nomor handphone harus persis 12 angka.');
      return;
    }

    if (!regCaptchaToken) {
      setError('Harap selesaikan verifikasi reCAPTCHA terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        email: regEmail,
        phoneNumber: regPhoneNumber,
        password: regPassword,
        name: regName,
        role: regRole,
        storeName: regRole === 'seller' ? regStoreName : undefined,
        recaptchaToken: regCaptchaToken,
      });

      if (res.success) {
        setSuccess(res.message);
        setRegName(''); setRegEmail(''); setRegPhoneNumber('');
        setRegPassword(''); setRegStoreName('');
        setRegCaptchaToken('');
        regRecaptchaRef.current?.reset();
        setTimeout(() => {
          toggleView(true);
          setEmailOrUser(regEmail);
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Registrasi gagal.');
      regRecaptchaRef.current?.reset();
      setRegCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  // ==================== GOOGLE LOGIN ====================
  // credential = ID Token (JWT) dari Google, inilah yang dibutuhkan backend
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const idToken = credentialResponse.credential;
      const res = await loginWithGoogle(idToken);
      if (res.success) navigateByRole(res.data.user.role);
    } catch (err) {
      if (err.message === 'USER_NOT_REGISTERED') {
        setGooglePendingToken(err.idToken);
        setGooglePendingUser(err.googleUser);
      } else {
        setError(err.message || 'Login Google gagal.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Login Google dibatalkan atau gagal. Silakan coba lagi.');
  };

  // ==================== GOOGLE REGISTER (setelah user belum terdaftar) ====================
  const handleGoogleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const phoneRegex = /^[0-9]{12}$/;
    if (!phoneRegex.test(googlePhone)) {
      setError('Nomor handphone harus persis 12 angka.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (googleRegRole === 'seller') {
        res = await registerGoogleSeller({
          idToken: googlePendingToken,
          phone: googlePhone,
          storeName: googleStoreName,
          storeDescription: googleStoreDesc,
        });
      } else {
        res = await registerGoogleBuyer({
          idToken: googlePendingToken,
          phone: googlePhone,
        });
      }
      if (res.success) navigateByRole(res.data.user.role);
    } catch (err) {
      setError(err.message || 'Registrasi Google gagal.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setError('');
    if (role === 'admin') { setEmailOrUser('admin@ecommerce.com'); setPassword('admin123'); }
    else if (role === 'seller') { setEmailOrUser('penjual@gmail.com'); setPassword('seller123'); }
    else { setEmailOrUser('pembeli@gmail.com'); setPassword('buyer123'); }
  };

  // =====================================================================
  // RENDER: Form pendaftaran Google (muncul saat USER_NOT_REGISTERED)
  // =====================================================================
  if (googlePendingToken) {
    return (
      <div className="auth-page-container">
        <div className="auth-card">
          <div className="auth-header">            
            <h2>Lengkapi Data Anda</h2>
            <p>Akun Google Anda belum terdaftar. Isi data berikut untuk menyelesaikan pendaftaran.</p>
            {googlePendingUser?.email && (
              <div style={{
                backgroundColor: 'var(--neutral-50)',
                border: '1px solid var(--neutral-200)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 1rem',
                marginTop: '0.75rem',
                fontSize: '0.85rem',
                color: 'var(--neutral-600)',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {googlePendingUser.email}
              </div>
            )}
          </div>

          {error && (
            <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.25rem', border: '1px solid #f9c7c7' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleGoogleRegisterSubmit}>
            <div className="form-group">
              <label>Nomor Handphone</label>
              <input
                type="text"
                placeholder="081234567890"
                value={googlePhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setGooglePhone(val.slice(0, 12));
                }}
                required
                maxLength={12}
                pattern="[0-9]{12}"
                title="Nomor handphone harus 12 angka"
              />
            </div>

            <div className="form-group">
              <label>Daftar sebagai</label>
              <select value={googleRegRole} onChange={(e) => setGoogleRegRole(e.target.value)} required>
                <option value="buyer">Pembeli (Mulai Belanja)</option>
                <option value="seller">Penjual (Buka Toko Baru)</option>
              </select>
            </div>

            {googleRegRole === 'seller' && (
              <div style={{ backgroundColor: 'var(--neutral-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>Nama Toko</label>
                  <input
                    type="text"
                    placeholder="Nama toko Anda..."
                    value={googleStoreName}
                    onChange={(e) => setGoogleStoreName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Deskripsi Toko</label>
                  <input
                    type="text"
                    placeholder="Deskripsi singkat toko Anda..."
                    value={googleStoreDesc}
                    onChange={(e) => setGoogleStoreDesc(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Mendaftarkan...' : 'Selesaikan Pendaftaran'} <ArrowRight size={16} />
            </button>

            <div className="auth-toggle-link" style={{ marginTop: '1rem' }}>
              <span onClick={() => { setGooglePendingToken(null); setGooglePendingUser(null); setError(''); }} style={{ cursor: 'pointer' }}>
                ← Kembali ke halaman login
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Form login & register utama
  // =====================================================================
  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon" style={{ margin: '0 auto 1rem', width: '48px', height: '48px', fontSize: '1.5rem' }}>🛍️</div>
          <h2>{isLoginView ? 'Masuk ke Platform' : 'Daftar Akun Baru'}</h2>
          <p>{isLoginView ? 'Silakan gunakan kredensial akun Anda' : 'Buat akun Anda dalam beberapa langkah mudah'}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.25rem', border: '1px solid #f9c7c7' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.25rem', border: '1px solid #c7f9d8' }}>
            {success}
          </div>
        )}

        {/* ===== TOMBOL GOOGLE ===== */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            shape="rectangular"
            text={isLoginView ? 'signin_with' : 'signup_with'}
            width="360"
            locale="id"
          />
        </div>

        <Divider />

        {isLoginView ? (
          // ================= LOGIN FORM =================
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="text"
                placeholder="Masukkan email atau username..."
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>
                Lupa Password?
              </span>
            </div>

            {/* reCAPTCHA untuk Login */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <ReCAPTCHA
                ref={loginRecaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setLoginCaptchaToken(token || '')}
                onExpired={() => setLoginCaptchaToken('')}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'} <ArrowRight size={16} />
            </button>

            <div className="auth-toggle-link">
              Belum punya akun? <span onClick={() => setIsLoginView(false)}>Daftar Sekarang</span>
            </div>
          </form>
        ) : (
          // ================= REGISTER FORM =================
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap..."
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nomor Handphone</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={regPhoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setRegPhoneNumber(val.slice(0, 12));
                  }}
                  required
                  maxLength={12}
                  pattern="[0-9]{12}"
                  title="Nomor handphone harus 12 angka"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Buat password..."
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Pilih Role</label>
              <select value={regRole} onChange={(e) => setRegRole(e.target.value)} required>
                <option value="buyer">Pembeli (Mulai Belanja)</option>
                <option value="seller">Penjual (Buka Toko Baru)</option>
              </select>
            </div>

            {/* Conditional Seller Fields */}
            {regRole === 'seller' && (
              <div className="form-grid" style={{ backgroundColor: 'var(--neutral-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', gridColumn: 'span 2', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                  <label>Nama Toko</label>
                  <input
                    type="text"
                    placeholder="Nama toko Anda..."
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* reCAPTCHA untuk Register */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <ReCAPTCHA
                ref={regRecaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setRegCaptchaToken(token || '')}
                onExpired={() => setRegCaptchaToken('')}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>

            <div className="auth-toggle-link">
              Sudah punya akun? <span onClick={() => setIsLoginView(true)}>Masuk</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default Login;
