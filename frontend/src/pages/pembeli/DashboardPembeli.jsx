import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPembeli = () => {
  return (
    <div className="container">
      <header className="header-pembeli">
        <h2>Dashboard Pembeli</h2>
        <Link to="/" className="btn-outline">Kembali ke Home</Link>
      </header>
      
      <div className="dashboard-content">
        <div className="card">
          <h3>Daftar Produk</h3>
          <p>Belum ada produk yang ditampilkan.</p>
        </div>
        <div className="card">
          <h3>Keranjang Belanja</h3>
          <p>Keranjang Anda kosong.</p>
        </div>
        <div className="card">
          <h3>Riwayat Pesanan</h3>
          <p>Anda belum pernah melakukan pemesanan.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPembeli;
