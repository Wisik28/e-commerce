import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import DashboardPembeli from './pages/pembeli/DashboardPembeli'
import DashboardPenjual from './pages/penjual/DashboardPenjual'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import './index.css'

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="navbar">
          <div className="nav-logo">E-Commerce</div>
          <div className="nav-links">
            <a href="/">Home</a>
            <a href="/login">Login</a>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pembeli" element={<DashboardPembeli />} />
            <Route path="/penjual" element={<DashboardPenjual />} />
            <Route path="/admin" element={<DashboardAdmin />} />
          </Routes>
        </main>
        
        <footer className="footer">
          <p>&copy; 2026 E-Commerce. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
