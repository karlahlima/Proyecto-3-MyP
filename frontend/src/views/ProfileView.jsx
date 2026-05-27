import { useState, useEffect, useRef } from 'react';
import {
  getMyProfile, updateMyProfile, uploadAvatar,
  getMyPurchases, getMyListings, getMyCart, removeFromCart,
} from '../services/api';
import './ProfileView.css';

const TABS = [
  { id: 'info',      label: 'Mi perfil'     },
  { id: 'listings',  label: 'Publicaciones' },
  { id: 'purchases', label: 'Compras'       },
  { id: 'cart',      label: 'Carrito'       },
];

function labelCategory(cat) {
  const map = {
    Ropa:'Ropa', ROPA:'Ropa',
    Comida:'Comida', COMIDA:'Comida',
    'Electrodomésticos':'Electrodomésticos', ELECTRODOMESTICOS:'Electrodomésticos',
    'Electrónica':'Electrónica', ELECTRONICA:'Electrónica',
    Deportes:'Deportes', DEPORTES:'Deportes',
    Libros:'Libros', LIBROS:'Libros',
    Hogar:'Hogar', HOGAR:'Hogar',
    Belleza:'Belleza', BELLEZA:'Belleza',
    Automotriz:'Automotriz', AUTOMOTRIZ:'Automotriz',
    Juguetes:'Juguetes', JUGUETES:'Juguetes',
    Arte:'Arte', ARTE:'Arte',
    Otros:'Otros', OTROS:'Otros',
  };
  return map[cat] ?? cat ?? '—';
}

function AvatarUploader({ avatarUrl, name, onUploaded }) {
  const inputRef  = useRef();
  const [preview, setPreview] = useState(avatarUrl);
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const res = await uploadAvatar(file);
      onUploaded?.(res.avatarUrl);
    } catch {
      setPreview(avatarUrl);
    } finally {
      setLoading(false);
    }
  }

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="avatar-wrap" onClick={() => inputRef.current?.click()}>
      {preview
        ? <img src={preview} alt="Avatar" className="avatar-img" />
        : <div className="avatar-initials">{initials}</div>
      }
      <div className="avatar-overlay">{loading ? '…' : 'editar'}</div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
    </div>
  );
}

