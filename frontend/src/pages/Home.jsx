import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <h1>Selamat Datang di E-Commerce Kami</h1>
      <p>Silakan pilih role Anda untuk masuk ke dashboard:</p>
      
      <div className="card-container">
        <Link to="/pembeli" className="card card-pembeli">
          <h2>Pembeli</h2>
          <p>Mulai belanja sekarang</p>
        </Link>
        
        <Link to="/penjual" className="card card-penjual">
          <h2>Penjual</h2>
          <p>Kelola toko Anda</p>
        </Link>
        
        <Link to="/admin" className="card card-admin">
          <h2>Admin</h2>
          <p>Kelola sistem e-commerce</p>
        </Link>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/login" className="btn">Pergi ke Halaman Login</Link>
      </div>
    </div>
  );
};

export default Home;
