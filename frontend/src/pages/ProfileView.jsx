import {useState, useEffect} from 'react';
import { useSearchParams } from 'react-router-dom';
import {getMyProfile, getMyPurchases, getMyListings, getMyCart, removeFromCart} from '../services/api.js';
import {useAuth} from '../contexts/AuthContext.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProfileInfo from '../components/profile/ProfileInfo.jsx';
import './ProfileView.css';
import SkeletonGrid from "../components/ui/SkeletonGrid.jsx";
import AvatarUpdater from "../components/profile/AvatarUpdater.jsx";

const TABS = [
    {id: 'info', label: 'Mi perfil'},
    {id: 'listings', label: 'Publicaciones'},
    {id: 'purchases', label: 'Compras'},
    {id: 'cart', label: 'Carrito'},
];

function labelCategory(cat) {
    const map = {
        Ropa: 'Ropa', ROPA: 'Ropa',
        Comida: 'Comida', COMIDA: 'Comida',
        'Electrodomésticos': 'Electrodomésticos', ELECTRODOMESTICOS: 'Electrodomésticos',
        'Electrónica': 'Electrónica', ELECTRONICA: 'Electrónica',
        Deportes: 'Deportes', DEPORTES: 'Deportes',
        Libros: 'Libros', LIBROS: 'Libros',
        Hogar: 'Hogar', HOGAR: 'Hogar',
        Belleza: 'Belleza', BELLEZA: 'Belleza',
        Automotriz: 'Automotriz', AUTOMOTRIZ: 'Automotriz',
        Juguetes: 'Juguetes', JUGUETES: 'Juguetes',
        Arte: 'Arte', ARTE: 'Arte',
        Otros: 'Otros', OTROS: 'Otros',
    };
    return map[cat] ?? cat ?? '—';
}

