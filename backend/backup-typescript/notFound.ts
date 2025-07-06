import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: {
            message: error.message,
            availableRoutes: [
                'GET /health',
                'GET /api/v1/books',
                'POST /api/v1/books',
                'GET /api/v1/analytics'
            ]
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
};