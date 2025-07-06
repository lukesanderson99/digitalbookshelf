import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

console.log('✅ Supabase credentials loaded successfully');
export const supabase = createClient(supabaseUrl, supabaseKey);

// TypeScript interface for your books
export interface Book {
    id: string;
    title: string;
    author: string;
    category: string;
    cover_url?: string | null;
    created_at: string;
}

// Test database connection
export const testConnection = async (): Promise<boolean> => {
    try {
        const { data, error } = await supabase.from('books').select('count', { count: 'exact' });
        if (error) throw error;
        console.log('✅ Database connected successfully');
        return true;
    } catch (error: any) {
        console.log('❌ Database connection failed:', error.message);
        return false;
    }
};