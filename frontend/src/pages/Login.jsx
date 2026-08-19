import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('pembeli');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulasi login sederhana
    navigate(`/${role}`);
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2>Login E-Commerce</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Pilih Role:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="pembeli">Pembeli</option>
              <option value="penjual">Penjual</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input type="email" placeholder="Masukkan email..." required />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input type="password" placeholder="Masukkan password..." required />
          </div>

          <button type="submit" className="btn">Masuk</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
