import {useState} from 'react';
import {useAuth} from '../../contexts/AuthContext';
import CategoryIcon from '../CategoryIcon';

export function labelCategory(cat) {
    if (!cat) return 'Otros';
    const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const categories = [
        {value: 'Ropa', label: 'Ropa'}, {value: 'Comida', label: 'Comida'},
        {value: 'Electrodomesticos', label: 'Electrodomésticos'}, {value: 'Electronica', label: 'Electrónica'},
        {value: 'Deportes', label: 'Deportes'}, {value: 'Libros', label: 'Libros'},
        {value: 'Hogar', label: 'Hogar'}, {value: 'Belleza', label: 'Belleza'},
        {value: 'Automotriz', label: 'Automotriz'}, {value: 'Juguetes', label: 'Juguetes'},
        {value: 'Arte', label: 'Arte'}, {value: 'Otros', label: 'Otros'},
    ];
    const found = categories.find(c => normalize(c.value) === normalize(cat));
    return found?.label ?? cat;
}

function StarRating({value = 0, interactive = false, onChange}) {
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
                >
                    <svg viewBox="0 0 24 24" fill={s <= display ? 'currentColor' : 'none'} stroke="currentColor"
                         strokeWidth="1.5">
                        <polygon
                            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </button>
            ))}
        </div>
    );
}

export default function ProductCard({product, onRate, onAddCart, onDelete}) {
    const {isAuthenticated} = useAuth();
    const [added, setAdded] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const currentUserId = localStorage.getItem('userId');
    const isOwner = currentUserId && String(product.seller_id) === String(currentUserId);
    const rating = Number(product.avg_rating ?? product._avg?.stars ?? 0);

    async function handleCart() {
        if (!isAuthenticated) return;
        try {
            await onAddCart(product.slug);
            setAdded(true);
            window.dispatchEvent(new Event('cartUpdated'));
            setTimeout(() => setAdded(false), 2000);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleDelete() {
        if (!confirmDel) {
            setConfirmDel(true);
            return;
        }
        await onDelete(product.slug);
    }

    return (
        <article className="product-card">
            <div className="card-image">
                {(product.image_url || product.imageUrl) ? (
                    <img src={product.image_url ?? product.imageUrl} alt={product.title} loading="lazy"
                         className="card-img"/>
                ) : (
                    <div className="card-placeholder">
                        <CategoryIcon category={product.category} className="placeholder-icon"/>
                    </div>
                )}
                <span className="card-badge">{labelCategory(product.category)}</span>

                {isOwner && (
                    <button
                        className={`btn-delete-card${confirmDel ? ' confirm' : ''}`}
                        onClick={handleDelete}
                        title={confirmDel ? 'Confirmar eliminación' : 'Eliminar producto'}
                    >
                        {confirmDel ? '¿Seguro?' : 'Eliminar'}
                    </button>
                )}
            </div>

            <div className="card-body">
                <h3 className="card-title">{product.title}</h3>
                <p className="card-desc">{product.description}</p>
                <div className="card-seller">
                    <span className="seller-dot"/>
                    {product.seller_name ?? product.seller?.name ?? 'Vendedor'}
                </div>
                <div className="card-footer">
                    <span className="card-price">${Number(product.price).toLocaleString('es-MX')}</span>
                    <div className="card-rating">
                        <StarRating
                            value={rating}
                            interactive={isAuthenticated && !isOwner}
                            onChange={(s) => onRate(product.slug, s)}
                        />
                        {rating > 0 && <span className="rating-num">{Number(rating).toFixed(1)}</span>}
                    </div>
                </div>
                <button
                    className={`btn-cart${added ? ' btn-cart--added' : ''}`}
                    onClick={handleCart}
                    disabled={!isAuthenticated || added}
                >
                    {added ? 'Agregado ✓' : (isAuthenticated ? 'Agregar al carrito' : 'Inicia sesión para comprar')}
                </button>
            </div>
        </article>
    );
}