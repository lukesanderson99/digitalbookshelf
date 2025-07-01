"use client";

import { useState, useRef, useEffect } from "react";

interface AddBookFormProps {
  onAddBook: (book: Omit<Book, "id" | "created_at">) => void;
}

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  cover_url?: string | null;
  reading_status: 'to-read' | 'reading' | 'finished';
  created_at: string;
  progress_percentage?: number;
  date_started?: string | null;
  date_finished?: string | null;
  reading_notes?: string | null;
}

// Google Books search function
const searchGoogleBooks = async (query: string) => {
  if (query.length < 3) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&orderBy=relevance`
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    return data.items?.map((book: any) => ({
      googleBooksId: book.id,
      title: book.volumeInfo.title || 'Unknown Title',
      author: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
      category: book.volumeInfo.categories?.[0] || 'Unknown',
      description: book.volumeInfo.description || '',
      coverUrl: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      pageCount: book.volumeInfo.pageCount || null,
      publishedDate: book.volumeInfo.publishedDate || null,
      publisher: book.volumeInfo.publisher || null
    })) || [];
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return [];
  }
};

export default function AddBookForm({ onAddBook }: AddBookFormProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [readingStatus, setReadingStatus] = useState<'to-read' | 'reading' | 'finished'>('to-read');

  // Progress tracking
  const [dateStarted, setDateStarted] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [readingNotes, setReadingNotes] = useState("");

  // Google Books search state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false); // Track if we have results to show
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown container

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search function
  const handleTitleSearch = (value: string) => {
    setTitle(value);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer to search after 500ms of no typing
    debounceTimer.current = setTimeout(async () => {
      if (value.length >= 3) {
        setIsSearching(true);
        const results = await searchGoogleBooks(value);
        setSearchResults(results);
        setHasSearchResults(results.length > 0);
        setShowDropdown(results.length > 0);
        setIsSearching(false);
      } else {
        setShowDropdown(false);
        setSearchResults([]);
        setHasSearchResults(false);
      }
    }, 500);
  };

  // Handle input focus - show dropdown if we have results
  const handleInputFocus = () => {
    if (hasSearchResults && title.length >= 3) {
      setShowDropdown(true);
    }
  };

  // Handle book selection from dropdown
  const handleBookSelect = (selectedBook: any) => {
    setTitle(selectedBook.title);
    setAuthor(selectedBook.author);
    setCategory(selectedBook.category);
    setShowDropdown(false);
    setSearchResults([]);
    setHasSearchResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !category) return;

    const newBook = {
      title,
      author,
      category,
      reading_status: readingStatus,
      // Add progress tracking fields
      progress_percentage: readingStatus === 'reading' ? progressPercentage : readingStatus === 'finished' ? 100 : 0,
      date_started: readingStatus !== 'to-read' && dateStarted ? dateStarted : null,
      date_finished: readingStatus === 'finished' && dateStarted ? new Date().toISOString().split('T')[0] : null,
      reading_notes: readingNotes || null,
    };

    onAddBook(newBook);

    // Reset all fields
    setTitle("");
    setAuthor("");
    setCategory("");
    setReadingStatus('to-read');
    setDateStarted("");
    setProgressPercentage(0);
    setReadingNotes("");
    setSearchResults([]);
    setShowDropdown(false);
    setHasSearchResults(false);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 relative z-[100]">
      {/* Subtle top border accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-sm">
          +
        </div>
        <h2 className="text-xl font-semibold text-white">Add New Book</h2>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Main Fields Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Title Input with Search */}
          <div className="md:col-span-3 relative z-[200]" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              placeholder="Start typing book title..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={title}
              onChange={(e) => handleTitleSearch(e.target.value)}
              onFocus={handleInputFocus}
            />

            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute right-3 top-11 text-purple-400 z-10">
                <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            )}

            {/* Google Books Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-xl border border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-[9999]">
                {searchResults.map((book) => (
                  <button
                    key={book.googleBooksId}
                    type="button"
                    onClick={() => handleBookSelect(book)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 flex items-start gap-3"
                  >
                    {book.coverUrl && (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-8 h-12 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{book.title}</div>
                      <div className="text-sm text-gray-400 truncate">by {book.author}</div>
                      <div className="text-xs text-purple-400">{book.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Author Input */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Author
            </label>
            <input
              type="text"
              placeholder="Author name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* Category Input */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <input
              type="text"
              placeholder="Fiction, Programming, etc."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {/* Reading Status Dropdown */}
          <div className="relative md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <div className="relative">
              <select
                value={readingStatus}
                onChange={(e) => setReadingStatus(e.target.value as 'to-read' | 'reading' | 'finished')}
                className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
              >
                <option value="to-read" className="bg-gray-800">📚 To Read</option>
                <option value="reading" className="bg-gray-800">📖 Reading</option>
                <option value="finished" className="bg-gray-800">✅ Finished</option>
              </select>
              {/* Custom Arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-end md:col-span-1">
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full h-12 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 flex items-center justify-center text-lg"
              title="Add Book"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Progress Tracking Fields - Only show when relevant */}
        {(readingStatus === 'reading' || readingStatus === 'finished') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-sm font-medium text-gray-300 mb-2 md:col-span-2">
              📊 Progress Tracking
            </div>

            {/* Date Started */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date Started
              </label>
              <input
                type="date"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Progress Percentage - only for "reading" */}
            {readingStatus === 'reading' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Progress: {progressPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progressPercentage}%, rgba(255,255,255,0.1) ${progressPercentage}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Reading Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                placeholder="Add any notes about this book..."
                rows={3}
                value={readingNotes}
                onChange={(e) => setReadingNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}