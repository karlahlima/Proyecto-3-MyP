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

    if(!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? 'Error en la solicitud');
    }

    return res.json();
}

//PRODUCTOS

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

export async function deleteProduct(slug) {
    return request(`/products/${slug}`, { method: 'DELETE' });
}

//USERS

export async function getMyProfile() {
    return request('/users/me');
}

export async function updateMyProfile(data) {
    return request('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function uploadAvatar(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${BASE_URL}/users/me/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    if (!res.ok) throw new Error('Error al subir imagen');
    return res.json();
}

export async function getMyPurchases() {
    return request('/users/me/purchases');
}

export async function getMyListings() {
    return request('/users/me/listings');
}

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

//COMENTARIOS

export async function getComments(productSlug) {
    return request(`/products/${productSlug}/comments`);
}

export async function postComment(productSlug, body) {
    return request(`/products/${productSlug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
    });
}

export async function voteComment(commentId, useful) {
    return request(`/comments/${commentId}/vote`, {
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





