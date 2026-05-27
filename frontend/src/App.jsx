import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ProductsView from './views/ProductsView';
import ProfileView  from './views/ProfileView';
import { login, register, logout } from './services/api';
import './index.css';

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder = '••••••••', minLength }) {
  const [visible, setVisible] = useState(true);

  return (
    <div className="password-wrap">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        required
        className="password-input"
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}

function AuthModal({ defaultTab = 'login', onClose, onSuccess }) {
  const [tab,        setTab]        = useState(defaultTab);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [registered, setRegistered] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm,   setRegForm]   = useState({ name: '', email: '', age: '', password: '' });

  function setL(f, v) { setLoginForm((p) => ({ ...p, [f]: v })); }
  function setR(f, v) { setRegForm((p) => ({ ...p, [f]: v })); }

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
      setRegistered(true);
      setTab('login');
      setLoginForm({ email: regForm.email, password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t) { setTab(t); setError(''); setRegistered(false); }

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login'    ? ' active' : ''}`} onClick={() => switchTab('login')}>
            Ingresar
          </button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
            Registrarse
          </button>
        </div>

        {/* ── Login ── */}
        {tab === 'login' && (
          <div className="auth-body">
            <h2 className="auth-title">Bienvenido de nuevo</h2>
            <p className="auth-sub">Ingresa a tu cuenta de Tradinn</p>
            {registered && (
              <p className="auth-success">Inicia sesión para continuar.</p>
            )}
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setL('email', e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Contraseña</label>
                <PasswordInput
                  value={loginForm.password}
                  onChange={(e) => setL('password', e.target.value)}
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Ingresando…' : 'Ingresar →'}
              </button>
            </form>
          </div>
        )}

        {/* ── Registro ── */}
        {tab === 'register' && (
          <div className="auth-body">
            <h2 className="auth-title">Crea tu cuenta</h2>
            <p className="auth-sub">Explora, compra y vende.</p>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <label>Nombre completo</label>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={regForm.name}
                  onChange={(e) => setR('name', e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="@email.com"
                  value={regForm.email}
                  onChange={(e) => setR('email', e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Edad</label>
                <input
                  type="number"
                  placeholder="18+"
                  min="18"
                  value={regForm.age}
                  onChange={(e) => setR('age', e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Contraseña</label>
                <PasswordInput
                  value={regForm.password}
                  onChange={(e) => setR('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                />
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
            <button className="nav-btn"             onClick={onOpenLogin}>Ingresar</button>
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
  const [authModal, setAuthModal] = useState(null);

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
        onOpenLogin={()  => setAuthModal('login')}
        onOpenRegister={() => setAuthModal('register')}
        onLogout={handleLogout}
      />
      <main className="app-main">
        <Routes>
          <Route path="/"          element={<ProductsView isLogged={isLogged} onOpenLogin={() => setAuthModal('login')} />} />
          <Route path="/productos" element={<ProductsView isLogged={isLogged} onOpenLogin={() => setAuthModal('login')} />} />
          <Route path="/perfil"    element={<ProfileView  isLogged={isLogged} onOpenLogin={() => setAuthModal('login')} />} />
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