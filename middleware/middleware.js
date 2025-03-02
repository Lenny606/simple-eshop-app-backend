export const errorMiddleware = (err, req, res, next) => {
    try {
        let error = { ...err };
        error.message = err.message;
        
        // Log error in development mode
        if (process.env.NODE_ENV === 'development') {
            console.error('Error:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
        } else {
            console.error('Error:', err.message);
        }

        // Handle CastError (invalid MongoDB ObjectId)
        if (err.name === "CastError") {
            error = {
                message: "Resource not found",
                status: 404,
                code: 'RESOURCE_NOT_FOUND',
                details: { field: err.path }
            };
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
            error = {
                message: `Duplicate entry found`,
                status: 400,
                code: 'DUPLICATE_ENTRY',
                details: {
                    fields: Object.keys(err.keyPattern),
                    value: err.keyValue
                }
            };
        }

        // Handle validation errors
        if (err.name === "ValidationError") {
            const details = Object.entries(err.errors).map(([field, error]) => ({
                field,
                message: error.message,
                type: error.kind
            }));

            error = {
                message: 'Validation failed',
                status: 400,
                code: 'VALIDATION_ERROR',
                details
            };
        }

        // Handle JWT errors
        if (err.name === "JsonWebTokenError") {
            error = {
                message: 'Invalid token',
                status: 401,
                code: 'INVALID_TOKEN'
            };
        }

        if (err.name === "TokenExpiredError") {
            error = {
                message: 'Token expired',
                status: 401,
                code: 'TOKEN_EXPIRED'
            };
        }

        // Send response
        const status = error.status || 500;
        const response = {
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: error.code || 'INTERNAL_SERVER_ERROR',
                ...(error.details && { details: error.details }),
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        };

        res.status(status).json(response);
    } catch (err) {
        // If error handling itself fails, send a basic 500 response
        console.error('Error in error handler:', err);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR'
            }
        });
    }
}