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

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Servidor corriendo en http://localhost:${port}`);
});