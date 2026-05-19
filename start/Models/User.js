const db = require('../db');

class User {

	/* Permite agregar un usuario a la tabla usuarios.
	* Crea un arreglo 'rows' a partir del result.rows que se límita
	* al e-mail que coincide con el query.
	* 
	* params: 
	* Recibe los datos de registro de un usuraio.
	*
	* return:
	* los datos del usuario exceptuando la contraseña.
	*/
	static async create({ name, email, username, age, passwordHash }) {
		const { rows } = await db.query(
			`INSERT INTO users (name, email, username, age, password_hash)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id, name, email, username, age, created_at`,
			[name, email, username, age, passwordHash]
		);

		return rows[0];
	}

	/* Permite buscar un usuario por e-mail o username.
	* Crea un arreglo 'rows' a partir del result.rows que se límita
	* al e-mail o al username que coincide con el query.
	* 
	* param: 
	* Recibe un parametro identifier que se va a reemplazar en la consulta
	* 'SELECT * FROM users WHERE username = $1 OR email = $1 LIMIT 1'
	* en el lugar de $1 (para evitar inyecciones).
	*
	* return:
	* rows[0] un arreglo con las filas encontradas en caso de 
	* encontrar una coincidencia con el parametro.
	* null en caso de no encontrar ninguna coincidencia.
	*/
	static async findUserOrEmail(identifier) {
		const { rows } = await db.query(
			'SELECT * FROM users WHERE username = $1 OR email = $1 LIMIT 1', [identifier]);
		
        return rows[0] || null;
	}
}

module.exports = User;
