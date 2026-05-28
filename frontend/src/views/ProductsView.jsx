import { useState, useEffect, useRef } from 'react';
import { getProducts, createProduct, deleteProduct, rateProduct, addToCart } from '../services/api';
import CategoryIcon from '../components/CategoryIcon';
import './ProductsView.css';

const CATEGORIES = [
  { value: 'Ropa',              label: 'Ropa'              },
  { value: 'Comida',            label: 'Comida'            },
  { value: 'Electrodomesticos', label: 'Electrodomésticos' },
  { value: 'Electronica',       label: 'Electrónica'       },
  { value: 'Deportes',          label: 'Deportes'          },
  { value: 'Libros',            label: 'Libros'            },
  { value: 'Hogar',             label: 'Hogar'             },
  { value: 'Belleza',           label: 'Belleza'           },
  { value: 'Automotriz',        label: 'Automotriz'        },
  { value: 'Juguetes',          label: 'Juguetes'          },
  { value: 'Arte',              label: 'Arte'              },
  { value: 'Otros',             label: 'Otros'             },
];

export function labelCategory(cat) {
  if (!cat) return 'Otros';
  const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const found = CATEGORIES.find(c => normalize(c.value) === normalize(cat));
  return found?.label ?? cat;
}

function StarRating({ value = 0, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? hovered || value : value;
  return (
    <div className="stars" aria-label={`${value} estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          className={`star ${s <= display ? 'filled' : ''}`}
          onClick={() => interactive && onChange?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          disabled={!interactive}
          aria-label={`${s} estrella${s > 1 ? 's' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill={s <= display ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product, onRate, onAddCart, onDelete, isOwner, isLogged, onOpenLogin }) {
  const [added,      setAdded]      = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function handleCart() {
    if (!isLogged) { onOpenLogin?.(); return; }
    try {
      await onAddCart(product.slug);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {/* padre maneja error */}
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try { await onDelete(product.slug); }
    finally { setDeleting(false); setConfirmDel(false); }
  }

  const rating = Number(product.avg_rating ?? product._avg?.stars ?? 0);

  return (
    <article className="product-card">
      <div className="card-image">
        {(product.image_url || product.imageUrl)
          ? <img src={product.image_url ?? product.imageUrl} alt={product.title} loading="lazy" className="card-img" />
          : (
            <div className="card-placeholder">
              <CategoryIcon category={product.category} className="placeholder-icon" />
            </div>
          )
        }
        <span className="card-badge">{labelCategory(product.category)}</span>
        {isOwner && (
          <button
            className={`btn-delete-card${confirmDel ? ' confirm' : ''}`}
            onClick={handleDelete}
            disabled={deleting}
            title={confirmDel ? 'Confirmar eliminación' : 'Eliminar producto'}
          >
            {deleting ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                <circle cx="12" cy="12" r="9" strokeDasharray="28" strokeDashoffset="8"/>
              </svg>
            ) : confirmDel ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6m4-6v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title">{product.title}</h3>
        <p className="card-desc">{product.description}</p>
        <div className="card-seller">
          <span className="seller-dot" />
          {product.seller_name ?? product.seller?.name ?? 'Vendedor'}
        </div>
        <div className="card-footer">
          <span className="card-price">${Number(product.price).toLocaleString('es-MX')}</span>
          <div className="card-rating">
            <StarRating
              value={rating}
              interactive={isLogged && !isOwner}
              onChange={(s) => onRate(product.slug, s)}
            />
            {rating > 0 && <span className="rating-num">{Number(rating).toFixed(1)}</span>}
          </div>
        </div>
        <button
          className={`btn-cart${added ? ' btn-cart--added' : ''}${!isLogged ? ' btn-cart--locked' : ''}`}
          onClick={handleCart}
          title={!isLogged ? 'Inicia sesión para agregar al carrito' : ''}
        >
          {added ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Agregado
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {isLogged ? 'Agregar al carrito' : 'Inicia sesión para comprar'}
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function PublishModal({ onClose, onSuccess }) {
  const [form,    setForm]    = useState({ title: '', description: '', price: '', category: 'Otros', stock: '1' });
  const [imageB64, setImageB64] = useState('');
  const [preview,  setPreview]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const fileRef = useRef();

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2 MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => setImageB64(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!form.title?.trim() || !form.price) {
      setError('Nombre y precio son obligatorios.');
      return;
    }
    setLoading(true); setError('');
    try {
      await createProduct({
        ...form,
        price:     parseFloat(form.price),
        stock:     parseInt(form.stock, 10) || 1,
        image_url: imageB64 || null,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Publicar producto</h2>
          <button className="modal-x" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}

          {/* Imagen */}
          <div className="field">
            <label>Imagen del producto <span className="field-optional">(opcional, máx 2 MB)</span></label>
            <div
              className={`image-picker${preview ? ' image-picker--filled' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Vista previa" className="image-picker-preview" />
                  <div className="image-picker-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Cambiar imagen
                  </div>
                </>
              ) : (
                <div className="image-picker-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Haz clic para subir una imagen</span>
                  <span className="image-picker-sub">PNG, JPG, WEBP</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFile}
            />
            {preview && (
              <button
                className="btn-remove-image"
                onClick={(e) => { e.stopPropagation(); setPreview(''); setImageB64(''); }}
              >
                ✕ Quitar imagen
              </button>
            )}
          </div>

          <div className="field">
            <label>Nombre del producto</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Nombre..."
            />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Describe tu producto…"
            />
          </div>

          <div className="field-row">
            <div className="field field--price">
              <label>Precio (MXN)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="field field--stock">
              <label>Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
            <div className="field field--category">
              <label>Categoría</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsView({ isLogged, onOpenLogin }) {
  const [products,     setProducts]  = useState([]);
  const [loading,      setLoading]   = useState(true);
  const [error,        setError]     = useState('');
  const [search,       setSearch]    = useState('');
  const [category,     setCategory]  = useState('');
  const [showModal,    setShowModal] = useState(false);
  const [notification, setNotif]     = useState(null);
  const [sortBy,       setSortBy]    = useState('reciente');
  const searchRef = useRef();
  const debounceRef = useRef(null);

  const currentUserId = localStorage.getItem('userId');

  async function loadProducts(searchValue = search, categoryValue = category) {
    setLoading(true); setError('');
    try {
      const params = {};
      if (searchValue)   params.search   = searchValue;
      if (categoryValue) params.category = categoryValue;
      setProducts(await getProducts(params));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(search, category); }, [category]);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProducts(value, category);
    }, 300);
  }

  function notify(msg, type = 'ok') {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 2800);
  }

  async function handleRate(slug, stars) {
    if (!isLogged) { onOpenLogin?.(); return; }
    try {
      await rateProduct(slug, stars);
      notify('Calificación registrada');
      loadProducts();
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  async function handleAddCart(slug) {
    await addToCart(slug);
    notify('Producto agregado al carrito');
  }

  async function handleDelete(slug) {
    try {
      await deleteProduct(slug);
      notify('Producto eliminado');
      setProducts((prev) => prev.filter((p) => p.slug !== slug));
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'precio-asc')  return a.price - b.price;
    if (sortBy === 'precio-desc') return b.price - a.price;
    if (sortBy === 'rating')      return (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0);
    return 0;
  });

  return (
    <div className="products-view">
      {notification && (
        <div className={`toast${notification.type === 'error' ? ' toast--error' : ''}`}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Explorar productos</h1>
          <p className="view-sub">Encuentra lo que buscas entre miles de publicaciones</p>
        </div>
        <button
          className={`btn-primary${!isLogged ? ' btn-primary--muted' : ''}`}
          onClick={() => isLogged ? setShowModal(true) : onOpenLogin?.()}
          title={!isLogged ? 'Inicia sesión para publicar un producto' : ''}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {isLogged ? 'Publicar producto' : 'Inicia sesión para publicar'}
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="filters-top">
          <div className="search-wrap">
            <span className="search-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              ref={searchRef}
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar productos…"
              className="search-input search-input--full"
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => { setSearch(''); loadProducts('', category); }}
                aria-label="Limpiar búsqueda"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <div className="sort-wrap">
            <label className="sort-label">Ordenar:</label>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="reciente">Más recientes</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="rating">Mejor calificados</option>
            </select>
          </div>
        </div>

        <div className="category-chips">
          <button
            className={`chip${category === '' ? ' chip--active' : ''}`}
            onClick={() => setCategory('')}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`chip${category === c.value ? ' chip--active' : ''}`}
              onClick={() => setCategory(c.value)}
            >
              <CategoryIcon category={c.value} className="chip-icon" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && !error && (
        <p className="results-count">
          {sorted.length === 0
            ? 'Sin resultados'
            : `${sorted.length} producto${sorted.length !== 1 ? 's' : ''} encontrado${sorted.length !== 1 ? 's' : ''}`
          }
        </p>
      )}

      {loading && (
        <div className="skeleton-grid">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      )}

      {!loading && error && (
        <div className="state-empty">
          <div className="state-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p>{error}</p>
          <button className="btn-secondary" onClick={loadProducts}>Reintentar</button>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="state-empty">
          <div className="state-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p>No se encontraron productos{search ? ` para "${search}"` : ''}.</p>
          <button className="btn-secondary" onClick={() => { setSearch(''); setCategory(''); loadProducts(); }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="products-grid">
          {sorted.map((p) => (
            <ProductCard
              key={p.slug}
              product={p}
              onRate={handleRate}
              onAddCart={handleAddCart}
              onDelete={handleDelete}
              isOwner={currentUserId && String(p.seller_id) === String(currentUserId)}
              isLogged={isLogged}
              onOpenLogin={onOpenLogin}
            />
          ))}
        </div>
      )}

      {showModal && (
        <PublishModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { notify('¡Producto publicado!'); loadProducts(); }}
        />
      )}
    </div>
  );
}