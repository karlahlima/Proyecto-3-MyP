import {useState, useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import {getMyProfile, getMyPurchases, getMyListings, getMySales, getMyCart, removeFromCart, checkoutCart} from '../services/api.js';
import {useAuth} from '../contexts/AuthContext.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProfileInfo from '../components/profile/ProfileInfo.jsx';
import CheckoutModal from '../components/payment/CheckoutModal.jsx';
import './ProfileView.css';
import SkeletonGrid from "../components/ui/SkeletonGrid.jsx";
import AvatarUpdater from "../components/profile/AvatarUpdater.jsx";

const TABS = [
    {id: 'info', label: 'Mi perfil'}, 
    {id: 'listings', label: 'Publicaciones'}, 
    {id: 'purchases', label: 'Compras'},
    {id: 'sales', label: 'Ventas'},
    {id: 'cart', label: 'Carrito'},];

function labelCategory(cat) {
    const map = {
        Ropa: 'Ropa',
        ROPA: 'Ropa',
        Comida: 'Comida',
        COMIDA: 'Comida',
        'Electrodomésticos': 'Electrodomésticos',
        ELECTRODOMESTICOS: 'Electrodomésticos',
        'Electrónica': 'Electrónica',
        ELECTRONICA: 'Electrónica',
        Deportes: 'Deportes',
        DEPORTES: 'Deportes',
        Libros: 'Libros',
        LIBROS: 'Libros',
        Hogar: 'Hogar',
        HOGAR: 'Hogar',
        Belleza: 'Belleza',
        BELLEZA: 'Belleza',
        Automotriz: 'Automotriz',
        AUTOMOTRIZ: 'Automotriz',
        Juguetes: 'Juguetes',
        JUGUETES: 'Juguetes',
        Arte: 'Arte',
        ARTE: 'Arte',
        Otros: 'Otros',
        OTROS: 'Otros',
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

    if (items.length === 0) return (<EmptyState
        iconType="empty"
        title="Aún no has publicado nada"
        description="Comienza a vender tus productos ahora."
        actionLabel="Publicar ahora"
        onAction={() => window.location.href = '/productos'}
    />);

    return (<div className="items-list">
        {items.map((p) => (<div key={p.slug} className="list-item">
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
        </div>))}
    </div>);
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

    if (items.length === 0) return (<EmptyState
        iconType="empty"
        title="No has realizado compras"
        description="Explora el catálogo y encuentra lo que necesitas."
        actionLabel="Explorar productos"
        onAction={() => window.location.href = '/productos'}
    />);

    return (<div className="items-list">
        {items.map((purchase) => (<div key={purchase.id} className="list-item">
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
        </div>))}
    </div>);
}

function SalesProductCard({ product }) {
    const [expanded, setExpanded] = useState(false);
    const hasBuyers = product.buyers?.length > 0;

    const totalUnits = product.buyers.reduce((s, b) => s + Number(b.quantity), 0);
    const totalRevenue = product.buyers.reduce((s, b) => s + Number(b.total_price), 0);

    return (
        <div className="list-item" style={{flexDirection: 'column', alignItems: 'stretch', gap: '0.6rem', cursor: hasBuyers ? 'pointer' : 'default'}}
             onClick={() => hasBuyers && setExpanded((e) => !e)}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', width: '100%'}}>
                <div className="list-item-cat">{labelCategory(product.category)}</div>
                <div className="list-item-info">
                    <span className="list-item-name">{product.title}</span>
                    <span className="list-item-sub">
                        ${Number(product.price).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </span>
                </div>
                <span className="list-item-sub">{product.buyers.length} compradores</span>
                <span className="list-item-sub">{totalUnits} unidades</span>
                <span className="list-item-price">
                    ${totalRevenue.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                </span>
                <span className={`list-item-badge ${product.stock > 0 ? 'badge-active' : 'badge-inactive'}`}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
                </span>
                {hasBuyers && <span>{expanded ? '▲' : '▼'}</span>}
            </div>

            {expanded && hasBuyers && (
                <div style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse'}}>
                        <thead>
                            <tr style={{textAlign: 'left', color: '#7a6e5f'}}>
                                <th style={{padding: '0.3rem 0.6rem'}}>Comprador</th>
                                <th style={{padding: '0.3rem 0.6rem'}}>Email</th>
                                <th style={{padding: '0.3rem 0.6rem'}}>Cantidad</th>
                                <th style={{padding: '0.3rem 0.6rem'}}>Total pagado</th>
                                <th style={{padding: '0.3rem 0.6rem'}}>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.buyers.map((b, i) => (
                                <tr key={i}>
                                    <td style={{padding: '0.3rem 0.6rem'}}>{b.buyer_name}</td>
                                    <td style={{padding: '0.3rem 0.6rem'}}>{b.buyer_email}</td>
                                    <td style={{padding: '0.3rem 0.6rem'}}>{b.quantity}</td>
                                    <td style={{padding: '0.3rem 0.6rem'}}>
                                        ${Number(b.total_price).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                                    </td>
                                    <td style={{padding: '0.3rem 0.6rem'}}>
                                        {new Date(b.bought_at).toLocaleDateString('es-MX')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!hasBuyers && (
                <p className="list-item-sub" style={{margin: 0}}>Aún no hay compradores para este producto.</p>
            )}
        </div>
    );
}

function MySales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMySales()
            .then(setSales)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <SkeletonGrid count={4}/>;

    if (sales.length === 0) return (<EmptyState
        iconType="empty"
        title="Aún no tienes productos publicados"
        description="Publica tu primer producto y aquí verás tus ventas."
        actionLabel="Publicar ahora"
        onAction={() => window.location.href = '/productos'}
    />);

    const totalBuyers    = sales.reduce((s, p) => s + p.buyers.length, 0);
    const totalRevenue   = sales.reduce((s, p) => s + p.buyers.reduce((a, b) => a + Number(b.total_price), 0), 0);
    const totalUnitsSold = sales.reduce((s, p) => s + p.buyers.reduce((a, b) => a + Number(b.quantity), 0), 0);

    return (<div className="cart-wrap">
        <div className="cart-summary">
            <span className="cart-total-label">{sales.length} productos · {totalBuyers} compras · {totalUnitsSold} unidades</span>
            <span className="cart-total-label">Total recaudado</span>
            <span className="cart-total">
                ${totalRevenue.toLocaleString('es-MX', {minimumFractionDigits: 2})}
            </span>
        </div>
        <div className="items-list">
            {sales.map((product) => (<SalesProductCard key={product.slug} product={product}/>))}
        </div>
    </div>);
}

function MyCart({ onCheckoutSuccess }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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

    async function handleCheckout(paymentData) {
        setIsProcessing(true);
        try {
            await checkoutCart(paymentData);

            // Limpiar el carrito en la UI inmediatamente
            setItems([]);
            window.dispatchEvent(new Event('cartUpdated'));
            setShowCheckout(false);

            // Actualizar el contador de compras en el perfil
            if (onCheckoutSuccess) {
                await onCheckoutSuccess();
            }

            alert('¡Compra realizada con éxito! Tus productos serán enviados a la dirección proporcionada.');
        } catch (err) {
            console.error(err);
            alert('Ocurrió un error al procesar el pago. Por favor, intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    }

    const total = items.reduce((sum, i) => sum + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0);

    if (loading) return <SkeletonGrid count={4}/>;

    if (items.length === 0) return (<EmptyState
        iconType="empty"
        title="Tu carrito está vacío"
        description="Agrega productos para verlos aquí."
        actionLabel="Explorar productos"
        onAction={() => window.location.href = '/productos'}
    />);

    return (<>
            <div className="cart-wrap">
                <div className="items-list">
                    {items.map((item) => (<div key={item.id} className="list-item">
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
                    </div>))}
                </div>
                <div className="cart-summary">
                    <span className="cart-total-label">Total</span>
                    <span className="cart-total">
          ${total.toLocaleString('es-MX', {minimumFractionDigits: 2})}
        </span>
                    <button
                        className="btn-primary cart-checkout"
                        onClick={() => setShowCheckout(true)}
                    >
                        Proceder al pago →
                    </button>
                </div>
            </div>
            <CheckoutModal
                isOpen={showCheckout}
                onClose={() => !isProcessing && setShowCheckout(false)}
                total={total}
                onConfirm={handleCheckout}
                isProcessing={isProcessing}
            />
        </>);
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
        } catch {
            setUser(null);
            logout();
            setLoading(false);
            return;
        }

        try {
            const [listings, purchases] = await Promise.allSettled([getMyListings(), getMyPurchases()]);
            setCounts({
                listings: listings.status === 'fulfilled' ? listings.value.length : 0,
                purchases: purchases.status === 'fulfilled' ? purchases.value.length : 0,
            });
        } catch {

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (isAuthenticated) loadUser(); else setLoading(false);
    }, [isAuthenticated]);

    if (loading) return <div className="profile-view">
        <div className="profile-skeleton"/>
    </div>;

    if (!isAuthenticated || !user) return (<div className="profile-view">
        <div className="section-empty">
            <p>Debes iniciar sesión para ver tu perfil.</p>
            <a href="/frontend/public" className="btn-primary">Ir al inicio</a>
        </div>
    </div>);

    return (<div className="profile-view">
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
            {TABS.map((t) => (<button key={t.id} className={`profile-tab${tab === t.id ? ' profile-tab--active' : ''}`}
                                      onClick={() => setTab(t.id)}>
                {t.label}
            </button>))}
        </div>

        <div className="tab-content">
            {tab === 'info' && <ProfileInfo user={user} onUpdated={loadUser}/>}
            {tab === 'listings' && <MyListings/>}
            {tab === 'purchases' && <MyPurchases/>}
            {tab === 'sales' && <MySales/>}
            {tab === 'cart' && <MyCart onCheckoutSuccess={loadUser}/>}
        </div>
    </div>);
}