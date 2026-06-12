const express = require('express');
const router = express.Router();
const pool = require('../db');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/me', auth, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        'SELECT id, name, email, username, age, created_at FROM users WHERE id = $1',
        [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json(rows[0]);
}));

router.patch('/me', auth, asyncHandler(async (req, res) => {
    const { name, age, username } = req.body;
    const fields = [];
    const values = [];
    let i = 1;

    if (name) {
        fields.push(`name = $${i++}`);
        values.push(String(name).trim());
    }
    if (age) {
        fields.push(`age = $${i++}`);
        values.push(Number(age));
    }
    if (username) {
        const newUsername = String(username).trim();
        const { rows: taken } = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [newUsername, req.user.id]
        );
        if (taken.length) {
            return res.status(409).json({ message: 'Ese nombre de usuario ya está en uso.' });
        }
        fields.push(`username = $${i++}`);
        values.push(newUsername);
    }

    if (!fields.length) {
        return res.status(400).json({ message: 'Nada que actualizar.' });
    }

    values.push(req.user.id);
    const { rows } = await pool.query(
        `UPDATE users
         SET ${fields.join(', ')}
         WHERE id = $${i} RETURNING id, name, email, username, age, created_at`,
        values
    );
    return res.json(rows[0]);
}));

router.get('/me/purchases', auth, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT p.*, pr.title, pr.price AS unit_price
         FROM purchases p
         JOIN products pr ON pr.slug = p.product_slug
         WHERE p.buyer_id = $1
         ORDER BY p.bought_at DESC`,
        [req.user.id]
    );
    return res.json(rows);
}));

router.get('/me/listings', auth, asyncHandler(async (req, res) => {
    const products = await Product.findBySeller(req.user.id);
    return res.json(products);
}));

router.get('/me/cart', auth, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT ci.id, ci.quantity, ci.added_at, p.slug, p.title, p.price, p.category
         FROM cart_items ci
         JOIN products p ON p.slug = ci.product_slug
         WHERE ci.user_id = $1
         ORDER BY ci.added_at DESC`,
        [req.user.id]
    );
    return res.json(rows);
}));

router.post('/me/cart', auth, asyncHandler(async (req, res) => {
    const { productSlug, quantity = 1 } = req.body;
    if (!productSlug) return res.status(400).json({ message: 'productSlug requerido.' });

    const { rows } = await pool.query(
        `INSERT INTO cart_items (user_id, product_slug, quantity)
         VALUES ($1, $2, $3) ON CONFLICT (user_id, product_slug)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
         RETURNING *`,
        [req.user.id, productSlug, quantity]
    );
    return res.status(201).json(rows[0]);
}));

router.delete('/me/cart/:cartItemId', auth, asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query(
        'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
        [req.params.cartItemId, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Item no encontrado.' });
    return res.status(204).send();
}));

module.exports = router;