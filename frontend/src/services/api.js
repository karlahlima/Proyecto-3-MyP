const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, options = {}) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? 'Error en la solicitud');
    }

    return res.json();
}

// AUTH

export async function login({ email, password }) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function register({ name, email, username, age, password }) {
    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, username, age: Number(age), password }),
    });
}

export function clearAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userUsername');
    localStorage.removeItem('userEmail');
}

// PRODUCTOS

export async function getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
}

export async function getProductBySlug(slug) {
    return request(`/products/${slug}`);
}

export async function createProduct(data) {
    return request('/products', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateProduct(slug, data) {
    return request(`/products/${slug}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteProduct(slug) {
    return request(`/products/${slug}`, { method: 'DELETE' });
}

// USUARIOS

export async function getMyProfile() {
    return request('/users/me');
}

export async function updateMyProfile(data) {
    return request('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function uploadAvatar(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            const MAX = 256;
            const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * ratio);
            canvas.height = Math.round(img.height * ratio);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

            const base64 = canvas.toDataURL('image/jpeg', 0.82);

            request('/users/me/avatar', {
                method: 'POST',
                body: JSON.stringify({ avatarBase64: base64 }),
            })
                .then(resolve)
                .catch(reject);
        };

        img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
    });
}

export async function getMyPurchases() {
    return request('/users/me/purchases');
}

export async function getMyListings() {
    return request('/users/me/listings');
}

export async function getMySales() {
    return request('/users/me/sales');
}

// CARRITO

export async function getMyCart() {
    return request('/users/me/cart');
}

export async function addToCart(productSlug, quantity = 1) {
    return request('/users/me/cart', {
        method: 'POST',
        body: JSON.stringify({ productSlug, quantity }),
    });
}

export async function removeFromCart(cartItemId) {
    return request(`/users/me/cart/${cartItemId}`, { method: 'DELETE' });
}

export async function checkoutCart(paymentData) {
    return request('/users/me/cart/checkout', {
        method: 'POST',
        body: JSON.stringify(paymentData),
    });
}

// COMENTARIOS

export async function getComments(productSlug) {
    return request(`/products/${productSlug}/comments`);
}

export async function postComment(productSlug, body, parentId = null) {
    return request(`/products/${productSlug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body, ...(parentId != null ? { parent_id: parentId } : {}) }),
    });
}

export async function voteComment(commentId, useful) {
    return request(`/products/comments/${commentId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ useful }),
    });
}

export async function rateProduct(productSlug, stars) {
    return request(`/products/${productSlug}/ratings`, {
        method: 'POST',
        body: JSON.stringify({ stars }),
    });
}