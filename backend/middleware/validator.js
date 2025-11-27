// ============================================
// FICHIER : backend/middleware/validator.js
// ============================================

const { ValidationError } = require('./errorHandler');

/**
 * Validation Middleware Factory
 * Creates middleware to validate request data using Zod schemas
 * 
 * @param {Object} schema - Zod schema object
 * @param {string} source - Where to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const dataToValidate = req[source];

            // Parse and validate using Zod
            const validatedData = schema.parse(dataToValidate);

            // Replace request data with validated data (with defaults applied)
            req[source] = validatedData;

            next();
        } catch (error) {
            // Handle Zod validation errors
            if (error.name === 'ZodError') {
                // Zod errors have 'issues' property
                const errorIssues = error.issues || error.errors || [];
                const formattedErrors = errorIssues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                const validationError = new ValidationError(
                    'Validation failed',
                    formattedErrors
                );

                return next(validationError);
            }

            // Pass other errors to error handler
            next(error);
        }
    };
};

/**
 * Helper to validate multiple sources at once
 */
const validateMultiple = (schemas) => {
    return async (req, res, next) => {
        try {
            const errors = [];

            for (const [source, schema] of Object.entries(schemas)) {
                try {
                    const validatedData = schema.parse(req[source]);
                    req[source] = validatedData;
                } catch (error) {
                    if (error.name === 'ZodError') {
                        const errorIssues = error.issues || error.errors || [];
                        errorIssues.forEach((err) => {
                            errors.push({
                                source,
                                field: err.path.join('.'),
                                message: err.message,
                                code: err.code,
                            });
                        });
                    }
                }
            }

            if (errors.length > 0) {
                const validationError = new ValidationError(
                    'Validation failed',
                    errors
                );
                return next(validationError);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validate,
    validateMultiple,
};
