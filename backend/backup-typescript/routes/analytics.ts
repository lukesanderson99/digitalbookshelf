import express from 'express';

const router = express.Router();

// GET /api/v1/analytics/overview
router.get('/overview', (req, res) => {
    res.json({
        success: true,
        message: 'Analytics endpoint working!',
        data: {
            totalBooks: 0,
            booksReading: 0,
            booksFinished: 0,
            overallProgress: 0
        },
        timestamp: new Date().toISOString()
    });
});

export default router;