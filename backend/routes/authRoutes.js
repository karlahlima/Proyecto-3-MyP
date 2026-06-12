const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../schemas/authSchema');

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
    const { name, email, username, age, password } = req.body;

    const finalUsername = username
        ? String(username).trim()
        : String(email).split('@')[0].trim();
    const normalizedEmail = String(email).trim().toLowerCase();

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
        age,
        passwordHash,
    });

    return res.status(201).json({ message: 'Usuario registrado correctamente.', token: signToken(user), user });
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
    const { email, password, identifier } = req.body;
    const searchKey = String(email || identifier || '').trim().toLowerCase();

    const userRecord = await User.findUserOrEmail(searchKey);
    if (!userRecord) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const passwordHash = userRecord.password_hash || userRecord.passwordHash;
    const passwordMatch = await bcrypt.compare(password, passwordHash);
    if (!passwordMatch) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const { password_hash, ...safeUser } = userRecord;
    return res.status(200).json({ message: 'Login exitoso.', token: signToken(safeUser), user: safeUser });
}));

module.exports = router;