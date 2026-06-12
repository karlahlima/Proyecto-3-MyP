import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProductsView from './views/ProductsView';
import ProfileView from './views/ProfileView';
import AuthModal from './components/auth/AuthModal';
import './index.css';

function Navbar({ onOpenLogin, onOpenRegister }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
      <nav className="app-nav">
        <a className="app-logo" href="/">Trad<span>inn</span></a>
        <div className="app-nav-links">
          <NavLink to="/productos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Explorar</NavLink>
          {isAuthenticated && (
              <NavLink to="/perfil" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Mi perfil</NavLink>
          )}
          {isAuthenticated ? (
              <>
                <span className="nav-user">Hola, {user?.name?.split(' ')[0] ?? 'Usuario'}</span>
                <button className="nav-btn" onClick={logout}>Salir</button>
              </>
          ) : (
              <>
                <button className="nav-btn" onClick={onOpenLogin}>Ingresar</button>
                <button className="nav-btn nav-btn--solid" onClick={onOpenRegister}>Registrarse</button>
              </>
          )}
        </div>
      </nav>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const [authModal, setAuthModal] = useState(null);

  if (loading) return <div className="loading-screen">Cargando Tradinn...</div>;

  return (
      <>
        <Navbar
            onOpenLogin={() => setAuthModal('login')}
            onOpenRegister={() => setAuthModal('register')}
        />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<ProductsView />} />
            <Route path="/productos" element={<ProductsView />} />
            <Route path="/perfil" element={<ProfileView />} />
          </Routes>
        </main>

        {authModal && (
            <AuthModal
                defaultTab={authModal}
                onClose={() => setAuthModal(null)}
            />
        )}
      </>
  );
}

export default function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
  );
}