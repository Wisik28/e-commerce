import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  CheckCircle2,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

export const BuyerProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.getMe();
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        setProfileData(user);
      }
    } catch (err) {
      console.warn('Gagal mengambil profil dari server:', err);
      setProfileData(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const displayName = profileData?.fullName || profileData?.name || user?.name || 'Pembeli';
  const displayEmail = profileData?.email || user?.email || '-';
  const displayPhone = profileData?.phone || profileData?.phoneNumber || user?.phone || user?.phoneNumber || '-';
  const displayRole = profileData?.role || user?.role || 'BUYER';
  const displayStatus = profileData?.status || 'ACTIVE';

  const avatarInitial = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page-container" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--neutral-900) 0%, #1F2937 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        color: 'var(--white)',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'var(--white)',
            fontSize: '1.75rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid var(--white)',
            boxShadow: '0 4px 12px rgba(235, 94, 40, 0.4)'
          }}>
            {avatarInitial}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{displayName}</h2>
              <span style={{
                backgroundColor: 'rgba(22, 163, 74, 0.2)',
                color: '#4ADE80',
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <CheckCircle2 size={12} /> {displayStatus}
              </span>
            </div>
            <p style={{ color: 'var(--neutral-400)', fontSize: '0.875rem', margin: 0 }}>
              {displayEmail} &bull; <span style={{ textTransform: 'capitalize' }}>Akun {displayRole.toLowerCase()}</span>
            </p>
          </div>
        </div>

        <button 
          onClick={fetchProfile}
          disabled={loading}
          className="btn-secondary"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--white)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-md)',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          {loading ? 'Memuat...' : 'Refresh Profil'}
        </button>
      </div>

      {/* Main Profile Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Card Informasi Pribadi */}
        <div style={{
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          border: '1px solid var(--neutral-200)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'var(--neutral-900)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: '1px solid var(--neutral-100)',
            paddingBottom: '0.75rem'
          }}>
            <User size={18} style={{ color: 'var(--primary)' }} /> Informasi Akun
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nama Lengkap</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--neutral-800)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} style={{ color: 'var(--neutral-400)' }} />
                {displayName}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alamat Email</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--neutral-800)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--neutral-400)' }} />
                {displayEmail}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nomor Telepon</span>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--neutral-800)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: 'var(--neutral-400)' }} />
                {displayPhone}
              </div>
            </div>
          </div>
        </div>

        {/* Card Keamanan & Status */}
        <div style={{
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          border: '1px solid var(--neutral-200)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'var(--neutral-900)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: '1px solid var(--neutral-100)',
            paddingBottom: '0.75rem'
          }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} /> Status & Hak Akses
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peran Pengguna</span>
              <div style={{ marginTop: '0.25rem' }}>
                <span style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  {displayRole.toUpperCase()} (PEMBELI)
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verifikasi Keamanan</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                <CheckCircle2 size={16} /> Autentikasi JWT Terverifikasi
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--neutral-700)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingBag size={16} style={{ color: 'var(--neutral-400)' }} /> Paingan's Market E-Commerce Portal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProfilePage;
