import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ProductsView  from './views/ProductsView';
import ProfileView   from './views/ProfileView';
import DashboardView from './views/DashboardView';
import './index.css';

function Navbar() {
  return (
    <nav className="app-nav">
      <a className="app-logo" href="/">Merc<span>atto</span></a>
      <div className="app-nav-links">
        <NavLink to="/productos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Explorar
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/perfil" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Mi perfil
        </NavLink>
        <NavLink to="/login" className="nav-btn">Ingresar</NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/"           element={<ProductsView />} />
          <Route path="/productos"  element={<ProductsView />} />
          <Route path="/dashboard"  element={<DashboardView />} />
          <Route path="/perfil"     element={<ProfileView />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}