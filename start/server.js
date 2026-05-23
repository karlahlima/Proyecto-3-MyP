require('dotenv').config();

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('./Models/User');

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

/* Recibe datos desde el frontend (name, email, username, age, password)
* usando req.body, mediante el fetch('/register') en script.js.
*
* Verifica que no falten campos en el formulario de registro.
* Normaliza lo datos: email, username, age.
*
* 1. verifica que si la edad sea un numero o menor a 18 se mande un err.400.
* 2. Verifica si el email ya se encuentra registrado usando findUSerOrEmail de
*    USer.js.
* 3. Verifica si el usuario ya se encuentra registrado usando findUSerOrEmail de
*    User.js.
* 4. Hashea el password usando la biblioteca bcrypt.
* 5. Crea el usuario nuevo con create de User.js el cual se comunica con
*    la base de datos.
* 6. Por ultimo retorna el mensaje exitoso.
*/
app.post('/register', async (req, res) => {
	try {
		const { name, email, username, age, password } = req.body;

		if (!name || !email || !username || !age || !password) {
			return res.status(400).json({ message: 'Faltan campos obligatorios.' });
		}

		const normalizedEmail = String(email).trim().toLowerCase();
		const normalizedUsername = String(username).trim();
		const numericAge = Number(age);

		if (Number.isNaN(numericAge) || numericAge < 18) {
			return res.status(400).json({ message: 'Debes tener al menos 18 años.' });
		}

		const emailExists = await User.findUserOrEmail(normalizedEmail);
		if (emailExists) {
			return res.status(409).json({ message: 'Ese email ya está registrado.' });
		}

		const usernameExists = await User.findUserOrEmail(normalizedUsername);
		if (usernameExists) {
			return res.status(409).json({ message: 'Ese nombre de usuario ya está registrado.' });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const user = await User.create({
			name: String(name).trim(),
			email: normalizedEmail,
			username: normalizedUsername,
			age: numericAge,
			passwordHash,
		});

		return res.status(201).json({
			message: 'Usuario registrado correctamente.',
			user,
		});
	} catch (error) {
		if (error.code === '23505') {
			return res.status(409).json({ message: 'Email o usuario ya existe.' });
		}

		console.error(error);
		return res.status(500).json({ message: 'Error interno del servidor.' });
	}
});

/* Recibe datos desde el frontend (identifier, password) usando req.body,
* donde identifier puede ser: email o username,
* mediante el fetch('/register') en script.js.
*
* Verifica que no falten campos en el formulario de login.
* Normaliza lo datos: email.
*
* 1. Verifica que exista el email o username con findUserOrEmail en User.js.
* 2. Compara la contraseña ingresada con la de la base de datos.
* 3. Si los datos son correctos, limpia el passwordHash del JSON de resouesta
*    y manda el mensaje de login exitoso.
*/
app.post('/login', async (req, res) => {
	try {
		const { identifier, password } = req.body; 

		if (!identifier || !password) {
			return res.status(400).json({ message: 'Faltan campos obligatorios.' });
		}

		const idRaw = String(identifier).trim();
		const searchKey = idRaw.includes('@') ? idRaw.toLowerCase() : idRaw;

		const userRecord = await User.findUserOrEmail(searchKey);
		if (!userRecord) {
			return res.status(401).json({ message: 'Credenciales inválidas.' });
		}

		// En la BD el campo es `password_hash`
		const passwordHash = userRecord.password_hash || userRecord.passwordHash;
		const passwordMatch = await bcrypt.compare(password, passwordHash);
		if (!passwordMatch) {
			return res.status(401).json({ message: 'Credenciales inválidas.' });
		}

		const { password_hash, passwordHash: _ph, ...safeUser } = userRecord;

		return res.status(200).json({ message: 'Login exitoso.', user: safeUser });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Error interno del servidor.' });
	}
});



const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Servidor corriendo en http://localhost:${port}`);
});