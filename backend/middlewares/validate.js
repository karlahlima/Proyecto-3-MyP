const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const error = new Error(result.error.issues[0].message);
        error.name = 'ZodError';
        return next(error);
    }

    req.body = result.data;
    next();
};

module.exports = { validate };