import React, { useState } from 'react';
import { 
  useAdminDashboardStatsQuery, 
  useAdminSellersQuery,
  useAdminBuyersQuery,
  useAdminApproveSellerMutation,
  useAdminRejectSellerMutation,
  useAdminToggleSellerStatusMutation,
  useAdminDeleteSellerMutation,
  useRegisterMutation
} from '../../hooks/useApi';
import { StatCard } from '../../components/shared/StatCard';
import { TrendChart, DonutChart } from '../../components/shared/Charts';
import { DataTable } from '../../components/shared/DataTable';
import {
  Store, 
  Users, 
  Trash2, 
  UserCheck, 
  UserMinus,
  MoreVertical,
  Plus,
  X
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { data: statsRes, isLoading: isStatsLoading } = useAdminDashboardStatsQuery();
  const { data: sellersRes, isLoading: isSellersLoading } = useAdminSellersQuery();
  const { data: buyersRes, isLoading: isBuyersLoading } = useAdminBuyersQuery();
  
  const approveSellerMutation = useAdminApproveSellerMutation();
  const rejectSellerMutation = useAdminRejectSellerMutation();
  const toggleSellerMutation = useAdminToggleSellerStatusMutation();
  const deleteSellerMutation = useAdminDeleteSellerMutation();
  const registerMutation = useRegisterMutation();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [addSellerOpen, setAddSellerOpen] = useState(false);

  // Form states for adding seller
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPhoneNumber, setSellerPhoneNumber] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [storeName, setStoreName] = useState('');

  const stats = statsRes?.data || {
    totalSellers: 0,
    activeSellers: 0,
    totalBuyers: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    ordersDistribution: { terkirim: 0, dikirim: 0, diproses: 0, menunggu: 0 }
  };

  const sellers = sellersRes?.data || [];
  const buyers = buyersRes?.data || [];

  const handleAddSellerSubmit = (e) => {
    e.preventDefault();

    // Validasi nomor handphone (hanya angka dan persis 12 digit)
    const phoneRegex = /^[0-9]{12}$/;
    if (!phoneRegex.test(sellerPhoneNumber)) {
      alert('Nomor handphone harus persis 12 angka.');
      return;
    }

    registerMutation.mutate({
      name: sellerName,
      email: sellerEmail,
      phoneNumber: sellerPhoneNumber,
      password: sellerPassword,
      role: 'seller',
      storeName
    }, {
      onSuccess: () => {
        const dbSellers = JSON.parse(sessionStorage.getItem('ecom_sellers') || '[]');
        const addedSeller = dbSellers.find(s => s.storeName === storeName);
        if (addedSeller) {
          approveSellerMutation.mutate(addedSeller.id);
        }

        setAddSellerOpen(false);
        setSellerName('');
        setSellerEmail('');
        setSellerPhoneNumber('');
        setSellerPassword('');
        setStoreName('');
        alert('Penjual baru berhasil ditambahkan dan disetujui!');
      },
      onError: (err) => {
        alert(err.message || 'Gagal menambahkan penjual.');
      }
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (id) => {
    if (!id) return '#EB5E28';
    const colors = ['#EB5E28', '#3E5C76', '#1D2D44', '#ADC178', '#9B5DE5', '#F15BB5', '#00F5D4', '#00BBF9'];
    const index = id.charCodeAt(id.length - 1) % colors.length;
    return colors[index];
  };

  const columns = [
    {
      header: 'Penjual',
      accessor: 'storeName',
      sortable: true,
      render: (row) => (
        <div className="table-avatar-cell">
          <div 
            className="table-avatar" 
            style={{ backgroundColor: getRandomColor(row.id) }}
          >
            {getInitials(row.storeName)}
          </div>
          <div>
            <span className="cell-bold">{row.storeName}</span>
            <span className="cell-sub">{row.ownerName}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Produk',
      accessor: 'productsCount',
      sortable: true,
      render: (row) => <span className="cell-bold">{row.productsCount} produk</span>
    },
    {
      header: 'Pesanan',
      accessor: 'ordersCount',
      sortable: true,
      render: (row) => <span className="cell-bold">{row.ordersCount} pesanan</span>
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (row) => (
        <div className="actions-dropdown-wrapper">
          <button 
            className="icon-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === `seller-${row.id}` ? null : `seller-${row.id}`);
            }}
          >
            <MoreVertical size={16} />
          </button>
          
          {activeDropdown === `seller-${row.id}` && (
            <div className="actions-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
              {row.status === 'menunggu' && (
                <>
                  <button 
                    className="dropdown-item" 
                    onClick={() => {
                      approveSellerMutation.mutate(row.id);
                      setActiveDropdown(null);
                    }}
                  >
                    <UserCheck size={14} style={{ color: 'var(--success)' }} /> Setujui
                  </button>
                  <button 
                    className="dropdown-item danger" 
                    onClick={() => {
                      rejectSellerMutation.mutate(row.id);
                      setActiveDropdown(null);
                    }}
                  >
                    <UserMinus size={14} /> Tolak
                  </button>
                </>
              )}
              {row.status !== 'menunggu' && (
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    toggleSellerMutation.mutate(row.id);
                    setActiveDropdown(null);
                  }}
                >
                  {row.status === 'aktif' ? (
                    <>
                      <UserMinus size={14} style={{ color: 'var(--danger)' }} /> Nonaktifkan
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} style={{ color: 'var(--success)' }} /> Aktifkan
                    </>
                  )}
                </button>
              )}
              <button 
                className="dropdown-item danger" 
                onClick={() => {
                  if (confirm(`Hapus penjual ${row.storeName}?`)) {
                    deleteSellerMutation.mutate(row.id);
                  }
                  setActiveDropdown(null);
                }}
              >
                <Trash2 size={14} /> Hapus Toko
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const buyerColumns = [
    {
      header: 'Pembeli',
      accessor: 'fullName',
      sortable: true,
      render: (row) => (
        <div className="table-avatar-cell">
          <div 
            className="table-avatar" 
            style={{ backgroundColor: getRandomColor(row.id) }}
          >
            {getInitials(row.fullName)}
          </div>
          <div>
            <span className="cell-bold">{row.fullName}</span>
            <span className="cell-sub">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
      render: (row) => <span className="cell-bold">{row.email}</span>
    },
    {
      header: 'Nomor Handphone',
      accessor: 'phone',
      sortable: true,
      render: (row) => <span>{row.phone || '-'}</span>
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (row) => (
        <div className="actions-dropdown-wrapper">
          <button 
            className="icon-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === `buyer-${row.id}` ? null : `buyer-${row.id}`);
            }}
          >
            <MoreVertical size={16} />
          </button>
          
          {activeDropdown === `buyer-${row.id}` && (
            <div className="actions-dropdown" onMouseLeave={() => setActiveDropdown(null)}>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  toggleSellerMutation.mutate(row.id);
                  setActiveDropdown(null);
                }}
              >
                {row.status === 'aktif' ? (
                  <>
                    <UserMinus size={14} style={{ color: 'var(--danger)' }} /> Nonaktifkan
                  </>
                ) : (
                  <>
                    <UserCheck size={14} style={{ color: 'var(--success)' }} /> Aktifkan
                  </>
                )}
              </button>
              <button 
                className="dropdown-item danger" 
                onClick={() => {
                  if (confirm(`Hapus pembeli ${row.fullName}?`)) {
                    deleteSellerMutation.mutate(row.id);
                  }
                  setActiveDropdown(null);
                }}
              >
                <Trash2 size={14} /> Hapus Pembeli
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  if (isStatsLoading || isSellersLoading || isBuyersLoading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>Memuat data Dashboard Admin...</div>;
  }

  return (
    <div onClick={() => setActiveDropdown(null)}>
      {/* Stat Cards: HANYA Total Penjual & Total Pembeli */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard 
          label="Total Penjual" 
          value={sellers.length || stats.totalSellers} 
          icon={Store} 
          caption={`${sellers.filter(s => s.status === 'aktif').length || stats.activeSellers} aktif`} 
        />
        <StatCard 
          label="Total Pembeli" 
          value={buyers.length || stats.totalBuyers} 
          icon={Users} 
          caption="Total pembeli terdaftar" 
        />
      </div>

      {/* Seller Management Section */}
      <div className="card-section" style={{ marginTop: '1.5rem' }}>
        <div className="card-header-flex">
          <div className="card-title-block">
            <h3>Manajemen Penjual</h3>
            <p>{sellers.length} penjual terdaftar di platform</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setAddSellerOpen(true)}
          >
            <Plus size={16} /> Tambah Penjual
          </button>
        </div>

        <DataTable
          columns={columns}
          data={sellers}
          searchKey="storeName"
          searchPlaceholder="Cari nama toko penjual..."
          initialPageSize={25}
        />
      </div>

      {/* Buyer Management Section */}
      <div className="card-section" style={{ marginTop: '1.5rem' }}>
        <div className="card-header-flex">
          <div className="card-title-block">
            <h3>Manajemen Pembeli</h3>
            <p>{buyers.length} pembeli terdaftar di platform</p>
          </div>
        </div>

        <DataTable
          columns={buyerColumns}
          data={buyers}
          searchKey="fullName"
          searchPlaceholder="Cari nama atau email pembeli..."
          initialPageSize={25}
        />
      </div>

      {/* Add Seller Modal */}
      {addSellerOpen && (
        <div className="modal-overlay" onClick={() => setAddSellerOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Penjual Baru</h3>
              <button className="close-btn" onClick={() => setAddSellerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSellerSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama lengkap..."
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      value={sellerEmail}
                      onChange={(e) => setSellerEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Nomor Handphone</label>
                    <input 
                      type="text" 
                      placeholder="081234567890"
                      value={sellerPhoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setSellerPhoneNumber(val.slice(0, 12));
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
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Nama Toko</label>
                  <input 
                    type="text" 
                    placeholder="Nama toko Anda..."
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setAddSellerOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Menyimpan...' : 'Simpan & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboardPage;
