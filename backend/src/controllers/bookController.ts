import { Request, Response } from 'express';
import { supabase, Book } from '../utils/database';

// Get all books
export const getAllBooks = async (req: Request, res: Response) => {
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
};

// Get book by ID
export const getBookById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`📖 Fetching book with ID: ${id}`);

        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Book not found'
                });
            }
            throw error;
        }

        console.log(`✅ Found book: ${data.title}`);
        res.json({
            success: true,
            data: data
        });
    } catch (error: any) {
        console.error('❌ Error fetching book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch book',
            message: error.message
        });
    }
};

// Create new book
export const createBook = async (req: Request, res: Response) => {
    try {
        const { title, author, category, cover_url } = req.body;
        console.log(`📝 Creating new book: ${title} by ${author}`);

        // Validate required fields
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

        console.log(`✅ Created book: ${data.title} (ID: ${data.id})`);
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
};

// Update book
export const updateBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, author, category, cover_url } = req.body;
        console.log(`✏️ Updating book with ID: ${id}`);

        const updateData: Partial<Book> = {};
        if (title) updateData.title = title.trim();
        if (author) updateData.author = author.trim();
        if (category) updateData.category = category.trim();
        if (cover_url !== undefined) updateData.cover_url = cover_url;

        const { data, error } = await supabase
            .from('books')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Book not found'
                });
            }
            throw error;
        }

        console.log(`✅ Updated book: ${data.title}`);
        res.json({
            success: true,
            data: data,
            message: 'Book updated successfully'
        });
    } catch (error: any) {
        console.error('❌ Error updating book:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update book',
            message: error.message
        });
    }
};

// Delete book
export const deleteBook = async (req: Request, res: Response) => {
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
};

// Get book statistics
export const getBookStats = async (req: Request, res: Response) => {
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

        console.log(`✅ Stats calculated: ${stats.totalBooks} books across ${Object.keys(stats.categories).length} categories`);
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
};