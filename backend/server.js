require('dotenv').config();
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('./Models/User');
const pool = require('./db');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'cambiar_en_produccion';

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token requerido.' });
    }
    try {
        req.user = jwt.verify(header.slice(7), JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
}

function slugify(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, username, age, password } = req.body;
        if (!name || !email || !age || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        const finalUsername   = username
            ? String(username).trim()
            : String(email).split('@')[0].trim();
        const normalizedEmail = String(email).trim().toLowerCase();
        const numericAge      = Number(age);

        if (Number.isNaN(numericAge) || numericAge < 18) {
            return res.status(400).json({ message: 'Debes tener al menos 18 años.' });
        }
        if (await User.findUserOrEmail(normalizedEmail)) {
            return res.status(409).json({ message: 'Ese email ya está registrado.' });
        }
        if (await User.findUserOrEmail(finalUsername)) {
            return res.status(409).json({ message: 'Ese nombre de usuario ya está registrado.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            username: finalUsername,
            age: numericAge,
            passwordHash,
        });

        return res.status(201).json({ message: 'Usuario registrado.', token: signToken(user), user });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Email o usuario ya existe.' });
        }
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password, identifier } = req.body;
        const searchKey = String(email || identifier || '').trim().toLowerCase();

        if (!searchKey || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        const userRecord = await User.findUserOrEmail(searchKey);
        if (!userRecord) {
            return res.status(401).json({ message: 'Email inválido.' });
        }

        const passwordHash  = userRecord.password_hash || userRecord.passwordHash;
        const passwordMatch = await bcrypt.compare(password, passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Contraseña inválida.' });
        }

        const { password_hash, ...safeUser } = userRecord;
        return res.status(200).json({ message: 'Login exitoso.', token: signToken(safeUser), user: safeUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/users/me', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, username, age, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado.' });
        return res.json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.patch('/users/me', auth, async (req, res) => {
    try {
        const { name, age, username } = req.body;
        const fields = [];
        const values = [];
        let i = 1;

        if (name)     { fields.push(`name     = $${i++}`); values.push(String(name).trim()); }
        if (age)      { fields.push(`age      = $${i++}`); values.push(Number(age)); }
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
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${i}
             RETURNING id, name, email, username, age, created_at`,
            values
        );
        return res.json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/users/me/purchases', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT p.*, pr.title, pr.price AS unit_price
             FROM purchases p
             JOIN products pr ON pr.slug = p.product_slug
             WHERE p.buyer_id = $1
             ORDER BY p.bought_at DESC`,
            [req.user.id]
        );
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/users/me/listings', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/users/me/cart', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT ci.id, ci.quantity, ci.added_at,
                    p.slug, p.title, p.price, p.category
             FROM cart_items ci
             JOIN products p ON p.slug = ci.product_slug
             WHERE ci.user_id = $1
             ORDER BY ci.added_at DESC`,
            [req.user.id]
        );
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/users/me/cart', auth, async (req, res) => {
    try {
        const { productSlug, quantity = 1 } = req.body;
        if (!productSlug) return res.status(400).json({ message: 'productSlug requerido.' });

        const { rows } = await pool.query(
            `INSERT INTO cart_items (user_id, product_slug, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, product_slug)
             DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
             RETURNING *`,
            [req.user.id, productSlug, quantity]
        );
        return res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.delete('/users/me/cart/:cartItemId', auth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
            [req.params.cartItemId, req.user.id]
        );
        if (!rowCount) return res.status(404).json({ message: 'Item no encontrado.' });
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/products', async (req, res) => {
    try {
        const { category, search, seller } = req.query;
        const conditions = [];
        const values     = [];
        let i = 1;

        if (category) { conditions.push(`UPPER(p.category) = UPPER($${i++})`); values.push(category); }
        if (search)   { conditions.push(`p.title ILIKE $${i++}`);              values.push(`%${search}%`); }
        if (seller)   { conditions.push(`p.seller_id = $${i++}`);              values.push(Number(seller)); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT p.*, u.name AS seller_name,
                    ROUND(AVG(r.stars), 1) AS avg_rating,
                    COUNT(DISTINCT r.id)   AS rating_count
             FROM products p
             JOIN users u ON u.id = p.seller_id
             LEFT JOIN ratings r ON r.product_slug = p.slug
             ${where}
             GROUP BY p.id, u.name
             ORDER BY p.created_at DESC`,
            values
        );
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/products/:slug', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT p.*, u.name AS seller_name,
                    ROUND(AVG(r.stars), 1) AS avg_rating,
                    COUNT(DISTINCT r.id)   AS rating_count
             FROM products p
             JOIN users u ON u.id = p.seller_id
             LEFT JOIN ratings r ON r.product_slug = p.slug
             WHERE p.slug = $1
             GROUP BY p.id, u.name`,
            [req.params.slug]
        );
        if (!rows.length) return res.status(404).json({ message: 'Producto no encontrado.' });
        return res.json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/products', auth, async (req, res) => {
    try {
        const { title, description, price, category, stock, image_url } = req.body;
        if (!title || price === undefined) {
            return res.status(400).json({ message: 'title y price son obligatorios.' });
        }

        const categoryMap = {
            'ropa':'ROPA', 'comida':'COMIDA', 'electrodomésticos':'ELECTRODOMESTICOS',
            'electrodomesticos':'ELECTRODOMESTICOS', 'electrónica':'ELECTRONICA',
            'electronica':'ELECTRONICA', 'deportes':'DEPORTES', 'libros':'LIBROS',
            'hogar':'HOGAR', 'belleza':'BELLEZA', 'automotriz':'AUTOMOTRIZ',
            'juguetes':'JUGUETES', 'arte':'ARTE', 'otros':'OTROS',
        };
        const normalizedCategory = category
            ? (categoryMap[category.toLowerCase()] ?? category.toUpperCase())
            : 'OTROS';

        let slug = slugify(title);
        const { rows: existing } = await pool.query(
            'SELECT id FROM products WHERE slug = $1', [slug]
        );
        if (existing.length) slug = `${slug}-${Date.now()}`;

        const { rows } = await pool.query(
            `INSERT INTO products (slug, title, description, price, category, stock, seller_id, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [slug, title, description ?? null, Number(price),
             normalizedCategory, stock ?? 1, req.user.id, image_url ?? null]
        );
        return res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.patch('/products/:slug', auth, async (req, res) => {
    try {
        const { rows: found } = await pool.query(
            'SELECT * FROM products WHERE slug = $1', [req.params.slug]
        );
        if (!found.length) return res.status(404).json({ message: 'Producto no encontrado.' });
        if (found[0].seller_id !== req.user.id) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const { title, description, price, category, stock, image_url } = req.body;
        const fields = [];
        const values = [];
        let i = 1;

        if (title       !== undefined) { fields.push(`title       = $${i++}`); values.push(title); }
        if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description); }
        if (price       !== undefined) { fields.push(`price       = $${i++}`); values.push(Number(price)); }
        if (category    !== undefined) { fields.push(`category    = $${i++}`); values.push(category); }
        if (stock       !== undefined) { fields.push(`stock       = $${i++}`); values.push(Number(stock)); }
        if (image_url   !== undefined) { fields.push(`image_url   = $${i++}`); values.push(image_url); }

        if (!fields.length) return res.status(400).json({ message: 'Nada que actualizar.' });

        values.push(req.params.slug);
        const { rows } = await pool.query(
            `UPDATE products SET ${fields.join(', ')} WHERE slug = $${i} RETURNING *`,
            values
        );
        return res.json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.delete('/products/:slug', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT seller_id FROM products WHERE slug = $1', [req.params.slug]
        );
        if (!rows.length) return res.status(404).json({ message: 'Producto no encontrado.' });
        if (rows[0].seller_id !== req.user.id) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        await pool.query('DELETE FROM products WHERE slug = $1', [req.params.slug]);
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/products/:slug/comments', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT c.*, u.name AS author,
                    COUNT(CASE WHEN cv.useful = true  THEN 1 END) AS votes_useful,
                    COUNT(CASE WHEN cv.useful = false THEN 1 END) AS votes_not_useful
             FROM comments c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN comment_votes cv ON cv.comment_id = c.id
             WHERE c.product_slug = $1
             GROUP BY c.id, u.name
             ORDER BY c.created_at DESC`,
            [req.params.slug]
        );
        return res.json(rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/products/:slug/comments', auth, async (req, res) => {
    try {
        const { body } = req.body;
        if (!body?.trim()) return res.status(400).json({ message: 'El comentario no puede estar vacío.' });

        const { rows } = await pool.query(
            `INSERT INTO comments (product_slug, user_id, body)
             VALUES ($1, $2, $3) RETURNING *`,
            [req.params.slug, req.user.id, body.trim()]
        );
        return res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/comments/:commentId/vote', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/products/:slug/ratings', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend corriendo en puerto ${port}`));