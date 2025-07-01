import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export interface Book {
  id: string
  title: string
  author: string
  category: string
  cover_url?: string | null
  reading_status: 'to-read' | 'reading' | 'finished'  // Add this line
  created_at: string
  progress_percentage?: number;
  date_started?: string | null;
  date_finished?: string | null;
  reading_notes?: string | null;
}