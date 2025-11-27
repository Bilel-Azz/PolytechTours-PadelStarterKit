// ============================================
// FICHIER : backend/utils/response.js
// ============================================

/**
 * Standard Success Response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Created Response (201)
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
    return successResponse(res, data, message, 201);
};

/**
 * No Content Response (204)
 */
const noContentResponse = (res) => {
    return res.status(204).send();
};

/**
 * Paginated Response
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    });
};

/**
 * Error Response (manual - normally handled by errorHandler middleware)
 */
const errorResponse = (res, message, statusCode = 500, errorCode = 'ERROR') => {
    return res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
        },
    });
};

/**
 * Parse pagination params from query
 */
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

module.exports = {
    successResponse,
    createdResponse,
    noContentResponse,
    paginatedResponse,
    errorResponse,
    getPaginationParams,
};
