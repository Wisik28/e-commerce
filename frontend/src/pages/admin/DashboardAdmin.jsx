import React from 'react';
import { Link } from 'react-router-dom';

const DashboardAdmin = () => {
  return (
    <div className="container">
      <header className="header-admin">
        <h2>Dashboard Admin</h2>
        <Link to="/" className="btn-outline">Kembali ke Home</Link>
      </header>
      
      <div className="dashboard-content">
        <div className="card">
          <h3>Kelola Pengguna</h3>
          <p>Total Pengguna: 0</p>
          <div className="admin-actions">
            <button className="btn-small">Lihat Pembeli</button>
            <button className="btn-small">Lihat Penjual</button>
          </div>
        </div>
        <div className="card">
          <h3>Verifikasi Produk</h3>
          <p>Tidak ada produk menunggu verifikasi.</p>
        </div>
        <div className="card">
          <h3>Laporan Sistem</h3>
          <p>Sistem berjalan normal.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
