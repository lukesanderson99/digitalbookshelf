// lib/database.ts - All database operations for books
import { supabase, Book } from './supabase';

export interface CreateBookData {
    title: string;
    author: string;
    category: string;
    cover_url?: string | null;
    reading_status: 'to-read' | 'reading' | 'finished';
    progress_percentage?: number;
    date_started?: string | null;
    date_finished?: string | null;
    reading_notes?: string | null;
}

export interface UpdateBookData {
    title?: string;
    author?: string;
    category?: string;
    cover_url?: string | null;
    reading_status?: 'to-read' | 'reading' | 'finished';
    progress_percentage?: number;
    date_started?: string | null;
    date_finished?: string | null;
    reading_notes?: string | null;
}

// Fetch all books for the current user
export async function fetchBooks(): Promise<{ data: Book[] | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error fetching books:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected error fetching books:', error);
        return { data: null, error };
    }
}

// Add a new book
export async function addBook(bookData: CreateBookData): Promise<{ data: Book | null; error: any }> {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: 'User not authenticated' };
        }

        // Insert book with all fields including cover_url
        const { data, error } = await supabase
            .from('books')
            .insert([
                {
                    title: bookData.title,
                    author: bookData.author,
                    category: bookData.category,
                    cover_url: bookData.cover_url || null,
                    reading_status: bookData.reading_status,
                    progress_percentage: bookData.progress_percentage || 0,
                    date_started: bookData.date_started || null,
                    date_finished: bookData.date_finished || null,
                    reading_notes: bookData.reading_notes || null,
                    user_id: user.id
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Database error adding book:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected error adding book:', error);
        return { data: null, error };
    }
}

// Update an existing book
export async function updateBook(bookId: string, updates: UpdateBookData): Promise<{ data: Book | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('books')
            .update(updates)
            .eq('id', bookId)
            .select()
            .single();

        if (error) {
            console.error('Database error updating book:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected error updating book:', error);
        return { data: null, error };
    }
}

// Delete a book
export async function deleteBook(bookId: string): Promise<{ error: any }> {
    try {
        // First, get the book to check if it has a cover image
        const { data: book } = await supabase
            .from('books')
            .select('cover_url')
            .eq('id', bookId)
            .single();

        // Delete the book from database
        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);

        if (error) {
            console.error('Database error deleting book:', error);
            return { error };
        }

        // If book had a custom uploaded cover (not from Google Books), delete it from storage
        if (book?.cover_url && book.cover_url.includes('supabase')) {
            await deleteBookCover(book.cover_url);
        }

        return { error: null };
    } catch (error) {
        console.error('Unexpected error deleting book:', error);
        return { error };
    }
}

// Delete book cover from storage
export async function deleteBookCover(imageUrl: string): Promise<{ error: any }> {
    try {
        // Extract filename from Supabase storage URL
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];

        // Only delete if it's actually a file in our storage
        if (filename && filename.startsWith('book-cover-')) {
            const { error } = await supabase.storage
                .from('book-covers')
                .remove([filename]);

            if (error) {
                console.error('Storage error deleting cover:', error);
                return { error };
            }
        }

        return { error: null };
    } catch (error) {
        console.error('Unexpected error deleting book cover:', error);
        return { error };
    }
}

// Update book progress (useful for reading tracking)
export async function updateBookProgress(
    bookId: string,
    progressPercentage: number,
    dateStarted?: string | null
): Promise<{ data: Book | null; error: any }> {
    try {
        const updates: UpdateBookData = {
            progress_percentage: progressPercentage,
        };

        // If starting to read, set date and status
        if (progressPercentage > 0 && dateStarted) {
            updates.date_started = dateStarted;
            updates.reading_status = 'reading';
        }

        // If finished reading, set date and status
        if (progressPercentage >= 100) {
            updates.reading_status = 'finished';
            updates.date_finished = new Date().toISOString().split('T')[0];
            updates.progress_percentage = 100;
        }

        return await updateBook(bookId, updates);
    } catch (error) {
        console.error('Error updating book progress:', error);
        return { data: null, error };
    }
}

// Get books by status (useful for filtering)
export async function getBooksByStatus(status: 'to-read' | 'reading' | 'finished'): Promise<{ data: Book[] | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('reading_status', status)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error fetching books by status:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected error fetching books by status:', error);
        return { data: null, error };
    }
}

// Get books by category
export async function getBooksByCategory(category: string): Promise<{ data: Book[] | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error fetching books by category:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected error fetching books by category:', error);
        return { data: null, error };
    }
}

// Search books by title or author
export async function searchBooks(query: string): Promise<{ data: Book[] | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error searching books:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Unexpected error searching books:', error);
        return { data: null, error };
    }
}