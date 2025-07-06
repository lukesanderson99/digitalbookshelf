import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

// Middleware
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(express.json());

// Routes directly in server (no separate route files for now)
app.get('/', (req, res) => {
    res.json({
        message: '📚 Digital Bookshelf Backend API',
        version: 'v1',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', async (req, res) => {
    try {
        // Test database connection
        const { data, error } = await supabase.from('books').select('count', { count: 'exact' });
        res.json({
            status: 'OK',
            database: error ? 'Disconnected' : 'Connected',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    } catch (err) {
        res.json({
            status: 'OK',
            database: 'Error',
            timestamp: new Date().toISOString(),
            port: PORT
        });
    }
});

// Get all books
app.get('/api/v1/books', async (req, res) => {
    try {
        console.log('📚 Fetching all books...');

        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ Found ${data.length} books`);
        res.json({
            success: true,
            data: data,
            count: data.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('❌ Error fetching books:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch books',
            message: error.message
        });
    }
});

// Get book stats
app.get('/api/v1/books/stats', async (req, res) => {
    try {
        console.log('📊 Calculating book statistics...');

        const { data, error } = await supabase
            .from('books')
            .select('category');

        if (error) throw error;

        const stats = {
            totalBooks: data.length,
            categories: {} as Record<string, number>,
            topCategories: [] as Array<{ category: string; count: number }>
        };

        // Count books by category
        data.forEach(book => {
            stats.categories[book.category] = (stats.categories[book.category] || 0) + 1;
        });

        // Get top 5 categories
        stats.topCategories = Object.entries(stats.categories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));

        console.log(`✅ Stats calculated: ${stats.totalBooks} books`);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('❌ Error calculating stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate statistics',
            message: error.message
        });
    }
});

// Create new book
app.post('/api/v1/books', async (req, res) => {
    try {
        const { title, author, category, cover_url } = req.body;
        console.log(`📝 Creating new book: ${title} by ${author}`);

        if (!title || !author || !category) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, author, category'
            });
        }

        const { data, error } = await supabase
            .from('books')
            .insert([{
                title: title.trim(),
                author: author.trim(),
                category: category.trim(),
                cover_url: cover_url || null
            }])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Created book: ${data.title}`);
        res.status(201).json({
            success: true,
            data: data,
            message: 'Book created successfully'
        });
    } catch (error: any) {
        console.error('❌ Error creating book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create book',
            message: error.message
        });
    }
});

// Delete book
app.delete('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting book with ID: ${id}`);

        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log(`✅ Deleted book with ID: ${id}`);
        res.json({
            success: true,
            message: 'Book deleted successfully'
        });
    } catch (error: any) {
        console.error('❌ Error deleting book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete book',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log('🚀 Starting Digital Bookshelf Backend...');
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 Books API: http://localhost:${PORT}/api/v1/books`);
    console.log(`📈 Stats API: http://localhost:${PORT}/api/v1/books/stats`);

    // Test database connection
    try {
        const { data, error } = await supabase.from('books').select('count', { count: 'exact' });
        if (error) throw error;
        console.log('✅ Database connected successfully');
        console.log('✅ Backend ready to serve requests!');
    } catch (error: any) {
        console.log('⚠️ Backend running but database connection failed:', error.message);
    }
});