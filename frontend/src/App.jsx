import {useState, useEffect} from 'react';
import {BrowserRouter, Routes, Route, NavLink, useNavigate} from 'react-router-dom';
import {AuthProvider, useAuth} from './contexts/AuthContext.jsx';
import {getMyCart} from './services/api.js';
import ProductsView from './pages/ProductsView.jsx';
import ProfileView from './pages/ProfileView.jsx';
import AuthModal from './components/auth/AuthModal';
import './index.css';

function Navbar({onOpenLogin, onOpenRegister}) {
    const {user, isAuthenticated, logout} = useAuth();
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const updateCartCount = () => {
            if (isAuthenticated) {
                getMyCart()
                    .then(items => {
                        const count = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
                        setCartCount(count);
                    })
                    .catch(() => setCartCount(0));
            } else {
                setCartCount(0);
            }
        };

        updateCartCount();
        window.addEventListener('cartUpdated', updateCartCount);

        return () => {
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, [isAuthenticated]);

    const handleCartClick = () => {
        if (isAuthenticated) {
            navigate('/perfil?tab=cart');
        } else {
            onOpenLogin();
        }
    };

    return (
        <nav className="app-nav">
            <a className="app-logo" href="/">Trad<span>inn</span></a>
            <div className="app-nav-links">
                <NavLink to="/productos"
                         className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Explorar</NavLink>
                {isAuthenticated && (
                    <NavLink to="/perfil" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Mi
                        perfil</NavLink>
                )}
                <button className="nav-btn cart-btn" onClick={handleCartClick} title="Ir al carrito">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    {cartCount > 0 && (
                        <span className="cart-badge">{cartCount}</span>
                    )}
                </button>
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
    const {loading} = useAuth();
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
                    <Route path="/" element={<ProductsView/>}/>
                    <Route path="/productos" element={<ProductsView/>}/>
                    <Route path="/perfil" element={<ProfileView/>}/>
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
                <AppContent/>
            </AuthProvider>
        </BrowserRouter>
    );
}