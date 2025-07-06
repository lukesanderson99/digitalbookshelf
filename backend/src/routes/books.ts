import express from 'express';
import {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getBookStats
} from '../controllers/bookController';

const router = express.Router();

// GET /api/v1/books/stats - Get book statistics (must come before /:id)
router.get('/stats', getBookStats);

// GET /api/v1/books - Get all books
router.get('/', getAllBooks);

// GET /api/v1/books/:id - Get book by ID
router.get('/:id', getBookById);

// POST /api/v1/books - Create new book
router.post('/', createBook);

// PUT /api/v1/books/:id - Update book
router.put('/:id', updateBook);

// DELETE /api/v1/books/:id - Delete book
router.delete('/:id', deleteBook);

export default router;