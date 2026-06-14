const express = require('express');
const router = express.Router();
const pool = require('../db');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { createProductSchema, updateProductSchema } = require('../schemas/productSchema');
const { slugify } = require('../utils/slugify');

function buildCommentTree(rows) {
    const map = {};
    const roots = [];

    for (const row of rows) {
        map[row.id] = { ...row, children: [] };
    }

    for (const row of rows) {
        if (row.parent_id && map[row.parent_id]) {
            map[row.parent_id].children.push(map[row.id]);
        } else {
            roots.push(map[row.id]);
        }
    }

    return roots;
}

router.get('/', asyncHandler(async (req, res) => {
    const { category, search, seller } = req.query;
    const products = await Product.findAll({ category, search, seller });
    return res.json(products);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
    const product = await Product.findBySlug(req.params.slug);
    if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado.' });
    }
    return res.json(product);
}));

router.post('/', auth, validate(createProductSchema), asyncHandler(async (req, res) => {
    const { title, description, price, category, stock, image_url } = req.body;

    const categoryMap = {
        'ropa': 'ROPA', 'comida': 'COMIDA', 'electrodomesticos': 'ELECTRODOMESTICOS',
        'electronica': 'ELECTRONICA', 'deportes': 'DEPORTES', 'libros': 'LIBROS',
        'hogar': 'HOGAR', 'belleza': 'BELLEZA', 'automotriz': 'AUTOMOTRIZ',
        'juguetes': 'JUGUETES', 'arte': 'ARTE', 'otros': 'OTROS',
        'electrodomésticos': 'ELECTRODOMESTICOS', 'electrónica': 'ELECTRONICA',
    };

    const normalizedCategory = category
        ? (categoryMap[category.toLowerCase()] ?? category.toUpperCase())
        : 'OTROS';

    let slug = slugify(title);
    const existing = await Product.findBySlug(slug);
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await Product.create({
        slug, title, description, price,
        category: normalizedCategory, stock,
        sellerId: req.user.id, imageUrl: image_url,
    });

    return res.status(201).json(product);
}));

router.patch('/:slug', auth, validate(updateProductSchema), asyncHandler(async (req, res) => {
    const product = await Product.findBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado.' });
    if (product.seller_id !== req.user.id) {
        return res.status(403).json({ message: 'No autorizado.' });
    }

    const { title, description, price, category, stock, image_url } = req.body;
    const updated = await Product.update(req.params.slug, {
        title, description, price, category, stock, imageUrl: image_url,
    });

    if (!updated) return res.status(400).json({ message: 'Nada que actualizar.' });
    return res.json(updated);
}));

router.delete('/:slug', auth, asyncHandler(async (req, res) => {
    const product = await Product.findBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado.' });
    if (product.seller_id !== req.user.id) {
        return res.status(403).json({ message: 'No autorizado.' });
    }

    await Product.delete(req.params.slug);
    return res.status(204).send();
}));

router.get('/:slug/comments', asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT
           c.id,
           c.parent_id,
           c.body,
           c.created_at,
           u.id   AS user_id,
           u.name AS author,
           COUNT(CASE WHEN cv.useful = true  THEN 1 END) AS votes_useful,
           COUNT(CASE WHEN cv.useful = false THEN 1 END) AS votes_not_useful
         FROM comments c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN comment_votes cv ON cv.comment_id = c.id
         WHERE c.product_slug = $1
         GROUP BY c.id, c.parent_id, c.body, c.created_at, u.id, u.name
         ORDER BY c.created_at ASC`,
        [req.params.slug]
    );

    return res.json(buildCommentTree(rows));
}));

router.post('/:slug/comments', auth, asyncHandler(async (req, res) => {
    const { body, parent_id } = req.body;
    if (!body?.trim()) {
        return res.status(400).json({ message: 'El comentario no puede estar vacío.' });
    }

    if (parent_id != null) {
        const { rows: parent } = await pool.query(
            'SELECT id FROM comments WHERE id = $1 AND product_slug = $2',
            [parent_id, req.params.slug]
        );
        if (!parent.length) {
            return res.status(404).json({ message: 'Comentario padre no encontrado.' });
        }
    }

    const { rows } = await pool.query(
        `INSERT INTO comments (product_slug, user_id, parent_id, body)
         VALUES ($1, $2, $3, $4)
         RETURNING id, product_slug, user_id, parent_id, body, created_at`,
        [req.params.slug, req.user.id, parent_id ?? null, body.trim()]
    );
    return res.status(201).json(rows[0]);
}));

router.post('/comments/:commentId/vote', auth, asyncHandler(async (req, res) => {
    const { useful } = req.body;
    if (typeof useful !== 'boolean') {
        return res.status(400).json({ message: 'useful debe ser true o false.' });
    }

    const { rows } = await pool.query(
        `INSERT INTO comment_votes (comment_id, user_id, useful)
         VALUES ($1, $2, $3)
         ON CONFLICT (comment_id, user_id)
         DO UPDATE SET useful = EXCLUDED.useful
         RETURNING *`,
        [req.params.commentId, req.user.id, useful]
    );
    return res.json(rows[0]);
}));

router.post('/:slug/ratings', auth, asyncHandler(async (req, res) => {
    const stars = Number(req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return res.status(400).json({ message: 'stars debe ser un entero entre 1 y 5.' });
    }

    const { rows } = await pool.query(
        `INSERT INTO ratings (product_slug, user_id, stars)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_slug, user_id)
         DO UPDATE SET stars = EXCLUDED.stars
         RETURNING *`,
        [req.params.slug, req.user.id, stars]
    );
    return res.json(rows[0]);
}));

module.exports = router;