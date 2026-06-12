const db = require('../db');

class Product {

    /* Inserta un nuevo producto en la tabla products.
     *
     * params:
     * { slug, title, description, price, category, stock, sellerId, imageUrl }
     *
     * return:
     * La fila completa del producto recién creado.
     */
    static async create({ slug, title, description, price, category, stock, sellerId, imageUrl }) {
        const { rows } = await db.query(
            `INSERT INTO products (slug, title, description, price, category, stock, seller_id, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [slug, title, description ?? null, Number(price),
             category, stock ?? 1, sellerId, imageUrl ?? null]
        );
        return rows[0];
    }

    /* Busca todos los productos, con filtros opcionales.
     * Hace JOIN con users para traer el nombre del vendedor,
     * y LEFT JOIN con ratings para calcular el rating promedio.
     *
     * params:
     * { category, search, seller } — todos opcionales.
     *
     * return:
     * Arreglo de productos. Vacío si no hay resultados.
     */
    static async findAll({ category, search, seller } = {}) {
        const conditions = ['p.stock > 0'];
        const values     = [];
        let i = 1;

        if (category) { conditions.push(`UPPER(p.category) = UPPER($${i++})`); values.push(category); }
        if (search)   { conditions.push(`p.title ILIKE $${i++}`);              values.push(`%${search}%`); }
        if (seller)   { conditions.push(`p.seller_id = $${i++}`);              values.push(Number(seller)); }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const { rows } = await db.query(
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
        return rows;
    }

    /* Busca un producto por su slug.
     *
     * param:
     * slug — identificador único del producto.
     *
     * return:
     * El producto encontrado, o null si no existe.
     */
    static async findBySlug(slug) {
        const { rows } = await db.query(
            `SELECT p.*, u.name AS seller_name,
                    ROUND(AVG(r.stars), 1) AS avg_rating,
                    COUNT(DISTINCT r.id)   AS rating_count
             FROM products p
             JOIN users u ON u.id = p.seller_id
             LEFT JOIN ratings r ON r.product_slug = p.slug
             WHERE p.slug = $1
             GROUP BY p.id, u.name`,
            [slug]
        );
        return rows[0] || null;
    }

    /* Busca los productos publicados por un vendedor específico.
     *
     * param:
     * sellerId — id del usuario vendedor.
     *
     * return:
     * Arreglo de productos del vendedor, ordenados por fecha descendente.
     */
    static async findBySeller(sellerId) {
        const { rows } = await db.query(
            'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
            [sellerId]
        );
        return rows;
    }

    /* Actualiza los campos enviados de un producto existente.
     * Solo actualiza los campos que vienen definidos (no undefined).
     *
     * params:
     * slug — identificador del producto a actualizar.
     * { title, description, price, category, stock, imageUrl } — todos opcionales.
     *
     * return:
     * El producto actualizado.
     */
    static async update(slug, { title, description, price, category, stock, imageUrl }) {
        const fields = [];
        const values = [];
        let i = 1;

        if (title       !== undefined) { fields.push(`title       = $${i++}`); values.push(title); }
        if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description); }
        if (price       !== undefined) { fields.push(`price       = $${i++}`); values.push(Number(price)); }
        if (category    !== undefined) { fields.push(`category    = $${i++}`); values.push(category); }
        if (stock       !== undefined) { fields.push(`stock       = $${i++}`); values.push(Number(stock)); }
        if (imageUrl    !== undefined) { fields.push(`image_url   = $${i++}`); values.push(imageUrl); }

        if (!fields.length) return null;

        values.push(slug);
        const { rows } = await db.query(
            `UPDATE products SET ${fields.join(', ')} WHERE slug = $${i} RETURNING *`,
            values
        );
        return rows[0] || null;
    }

    /* Elimina un producto por su slug.
     *
     * param:
     * slug — identificador del producto a eliminar.
     *
     * return:
     * true si se eliminó, false si no existía.
     */
    static async delete(slug) {
        const { rowCount } = await db.query(
            'DELETE FROM products WHERE slug = $1', [slug]
        );
        return rowCount > 0;
    }
}

module.exports = Product;