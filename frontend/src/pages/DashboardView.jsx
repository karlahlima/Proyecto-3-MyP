import { useState, useEffect } from 'react';
import { getMyListings, getMyPurchases, getMyCart } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import BarChart from '../components/dashboard/BarChart';
import ActivityRow from '../components/dashboard/ActivityRow';
import CategoryIcon from '../components/CategoryIcon';
import './DashboardView.css';

function labelCategory(cat) {
  const map = {
    ROPA:'Ropa', COMIDA:'Comida', ELECTRODOMESTICOS:'Electrodomésticos',
    ELECTRONICA:'Electrónica', DEPORTES:'Deportes', LIBROS:'Libros',
    HOGAR:'Hogar', BELLEZA:'Belleza', AUTOMOTRIZ:'Automotriz',
    JUGUETES:'Juguetes', ARTE:'Arte', OTROS:'Otros',
  };
  return map[cat] ?? cat;
}

function fmt(n) { return Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }


export default function DashboardView() {
  const { user, isAuthenticated } = useAuth(); // <-- Fuente de verdad única
  const [listings, setListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    Promise.allSettled([
      getMyListings().then(setListings).catch(() => []),
      getMyPurchases().then(setPurchases).catch(() => []),
      getMyCart().then(setCart).catch(() => [])
    ]).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const totalRevenue  = listings.reduce((s, p) => s + Number(p.price ?? 0), 0);
  const totalSpent    = purchases.reduce((s, p) => s + Number(p.totalPrice ?? 0), 0);
  const cartTotal     = cart.reduce((s, i) => s + Number(i.totalPrice ?? 0), 0);
  const activeListings = listings.filter((p) => p.isActive).length;

  const catCount = listings.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const catData = Object.entries(catCount)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
    .slice(0, 5);

  const recentListings = [...listings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const ratedListings = listings.filter((p) => p._avg?.stars > 0);
  const avgRating = ratedListings.length
    ? (ratedListings.reduce((s, p) => s + p._avg.stars, 0) / ratedListings.length).toFixed(1)
    : '—';

  if (loading) {
    return (
        <div className="dashboard-view">
          <div className="dash-skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="dash-skeleton-stat" />)}
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="dashboard-view">
          <div className="section-empty">
            <p>Debes iniciar sesión para ver el panel de control.</p>
            <a href="/" className="btn-primary">Ir al inicio</a>
          </div>
        </div>
    );
  }

  return (
      <div className="dashboard-view">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Panel de control</h1>
            <p className="dash-sub">Resumen de tu actividad en Tradinn</p>
          </div>
          <a href="/productos" className="btn-primary">Explorar productos</a>
        </div>

        {/* Panel de sesión limpio (sin mocks de 200/401) */}
        <div className="session-hero">
          <div className="session-main panel">
            <span className="session-eyebrow">Sesión Activa</span>
            <h2 className="session-title">Bienvenido, <em>{user?.name ?? 'Usuario'}</em></h2>
            <p className="session-desc">Tu sesión está activa. Puedes explorar, comprar y gestionar tus publicaciones.</p>
            <div className="session-status">
              <span className="session-dot" />
              Sesión iniciada correctamente
            </div>
          </div>
          <div className="session-aside">
            <div className="panel session-detail-panel">
              <span className="label">Detalles de cuenta</span>
              <div className="session-list">
                <div className="session-row"><span>Usuario</span><span>{user?.username ?? 'N/A'}</span></div>
                <div className="session-row"><span>Correo</span><span>{user?.email ?? 'N/A'}</span></div>
                <div className="session-row"><span>Miembro desde</span><span>{new Date(user?.created_at).toLocaleDateString('es-MX')}</span></div>
              </div>
            </div>
          </div>
        </div>

      {/* ── Stats ── */}
      <div className="stat-grid">
        <StatCard
          accent
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Valor en publicaciones"
          value={`$${fmt(totalRevenue)}`}
          sub={`${listings.length} publicaciones totales`}
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
          label="Publicaciones activas"
          value={activeListings}
          sub={`${listings.length - activeListings} inactivas`}
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
          label="Total en compras"
          value={`$${fmt(totalSpent)}`}
          sub={`${purchases.length} orden${purchases.length !== 1 ? 'es' : ''}`}
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          label="Rating promedio"
          value={avgRating}
          sub={`${ratedListings.length} producto${ratedListings.length !== 1 ? 's' : ''} calificado${ratedListings.length !== 1 ? 's' : ''}`}
        />
      </div>

      {/* ── Cuerpo: 2 columnas ── */}
      <div className="dash-body">

        {/* Columna izquierda */}
        <div className="dash-col">

          {/* Carrito pendiente */}
          {cart.length > 0 && (
            <section className="dash-section">
              <div className="section-head">
                <h2>Carrito pendiente</h2>
                <span className="section-badge">{cart.length}</span>
              </div>
              <div className="activity-list">
                {cart.slice(0, 4).map((item) => (
                  <ActivityRow
                    key={item.id}
                    icon={<CategoryIcon category={item.product?.category ?? 'OTROS'} className="activity-cat-icon" />}
                    title={item.product?.name ?? item.productSlug}
                    sub={`Cantidad: ${item.quantity}`}
                    value={`$${fmt(item.totalPrice)}`}
                    badge={{ type: 'pending', label: 'En carrito' }}
                  />
                ))}
              </div>
              {cart.length > 4 && (
                <p className="see-more">
                  <a href="/perfil">Ver los {cart.length - 4} restantes →</a>
                </p>
              )}
              <div className="cart-total-bar">
                <span>Total del carrito</span>
                <strong>${fmt(cartTotal)}</strong>
              </div>
            </section>
          )}

          {/* Mis publicaciones recientes */}
          <section className="dash-section">
            <div className="section-head">
              <h2>Publicaciones recientes</h2>
              <a href="/perfil" className="section-link">Ver todas</a>
            </div>
            {recentListings.length === 0 ? (
              <div className="section-empty-msg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                <span>Aún no has publicado nada.</span>
                <a href="/productos" className="btn-primary">Publicar ahora</a>
              </div>
            ) : (
              <div className="activity-list">
                {recentListings.map((p) => (
                  <ActivityRow
                    key={p.slug}
                    icon={<CategoryIcon category={p.category} className="activity-cat-icon" />}
                    title={p.name}
                    sub={`${labelCategory(p.category)} · ${new Date(p.createdAt).toLocaleDateString('es-MX')}`}
                    value={`$${fmt(p.price)}`}
                    badge={p.isActive
                      ? { type: 'active', label: 'Activo' }
                      : { type: 'inactive', label: 'Inactivo' }
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Columna derecha */}
        <div className="dash-col">

          {/* Distribución por categoría */}
          {catData.length > 0 && (
            <section className="dash-section">
              <div className="section-head">
                <h2>Categorías publicadas</h2>
              </div>
              <BarChart data={catData} />
              <div className="cat-legend">
                {catData.map((d) => (
                  <div key={d.label} className="cat-legend-item">
                    <CategoryIcon category={d.label} className="legend-icon" />
                    <span className="legend-name">{labelCategory(d.label)}</span>
                    <span className="legend-count">{d.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Historial de compras */}
          <section className="dash-section">
            <div className="section-head">
              <h2>Historial de compras</h2>
              <a href="/perfil" className="section-link">Ver todas</a>
            </div>
            {recentPurchases.length === 0 ? (
              <div className="section-empty-msg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span>No has realizado compras.</span>
                <a href="/productos" className="btn-primary">Explorar productos</a>
              </div>
            ) : (
              <div className="activity-list">
                {recentPurchases.map((p) => (
                  <ActivityRow
                    key={p.id}
                    icon={<CategoryIcon category={p.product?.category ?? 'OTROS'} className="activity-cat-icon" />}
                    title={p.product?.name ?? p.productSlug}
                    sub={`Cant: ${p.quantity} · ${new Date(p.purchasedAt).toLocaleDateString('es-MX')}`}
                    value={`$${fmt(p.totalPrice)}`}
                    badge={{ type: 'active', label: 'Completada' }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}