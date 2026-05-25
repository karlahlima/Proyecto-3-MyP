import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import ProductsView  from './views/ProductsView';
import ProfileView   from './views/ProfileView';
import DashboardView from './views/DashboardView';
import { login, register, logout } from './services/api';
import './index.css';

function AuthModal({ defaultTab = 'login', onClose, onSuccess }) {
  const [tab,     setTab]     = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', age: '', password: '' });

  function setL(field, value) { setLoginForm(f => ({ ...f, [field]: value })); }
  function setR(field, value) { setRegForm(f => ({ ...f, [field]: value })); }

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(loginForm);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(regForm);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t) { setTab(t); setError(''); }

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
            Ingresar
          </button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
            Registrarse
          </button>
        </div>

        {tab === 'login' && (
          <div className="auth-body">
            <h2 className="auth-title">Bienvenido de nuevo</h2>
            <p className="auth-sub">Ingresa a tu cuenta de Tradinn</p>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label>Email</label>
                <input type="email" placeholder="tu@email.com" value={loginForm.email}
                  onChange={e => setL('email', e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>Contraseña</label>
                <input type="password" placeholder="••••••••" value={loginForm.password}
                  onChange={e => setL('password', e.target.value)} required />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Ingresando…' : 'Ingresar →'}
              </button>
            </form>
          </div>
        )}

        {tab === 'register' && (
          <div className="auth-body">
            <h2 className="auth-title">Crea tu cuenta</h2>
            <p className="auth-sub">Gratis, sin tarjeta de crédito</p>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <label>Nombre completo</label>
                <input type="text" placeholder="Tu nombre" value={regForm.name}
                  onChange={e => setR('name', e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>Email</label>
                <input type="email" placeholder="tu@email.com" value={regForm.email}
                  onChange={e => setR('email', e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>Edad</label>
                <input type="number" placeholder="20" min="18" value={regForm.age}
                  onChange={e => setR('age', e.target.value)} required />
              </div>
              <div className="auth-field">
                <label>Contraseña</label>
                <input type="password" placeholder="Mínimo 8 caracteres" value={regForm.password}
                  onChange={e => setR('password', e.target.value)} minLength={8} required />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Creando cuenta…' : 'Crear cuenta →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Navbar({ isLogged, userName, onOpenLogin, onOpenRegister, onLogout }) {
  return (
    <nav className="app-nav">
      <a className="app-logo" href="/">Trad<span>inn</span></a>
      <div className="app-nav-links">
        <NavLink to="/productos" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Explorar
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Dashboard
        </NavLink>
        {isLogged && (
          <NavLink to="/perfil" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Mi perfil
          </NavLink>
        )}
        {isLogged ? (
          <>
            <span className="nav-user">Hola, {userName?.split(' ')[0] ?? 'Usuario'}</span>
            <button className="nav-btn" onClick={onLogout}>Salir</button>
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

export default function App() {
  const [isLogged,  setIsLogged]  = useState(Boolean(localStorage.getItem('token')));
  const [userName,  setUserName]  = useState(localStorage.getItem('userName') ?? '');
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'

  function handleAuthSuccess() {
    setIsLogged(true);
    setUserName(localStorage.getItem('userName') ?? '');
  }

  function handleLogout() {
    logout();
    setIsLogged(false);
    setUserName('');
  }

  return (
    <BrowserRouter>
      <Navbar
        isLogged={isLogged}
        userName={userName}
        onOpenLogin={() => setAuthModal('login')}
        onOpenRegister={() => setAuthModal('register')}
        onLogout={handleLogout}
      />
      <main className="app-main">
        <Routes>
          <Route path="/"           element={<ProductsView />} />
          <Route path="/productos"  element={<ProductsView />} />
          <Route path="/dashboard"  element={<DashboardView />} />
          <Route path="/perfil"     element={<ProfileView />} />
        </Routes>
      </main>

      {authModal && (
        <AuthModal
          defaultTab={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </BrowserRouter>
  );
}