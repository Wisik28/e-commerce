import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPenjual = () => {
  return (
    <div className="container">
      <header className="header-penjual">
        <h2>Dashboard Penjual</h2>
        <Link to="/" className="btn-outline">Kembali ke Home</Link>
      </header>
      
      <div className="dashboard-content">
        <div className="card">
          <h3>Produk Saya</h3>
          <p>Anda belum menambahkan produk.</p>
          <button className="btn">Tambah Produk</button>
        </div>
        <div className="card">
          <h3>Pesanan Masuk</h3>
          <p>Tidak ada pesanan masuk saat ini.</p>
        </div>
        <div className="card">
          <h3>Statistik Penjualan</h3>
          <p>Belum ada data penjualan.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPenjual;
