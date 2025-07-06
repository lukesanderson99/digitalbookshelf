import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('❌ Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { ...error, message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === '11000') {
        const message = 'Duplicate field value entered';
        error = { ...error, message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = 'Validation Error';
        error = { ...error, message, statusCode: 400 };
    }

    // Prisma errors
    if (err.code === 'P2002') {
        const message = 'Unique constraint violation';
        error = { ...error, message, statusCode: 400 };
    }

    if (err.code === 'P2025') {
        const message = 'Record not found';
        error = { ...error, message, statusCode: 404 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: {
            message: error.message || 'Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
};