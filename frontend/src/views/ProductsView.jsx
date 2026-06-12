import { useState, useEffect, useRef } from 'react';
import { getProducts, rateProduct, addToCart, deleteProduct } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/products/ProductCard';
import PublishModal from '../components/products/PublishModal';
import CategoryIcon from '../components/CategoryIcon';
import './ProductsView.css';

const CATEGORIES = [
  { value: 'Ropa', label: 'Ropa' }, { value: 'Comida', label: 'Comida' },
  { value: 'Electrodomesticos', label: 'Electrodomésticos' }, { value: 'Electronica', label: 'Electrónica' },
  { value: 'Deportes', label: 'Deportes' }, { value: 'Libros', label: 'Libros' },
  { value: 'Hogar', label: 'Hogar' }, { value: 'Belleza', label: 'Belleza' },
  { value: 'Automotriz', label: 'Automotriz' }, { value: 'Juguetes', label: 'Juguetes' },
  { value: 'Arte', label: 'Arte' }, { value: 'Otros', label: 'Otros' },
];

export default function ProductsView() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotif] = useState(null);
  const [sortBy, setSortBy] = useState('reciente');
  const debounceRef = useRef(null);

  async function loadProducts(searchValue = search, categoryValue = category) {
    setLoading(true); setError('');
    try {
      const params = {};
      if (searchValue) params.search = searchValue;
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
    debounceRef.current = setTimeout(() => loadProducts(value, category), 300);
  }

  function notify(msg, type = 'ok') {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 2800);
  }

  async function handleRate(slug, stars) {
    if (!isAuthenticated) return;
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
    if (sortBy === 'precio-asc') return a.price - b.price;
    if (sortBy === 'precio-desc') return b.price - a.price;
    if (sortBy === 'rating') return (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0);
    return 0;
  });

  return (
      <div className="products-view">
        {notification && <div className={`toast${notification.type === 'error' ? ' toast--error' : ''}`}>{notification.msg}</div>}

        <div className="view-header">
          <div>
            <h1 className="view-title">Explorar productos</h1>
            <p className="view-sub">Encuentra lo que buscas entre miles de publicaciones</p>
          </div>
          <button
              className={`btn-primary${!isAuthenticated ? ' btn-primary--muted' : ''}`}
              onClick={() => isAuthenticated ? setShowModal(true) : null}
              disabled={!isAuthenticated}
              title={!isAuthenticated ? 'Inicia sesión para publicar un producto' : ''}
          >
            + {isAuthenticated ? 'Publicar producto' : 'Inicia sesión para publicar'}
          </button>
        </div>

        <div className="filters-bar">
          <div className="filters-top">
            <div className="search-wrap">
              <input
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Buscar productos…"
                  className="search-input search-input--full"
              />
              {search && <button className="search-clear" onClick={() => { setSearch(''); loadProducts('', category); }}>✕</button>}
            </div>
            <div className="sort-wrap">
              <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="reciente">Más recientes</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="rating">Mejor calificados</option>
              </select>
            </div>
          </div>

          <div className="category-chips">
            <button className={`chip${category === '' ? ' chip--active' : ''}`} onClick={() => setCategory('')}>Todos</button>
            {CATEGORIES.map((c) => (
                <button key={c.value} className={`chip${category === c.value ? ' chip--active' : ''}`} onClick={() => setCategory(c.value)}>
                  <CategoryIcon category={c.value} className="chip-icon" />
                  {c.label}
                </button>
            ))}
          </div>
        </div>

        {loading && <div className="skeleton-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" />)}</div>}

        {!loading && error && (
            <div className="state-empty">
              <p>{error}</p>
              <button className="btn-secondary" onClick={() => loadProducts(search, category)}>Reintentar</button>
            </div>
        )}

        {!loading && !error && sorted.length === 0 && (
            <div className="state-empty">
              <p>No se encontraron productos{search ? ` para "${search}"` : ''}.</p>
              <button className="btn-secondary" onClick={() => { setSearch(''); setCategory(''); loadProducts(); }}>Limpiar filtros</button>
            </div>
        )}

        {!loading && !error && sorted.length > 0 && (
            <div className="products-grid">
              {sorted.map((p) => (
                  <ProductCard key={p.slug} product={p} onRate={handleRate} onAddCart={handleAddCart} onDelete={handleDelete} />
              ))}
            </div>
        )}

        {showModal && <PublishModal onClose={() => setShowModal(false)} onSuccess={() => { notify('¡Producto publicado!'); loadProducts(); }} />}
      </div>
  );
}