function MyListings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyListings()
            .then(setItems)
            .catch(() => {
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <SkeletonGrid count={4}/>;

    if (items.length === 0) return (
        <EmptyState
            iconType="empty"
            title="Aún no has publicado nada"
            description="Comienza a vender tus productos ahora."
            actionLabel="Publicar ahora"
            onAction={() => window.location.href = '/productos'}
        />
    );

    return (
        <div className="items-list">
            {items.map((p) => (
                <div key={p.slug} className="list-item">
                    <div className="list-item-cat">{labelCategory(p.category)}</div>
                    <div className="list-item-info">
                        <span className="list-item-name">{p.title}</span>
                        <span className="list-item-sub">
              {new Date(p.created_at ?? p.createdAt).toLocaleDateString('es-MX')}
            </span>
                    </div>
                    <span className="list-item-price">
            ${Number(p.price).toLocaleString('es-MX', {minimumFractionDigits: 2})}
          </span>
                    <span className={`list-item-badge ${p.stock > 0 ? 'badge-active' : 'badge-inactive'}`}>
            {p.stock > 0 ? `✓ Stock: ${p.stock}` : 'Sin stock'}
          </span>
                </div>
            ))}
        </div>
    );
}

function MyPurchases() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyPurchases()
            .then(setItems)
            .catch(() => {
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <SkeletonGrid count={4}/>;

    if (items.length === 0) return (
        <EmptyState
            iconType="empty"
            title="No has realizado compras"
            description="Explora el catálogo y encuentra lo que necesitas."
            actionLabel="Explorar productos"
            onAction={() => window.location.href = '/productos'}
        />
    );

    return (
        <div className="items-list">
            {items.map((purchase) => (
                <div key={purchase.id} className="list-item">
                    <div className="list-item-cat">{labelCategory(purchase.category)}</div>
                    <div className="list-item-info">
                        <span className="list-item-name">{purchase.title ?? purchase.product_slug}</span>
                        <span className="list-item-sub">
              Cantidad: {purchase.quantity} · {new Date(purchase.bought_at ?? purchase.boughtAt).toLocaleDateString('es-MX')}
            </span>
                    </div>
                    <span className="list-item-price">
            ${Number(purchase.total_price ?? purchase.totalPrice).toLocaleString('es-MX', {minimumFractionDigits: 2})}
          </span>
                    <span className="list-item-badge badge-active">✓ Completada</span>
                </div>
            ))}
        </div>
    );
}

function MyCart() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState(null);

    async function load() {
        setLoading(true);
        try {
            setItems(await getMyCart());
        } catch {/* silencioso i.e no hacer nada*/
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleRemove(id) {
        setRemoving(id);
        try {
            await removeFromCart(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
            window.dispatchEvent(new Event('cartUpdated'));
        } catch {/* silencioso */
        } finally {
            setRemoving(null);
        }
    }

    const total = items.reduce((sum, i) => sum + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0);

    if (loading) return <SkeletonGrid count={4}/>;

    if (items.length === 0) return (
        <EmptyState
            iconType="empty"
            title="Tu carrito está vacío"
            description="Agrega productos para verlos aquí."
            actionLabel="Explorar productos"
            onAction={() => window.location.href = '/productos'}
        />
    );

    return (
        <div className="cart-wrap">
            <div className="items-list">
                {items.map((item) => (
                    <div key={item.id} className="list-item">
                        <div className="list-item-cat">{labelCategory(item.category)}</div>
                        <div className="list-item-info">
                            <span className="list-item-name">{item.title ?? item.product_slug}</span>
                            <span className="list-item-sub">Cantidad: {item.quantity}</span>
                        </div>
                        <span className="list-item-price">
              ${(Number(item.price) * Number(item.quantity)).toLocaleString('es-MX', {minimumFractionDigits: 2})}
            </span>
                        <button
                            className="btn-remove"
                            onClick={() => handleRemove(item.id)}
                            disabled={removing === item.id}
                            title="Quitar del carrito"
                        >
                            {removing === item.id ? '…' : '✕'}
                        </button>
                    </div>
                ))}
            </div>
            <div className="cart-summary">
                <span className="cart-total-label">Total</span>
                <span className="cart-total">
          ${total.toLocaleString('es-MX', {minimumFractionDigits: 2})}
        </span>
                <button className="btn-primary cart-checkout">Proceder al pago →</button>
            </div>
        </div>
    );
}

export default function ProfileView() {
    const {isAuthenticated, logout} = useAuth();
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(searchParams.get('tab') || 'info');
    const [counts, setCounts] = useState({listings: 0, purchases: 0});

    async function loadUser() {
        try {
            const u = await getMyProfile();
            setUser(u);
            const [listings, purchases] = await Promise.allSettled([getMyListings(), getMyPurchases()]);
            setCounts({
                listings: listings.status === 'fulfilled' ? listings.value.length : 0,
                purchases: purchases.status === 'fulfilled' ? purchases.value.length : 0,
            });
        } catch {
            setUser(null);
            logout();
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (isAuthenticated) loadUser();
        else setLoading(false);
    }, [isAuthenticated]);

    if (loading) return <div className="profile-view">
        <div className="profile-skeleton"/>
    </div>;

    if (!isAuthenticated || !user) return (
        <div className="profile-view">
            <div className="section-empty">
                <p>Debes iniciar sesión para ver tu perfil.</p>
                <a href="/frontend/public" className="btn-primary">Ir al inicio</a>
            </div>
        </div>
    );

    return (
        <div className="profile-view">
            <div className="profile-hero">
                <AvatarUpdater
                    avatarUrl={user.avatar_url ?? user.avatarUrl}
                    name={user.name}
                    onUploaded={(url) => setUser((u) => ({...u, avatar_url: url}))}
                />
                <div className="profile-hero-info">
                    <h1 className="profile-name">{user.name}</h1>
                    <p className="profile-email">{user.email}</p>
                    <p className="profile-username">@{user.username}</p>
                    <div className="profile-stats">
                        <div className="pstat"><span className="pstat-num">{counts.listings}</span><span
                            className="pstat-label">Publicaciones</span></div>
                        <div className="pstat"><span className="pstat-num">{counts.purchases}</span><span
                            className="pstat-label">Compras</span></div>
                    </div>
                </div>
            </div>

            <div className="profile-tabs">
                {TABS.map((t) => (
                    <button key={t.id} className={`profile-tab${tab === t.id ? ' profile-tab--active' : ''}`}
                            onClick={() => setTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {tab === 'info' && <ProfileInfo user={user} onUpdated={loadUser}/>}
                {tab === 'listings' && <MyListings/>}
                {tab === 'purchases' && <MyPurchases/>}
                {tab === 'cart' && <MyCart/>}
            </div>
        </div>
    );
}