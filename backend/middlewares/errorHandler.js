const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.name === 'ZodError') {
        return res.status(400).json({ message: err.issues[0].message });
    }

    if (err.code === '23505') { // Violación de restricción UNIQUE en PostgreSQL
        return res.status(409).json({ message: 'El recurso ya existe.' });
    }

    res.status(500).json({ message: 'Error interno del servidor.' });
};

module.exports = errorHandler;