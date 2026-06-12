const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').max(100),
    email: z.string().email('El formato del correo electrónico no es válido.'),
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').max(50).optional(),
    age: z.coerce.number({ invalid_type_error: 'La edad debe ser un número.' })
        .int('La edad debe ser un número entero.')
        .min(18, 'Debes tener al menos 18 años.')
        .max(120, 'La edad ingresada no es válida.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

const loginSchema = z.object({
    email: z.string().email('El formato del correo electrónico no es válido.').optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, 'La contraseña es obligatoria.'),
}).refine(data => data.email || data.identifier, {
    message: 'Debes proporcionar email o identifier.',
    path: ['email']
});

module.exports = { registerSchema, loginSchema };