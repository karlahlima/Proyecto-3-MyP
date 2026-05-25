import { useState, useEffect, useRef } from 'react';
import {
  getMyProfile, updateMyProfile, uploadAvatar,
  getMyPurchases, getMyListings, getMyCart, removeFromCart,
} from '../services/api';
import './ProfileView.css';

//TABS
const TABS = [
  { id: 'info',      label: 'Mi perfil'     },
  { id: 'listings',  label: 'Publicaciones' },
  { id: 'purchases', label: 'Compras'       },
  { id: 'cart',      label: 'Carrito'       },
];

//AVATAR
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
      setPreview(avatarUrl); // por si falla
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
      <div className="avatar-overlay">
        {loading ? '…' : 'editar'}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}

//INFO DEL PERFIL
function ProfileInfo({ user, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ name: user.name, age: user.age });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setLoading(true); setMsg('');
    try {
      await updateMyProfile(form);
      setMsg('Perfil actualizado');
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
        <div className="info-item">
          <span className="info-label">Email</span>
          <span className="info-value">{user.email}</span>
          <span className="info-note">El email es tu identificador único, no puede cambiarse.</span>
        </div>

        <div className="info-item">
          <span className="info-label">Nombre</span>
          {editing
            ? <input className="info-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            : <span className="info-value">{user.name}</span>
          }
        </div>

        <div className="info-item">
          <span className="info-label">Edad</span>
          {editing
            ? <input className="info-input" type="number" value={form.age} onChange={(e) => set('age', e.target.value)} min="0" max="120" />
            : <span className="info-value">{user.age} años</span>
          }
        </div>

        <div className="info-item">
          <span className="info-label">Cuenta creada</span>
          <span className="info-value">{new Date(user.createdAt).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })}</span>
        </div>

        <div className="info-item">
          <span className="info-label">Autenticación</span>
          <span className={`badge-2fa ${user.totpEnabled ? 'active' : ''}`}>
            {user.totpEnabled ? '✓ Activada' : 'No activada'}
          </span>
          {!user.totpEnabled && (
            <a href="/settings/2fa" className="info-link">Activar Google Authenticator →</a>
          )}
        </div>
      </div>

      {msg && <p className="profile-msg">{msg}</p>}

      <div className="info-actions">
        {editing ? (
          <>
            <button className="btn-secondary" onClick={() => { setEditing(false); setForm({ name: user.name, age: user.age }); }}>Cancelar</button>
            <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando…' : 'Guardar cambios'}</button>
          </>
        ) : (
          <button className="btn-primary" onClick={() => setEditing(true)}>Editar perfil</button>
        )}
      </div>
    </div>
  );
}

//POSTS
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
            <span className="list-item-name">{p.name}</span>
            <span className="list-item-sub">{new Date(p.createdAt).toLocaleDateString('es-MX')}</span>
          </div>
          <span className="list-item-price">${Number(p.price).toLocaleString('es-MX')}</span>
          <span className={`list-item-badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>
            {p.isActive ? '✓ Activo' : 'Inactivo'}
          </span>
        </div>
      ))}
    </div>
  );
}

//COMPRAS
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
          <div className="list-item-cat">{labelCategory(purchase.product?.category)}</div>
          <div className="list-item-info">
            <span className="list-item-name">{purchase.product?.name ?? purchase.productSlug}</span>
            <span className="list-item-sub">
              Cantidad: {purchase.quantity} · {new Date(purchase.purchasedAt).toLocaleDateString('es-MX')}
            </span>
          </div>
          <span className="list-item-price">${Number(purchase.totalPrice).toLocaleString('es-MX')}</span>
          <span className="list-item-badge badge-active">✓ Completada</span>
        </div>
      ))}
    </div>
  );
}

//CARRITO
function MyCart() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
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
    try { await removeFromCart(id); setItems((prev) => prev.filter((i) => i.id !== id)); }
    catch {/* silencioso */}
    finally { setRemoving(null); }
  }

  const total = items.reduce((sum, i) => sum + Number(i.totalPrice ?? 0), 0);

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
            <div className="list-item-cat">{labelCategory(item.product?.category)}</div>
            <div className="list-item-info">
              <span className="list-item-name">{item.product?.name ?? item.productSlug}</span>
              <span className="list-item-sub">Cantidad: {item.quantity}</span>
            </div>
            <span className="list-item-price">${Number(item.totalPrice).toLocaleString('es-MX')}</span>
            <button
              className="btn-remove"
              onClick={() => handleRemove(item.id)}
              disabled={removing === item.id}
            >
              {removing === item.id ? '…' : '✕'}
            </button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <span className="cart-total-label">Total</span>
        <span className="cart-total">${total.toLocaleString('es-MX')}</span>
        <button className="btn-primary cart-checkout">Proceder al pago →</button>
      </div>
    </div>
  );
}

//VISTA PRINCIPAL
export default function ProfileView() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('info');

  async function loadUser() {
    try { setUser(await getMyProfile()); }
    catch {/* redirigir a login en el router */}
    finally { setLoading(false); }
  }

  useEffect(() => { loadUser(); }, []);

  if (loading) return (
    <div className="profile-view">
      <div className="profile-skeleton" />
    </div>
  );

  if (!user) return (
    <div className="profile-view">
      <div className="section-empty">
        <div className="state-icon state-icon--lock" />
        <p>Debes iniciar sesión para ver tu perfil.</p>
        <a href="/login" className="btn-primary">Iniciar sesión</a>
      </div>
    </div>
  );

  return (
    <div className="profile-view">
      {/* Hero del perfil */}
      <div className="profile-hero">
        <AvatarUploader
          avatarUrl={user.avatarUrl}
          name={user.name}
          onUploaded={(url) => setUser((u) => ({ ...u, avatarUrl: url }))}
        />
        <div className="profile-hero-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <div className="profile-stats">
            <div className="pstat">
              <span className="pstat-num" id="js-listings-count">—</span>
              <span className="pstat-label">Publicaciones</span>
            </div>
            <div className="pstat">
              <span className="pstat-num" id="js-purchases-count">—</span>
              <span className="pstat-label">Compras</span>
            </div>
            <div className="pstat">
              <span className="pstat-num">{user.totpEnabled ? '✓' : '—'}</span>
              <span className="pstat-label">2FA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`profile-tab ${tab === t.id ? 'profile-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div className="tab-content">
        {tab === 'info'      && <ProfileInfo user={user} onUpdated={loadUser} />}
        {tab === 'listings'  && <MyListings />}
        {tab === 'purchases' && <MyPurchases />}
        {tab === 'cart'      && <MyCart />}
      </div>
    </div>
  );
}

//HELPERS
function labelCategory(cat) {
  const map = {
    ROPA:'Ropa', COMIDA:'Comida', ELECTRODOMESTICOS:'Electrodomésticos',
    ELECTRONICA:'Electrónica', DEPORTES:'Deportes', LIBROS:'Libros',
    HOGAR:'Hogar', BELLEZA:'Belleza', AUTOMOTRIZ:'Automotriz',
    JUGUETES:'Juguetes', ARTE:'Arte', OTROS:'Otros',
  };
  return map[cat] ?? cat;
}