function ProfileInfo({ user, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ name: user.name, age: user.age, username: user.username });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function save() {
    if (!form.username?.trim()) { setMsg('El username no puede estar vacío.'); return; }
    setLoading(true); setMsg('');
    try {
      await updateMyProfile(form);
      setMsg('✓ Perfil actualizado correctamente');
      setEditing(false);
      onUpdated?.();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-info">
      <div className="info-grid">

        <div className="info-card">
          <span className="info-label">Email</span>
          <span className="info-value">{user.email}</span>
          <span className="info-note">El email no puede cambiarse.</span>
        </div>

        <div className="info-card">
          <span className="info-label">Username</span>
          {editing
            ? <input className="info-input" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="@usuario" />
            : <span className="info-value">@{user.username}</span>
          }
          {!editing && <span className="info-note">Identificador único de tu cuenta.</span>}
        </div>

        <div className="info-card">
          <span className="info-label">Nombre</span>
          {editing
            ? <input className="info-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            : <span className="info-value">{user.name}</span>
          }
        </div>

        <div className="info-card">
          <span className="info-label">Edad</span>
          {editing
            ? <input className="info-input" type="number" min="18" max="120" value={form.age} onChange={(e) => set('age', e.target.value)} />
            : <span className="info-value">{user.age} años</span>
          }
        </div>

        <div className="info-card">
          <span className="info-label">Miembro desde</span>
          <span className="info-value">
            {new Date(user.created_at ?? user.createdAt).toLocaleDateString('es-MX', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </span>
        </div>

      </div>

      {msg && (
        <p className={`profile-msg${msg.startsWith('✓') ? ' profile-msg--ok' : ' profile-msg--err'}`}>
          {msg}
        </p>
      )}

      <div className="info-actions">
        {editing ? (
          <>
            <button className="btn-secondary" onClick={() => { setEditing(false); setForm({ name: user.name, age: user.age, username: user.username }); setMsg(''); }}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={save} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={() => setEditing(true)}>
            Editar perfil
          </button>
        )}
      </div>
    </div>
  );
}

function MyListings() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyListings()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="section-loading">Cargando publicaciones…</div>;

  if (items.length === 0) return (
    <div className="section-empty">
      <div className="state-icon state-icon--empty" />
      <p>Aún no has publicado ningún producto.</p>
      <a href="/productos" className="btn-primary">Publicar ahora</a>
    </div>
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
            ${Number(p.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPurchases()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="section-loading">Cargando historial…</div>;

  if (items.length === 0) return (
    <div className="section-empty">
      <div className="state-icon state-icon--empty" />
      <p>No has realizado compras todavía.</p>
      <a href="/productos" className="btn-primary">Explorar productos</a>
    </div>
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
            ${Number(purchase.total_price ?? purchase.totalPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <span className="list-item-badge badge-active">✓ Completada</span>
        </div>
      ))}
    </div>
  );
}

function MyCart() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState(null);

  async function load() {
    setLoading(true);
    try { setItems(await getMyCart()); }
    catch {/* silencioso */}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(id) {
    setRemoving(id);
    try {
      await removeFromCart(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {/* silencioso */}
    finally { setRemoving(null); }
  }

  const total = items.reduce((sum, i) => sum + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0);

  if (loading) return <div className="section-loading">Cargando carrito…</div>;

  if (items.length === 0) return (
    <div className="section-empty">
      <div className="state-icon state-icon--empty" />
      <p>Tu carrito está vacío.</p>
      <a href="/productos" className="btn-primary">Explorar productos</a>
    </div>
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
              ${(Number(item.price) * Number(item.quantity)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
        <button className="btn-primary cart-checkout">Proceder al pago →</button>
      </div>
    </div>
  );
}

export default function ProfileView({ isLogged, onOpenLogin }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('info');
  const [counts,  setCounts]  = useState({ listings: 0, purchases: 0 });

  async function loadUser() {
    try {
      const u = await getMyProfile();
      setUser(u);
      const [listings, purchases] = await Promise.allSettled([
        getMyListings(),
        getMyPurchases(),
      ]);
      setCounts({
        listings:  listings.status  === 'fulfilled' ? listings.value.length  : 0,
        purchases: purchases.status === 'fulfilled' ? purchases.value.length : 0,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLogged) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [isLogged]);

  if (loading) return (
    <div className="profile-view">
      <div className="profile-skeleton" />
    </div>
  );

  if (!isLogged || !user) return (
    <div className="profile-view">
      <div className="section-empty">
        <div className="state-icon state-icon--lock" />
        <p>Debes iniciar sesión para ver tu perfil.</p>
        <button className="btn-primary" onClick={onOpenLogin}>
          Iniciar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="profile-view">

      {/* Hero */}
      <div className="profile-hero">
        <AvatarUploader
          avatarUrl={user.avatar_url ?? user.avatarUrl}
          name={user.name}
          onUploaded={(url) => setUser((u) => ({ ...u, avatar_url: url }))}
        />
        <div className="profile-hero-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-username">@{user.username}</p>
          <div className="profile-stats">
            <div className="pstat">
              <span className="pstat-num">{counts.listings}</span>
              <span className="pstat-label">Publicaciones</span>
            </div>
            <div className="pstat">
              <span className="pstat-num">{counts.purchases}</span>
              <span className="pstat-label">Compras</span>
            </div>
            <div className="pstat">
              <span className="pstat-num">
                {new Date(user.created_at ?? user.createdAt).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
              </span>
              <span className="pstat-label">Miembro desde</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`profile-tab${tab === t.id ? ' profile-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="tab-content">
        {tab === 'info'      && <ProfileInfo user={user} onUpdated={loadUser} />}
        {tab === 'listings'  && <MyListings />}
        {tab === 'purchases' && <MyPurchases />}
        {tab === 'cart'      && <MyCart />}
      </div>

    </div>
  );
}