require('dotenv').config();

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('./Models/User');

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

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, username, age, password } = req.body;

    if (!name || !email || !age || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    const finalUsername = username
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

    const token = signToken(user);
    return res.status(201).json({ message: 'Usuario registrado correctamente.', token, user });
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
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const passwordHash  = userRecord.password_hash || userRecord.passwordHash;
    const passwordMatch = await bcrypt.compare(password, passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const { password_hash, ...safeUser } = userRecord;
    const token = signToken(safeUser);
    return res.status(200).json({ message: 'Login exitoso.', token, user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend corriendo en puerto ${port}`));
