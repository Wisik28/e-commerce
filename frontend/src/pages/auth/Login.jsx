import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('buyer'); // 'buyer' or 'seller'
  const [regStoreName, setRegStoreName] = useState('');
  const [regCategory, setRegCategory] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(emailOrUser, password);
      if (res.success) {
        const role = res.data.user.role;
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'seller') navigate('/seller/dashboard');
        else navigate('/buyer');
      }
    } catch (err) {
      setError(err.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await register({
        email: regEmail,
        username: regUsername,
        password: regPassword,
        name: regName,
        role: regRole,
        storeName: regRole === 'seller' ? regStoreName : undefined,
        category: regRole === 'seller' ? regCategory : undefined
      });

      if (res.success) {
        setSuccess(res.message);
        // Clear form
        setRegName('');
        setRegEmail('');
        setRegUsername('');
        setRegPassword('');
        setRegStoreName('');
        setRegCategory('');
        
        // Wait a second, then switch to login view
        setTimeout(() => {
          setIsLoginView(true);
          setEmailOrUser(regUsername || regEmail);
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setError('');
    if (role === 'admin') {
      setEmailOrUser('admin');
      setPassword('admin123');
    } else if (role === 'seller') {
      setEmailOrUser('seller');
      setPassword('seller123');
    } else {
      setEmailOrUser('buyer');
      setPassword('buyer123');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon" style={{ margin: '0 auto 1rem', width: '48px', height: '48px', fontSize: '1.5rem' }}>🛍️</div>
          <h2>{isLoginView ? 'Masuk ke Platform' : 'Daftar Akun Baru'}</h2>
          <p>{isLoginView ? 'Silakan gunakan kredensial akun Anda' : 'Buat akun Anda dalam beberapa langkah mudah'}</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '1.25rem',
            border: '1px solid #f9c7c7'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginBottom: '1.25rem',
            border: '1px solid #c7f9d8'
          }}>
            {success}
          </div>
        )}

        {isLoginView ? (
          // ================= LOGIN FORM =================
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email atau Username</label>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-box"></span>
                <span>Ingat saya</span>
              </label>
              
              <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>
                Lupa Password?
              </span>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'} <ArrowRight size={16} />
            </button>

            <div className="auth-toggle-link">
              Belum punya akun? <span onClick={() => setIsLoginView(false)}>Daftar Sekarang</span>
            </div>

            {/* Demo Credentials Panel */}
            <div className="credentials-helper">
              <h5>🔑 Klik untuk Akun Demo:</h5>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-small" onClick={() => setDemoCredentials('admin')}>Admin</button>
                <button type="button" className="btn-small" onClick={() => setDemoCredentials('seller')}>Penjual</button>
                <button type="button" className="btn-small" onClick={() => setDemoCredentials('buyer')}>Pembeli</button>
              </div>
              <div className="credentials-list" style={{ marginTop: '0.5rem' }}>
                <div className="credentials-item">Usernames: <span>admin</span> | <span>seller</span> | <span>buyer</span></div>
                <div className="credentials-item">Password: <span>admin123</span> | <span>seller123</span> | <span>buyer123</span></div>
              </div>
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
                <label>Username</label>
                <input
                  type="text"
                  placeholder="username baru"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
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
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                required
              >
                <option value="buyer">Pembeli (Mulai Belanja)</option>
                <option value="seller">Penjual (Buka Toko Baru)</option>
              </select>
            </div>

            {/* Conditional Seller Fields */}
            {regRole === 'seller' && (
              <div className="form-grid" style={{ backgroundColor: 'var(--neutral-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', gridColumn: 'span 2', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nama Toko</label>
                  <input
                    type="text"
                    placeholder="Nama toko Anda..."
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Kategori Toko</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    <option value="Fashion & Batik">Fashion & Batik</option>
                    <option value="Sepatu & Aksesori">Sepatu & Aksesori</option>
                    <option value="Tas & Dompet">Tas & Dompet</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Kecantikan">Kecantikan</option>
                  </select>
                </div>
              </div>
            )}

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
