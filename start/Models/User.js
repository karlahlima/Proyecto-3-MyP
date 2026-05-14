const db = require('../db');

class User {
	static async findByEmail(email) {
		const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
		return rows[0] || null;
	}

	static async findByUsername(username) {
		const { rows } = await db.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
		return rows[0] || null;
	}

	static async create({ name, email, username, age, passwordHash }) {
		const { rows } = await db.query(
			`INSERT INTO users (name, email, username, age, password_hash)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id, name, email, username, age, created_at`,
			[name, email, username, age, passwordHash]
		);

		return rows[0];
	}
}

module.exports = User;
