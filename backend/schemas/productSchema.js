const { z } = require('zod');

const createProductSchema = z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
    description: z.string().optional(),
    price: z.coerce.number({ invalid_type_error: 'El precio debe ser un número.' })
        .positive('El precio debe ser mayor a 0.'),
    category: z.string().optional(),
    stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo.').optional(),
    image_url: z.string().url('La URL de la imagen no es válida.').optional().or(z.literal('')),
});

const updateProductSchema = createProductSchema.partial();

module.exports = { createProductSchema, updateProductSchema };