import React, { useState } from 'react';
import { 
  useAdminDashboardStatsQuery, 
  useAdminSellersQuery,
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
  ShoppingBag, 
  TrendingUp, 
  Check, 
  X, 
  Trash2, 
  UserCheck, 
  UserMinus,
  MoreVertical,
  Plus
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { data: statsRes, isLoading: isStatsLoading } = useAdminDashboardStatsQuery();
  const { data: sellersRes, isLoading: isSellersLoading } = useAdminSellersQuery();
  
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
  const [sellerUsername, setSellerUsername] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('Fashion & Batik');

  const stats = statsRes?.data || {
    totalSellers: 0,
    activeSellers: 0,
    totalBuyers: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    ordersDistribution: { terkirim: 0, dikirim: 0, diproses: 0, menunggu: 0 }
  };

  const sellers = sellersRes?.data || [];

  const handleAddSellerSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate({
      name: sellerName,
      email: sellerEmail,
      username: sellerUsername,
      password: sellerPassword,
      role: 'seller',
      storeName,
      category: storeCategory
    }, {
      onSuccess: () => {
        // Automatically approve seller added directly by admin for convenience
        const dbSellers = JSON.parse(localStorage.getItem('ecom_sellers') || '[]');
        const addedSeller = dbSellers.find(s => s.storeName === storeName);
        if (addedSeller) {
          approveSellerMutation.mutate(addedSeller.id);
        }

        setAddSellerOpen(false);
        setSellerName('');
        setSellerEmail('');
        setSellerUsername('');
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (id) => {
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
      header: 'Kategori',
      accessor: 'category',
      sortable: true
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
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => (
        <span className={`status-pill ${row.status}`}>
          <span className="status-pill-dot"></span>
          <span>{row.status === 'aktif' ? 'Aktif' : row.status === 'menunggu' ? 'Menunggu' : 'Nonaktif'}</span>
        </span>
      )
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
              setActiveDropdown(activeDropdown === row.id ? null : row.id);
            }}
          >
            <MoreVertical size={16} />
          </button>
          
          {activeDropdown === row.id && (
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

  if (isStatsLoading || isSellersLoading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>Memuat data Dashboard Admin...</div>;
  }

  // Monthly revenue trend (March to August 2026)
  const revenueChartData = [24000000, 29000000, 35000000, 38900000, 42000000, stats.monthlyRevenue || 48300000];
  const revenueChartLabels = ['Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'];

  return (
    <div onClick={() => setActiveDropdown(null)}>
      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard 
          label="Total Penjual" 
          value={stats.totalSellers} 
          icon={Store} 
          caption={`${stats.activeSellers} aktif`} 
          trend={{ value: '↗ 25%', type: 'up' }}
        />
        <StatCard 
          label="Total Pembeli" 
          value={stats.totalBuyers} 
          icon={Users} 
          caption="Total pembeli terdaftar" 
          trend={{ value: '↗ 18,3%', type: 'up' }}
        />
        <StatCard 
          label="Total Pesanan" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          caption="Semua waktu platform" 
          trend={{ value: '↗ 8.7%', type: 'up' }}
        />
        <StatCard 
          label="Revenue Bulan Ini" 
          value={formatCurrency(stats.monthlyRevenue)} 
          icon={TrendingUp} 
          caption="Agustus 2026" 
          trend={{ value: '↗ 12,4%', type: 'up' }}
        />
      </div>

      {/* Analytics split: Line Chart & Donut Chart */}
      <div className="dashboard-split">
        <div className="card-section">
          <div className="card-header-flex">
            <div className="card-title-block">
              <h3>Revenue Platform</h3>
              <p>Tren pendapatan 6 bulan terakhir</p>
            </div>
            <span className="status-pill aktif" style={{ fontWeight: '700' }}>+12,4% MoM</span>
          </div>
          <TrendChart data={revenueChartData} labels={revenueChartLabels} height={220} />
        </div>

        <div className="card-section">
          <div className="card-header-flex">
            <div className="card-title-block">
              <h3>Status Pesanan</h3>
              <p>Distribusi saat ini</p>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <DonutChart data={stats.ordersDistribution} />
          </div>
        </div>
      </div>

      {/* Seller Management Section */}
      <div className="card-section">
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
                  <label>Nama Pemilik</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Budi Santoso"
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
                      placeholder="budi@example.com"
                      value={sellerEmail}
                      onChange={(e) => setSellerEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      placeholder="budiseller"
                      value={sellerUsername}
                      onChange={(e) => setSellerUsername(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password Akun</label>
                  <input 
                    type="password" 
                    placeholder="Buat password..."
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Nama Toko</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Elektronik Jaya"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori Utama</label>
                    <select
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value)}
                      required
                    >
                      <option value="Fashion & Batik">Fashion & Batik</option>
                      <option value="Sepatu & Aksesori">Sepatu & Aksesori</option>
                      <option value="Tas & Dompet">Tas & Dompet</option>
                      <option value="Elektronik">Elektronik</option>
                      <option value="Kecantikan">Kecantikan</option>
                    </select>
                  </div>
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
