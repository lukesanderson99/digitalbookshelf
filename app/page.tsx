"use client";

import { useState, useEffect } from "react";
import BookCard from "../components/BookCard";
import AddBookForm from "../components/AddBookForm";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { supabase, Book } from "../lib/supabase";
import EditBookModal from "../components/EditBookModal";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);  // ✅ Add this
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);  // ✅ Add this

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedReadingStatus, setSelectedReadingStatus] = useState<string | null>(null);

  // Load books from Supabase on mount
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categories from current books
  const categories = Array.from(new Set(books.map(book => book.category)));

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesCategory = selectedCategory === null || book.category === selectedCategory;
    const matchesSearch = searchQuery === "" ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedReadingStatus === null || book.reading_status === selectedReadingStatus;
    return matchesCategory && matchesSearch && matchesStatus;
  });

  // Add book to database
  const handleAddBook = async (newBook: Omit<Book, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([newBook])
        .select()
        .single();

      if (error) throw error;
      setBooks([data, ...books]);
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  // Show delete confirmation modal
  const handleDeleteClick = (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      setBookToDelete(book);
      setShowDeleteModal(true);
    }
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookToDelete.id);

      if (error) throw error;
      setBooks(books.filter(book => book.id !== bookToDelete.id));

      // Close modal
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setBookToDelete(null);
  };

  // Show edit modal
  const handleEditClick = (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      setBookToEdit(book);
      setShowEditModal(true);
    }
  };

  // Save edited book
  const handleSaveEdit = async (id: string, updates: Partial<Book>) => {
    try {
      const { error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setBooks(books.map(book =>
        book.id === id ? { ...book, ...updates } : book
      ));

      // Close modal
      setShowEditModal(false);
      setBookToEdit(null);
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setShowDeleteModal(false);
    setBookToEdit(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading your bookshelf...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header with Stats */}
        <div className="flex justify-between items-center mb-10">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Digital Bookshelf
            </h1>
          </div>

          {/* Statistics Cards - Compact */}
          <div className="flex gap-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 text-center min-w-[60px]">
              <div className="text-lg font-bold text-purple-400">{books.length}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Total Books</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 text-center min-w-[60px]">
              <div className="text-lg font-bold text-orange-400">
                {books.filter(book => book.reading_status === 'reading').length}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Reading</div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 text-center min-w-[60px]">
              <div className="text-lg font-bold text-green-400">
                {books.filter(book => book.reading_status === 'finished').length}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Finished</div>
            </div>

            {/* Overall Progress Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 text-center min-w-[60px]">
              <div className="text-lg font-bold text-blue-400">
                {books.length > 0
                  ? Math.round(
                    books.reduce((sum, book) => {
                      // Explicitly handle each status
                      switch (book.reading_status) {
                        case 'finished':
                          return sum + 100;
                        case 'reading':
                          return sum + (book.progress_percentage || 0);
                        case 'to-read':
                        default:
                          return sum + 0;
                      }
                    }, 0) / books.length
                  )
                  : 0}%
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Overall Progress</div>
            </div>
          </div>
        </div>

        <AddBookForm onAddBook={handleAddBook} />

        {/* Search Bar and View Toggle Row */}
        <div className="flex justify-between items-center mb-6 gap-6">
          <div className="flex-1 max-w-md relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg pointer-events-none z-10">
              🔍
            </div>
            <input
              type="text"
              placeholder="Search books by title or author..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all relative"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Controls Row */}
          <div className="flex gap-3 items-center">
            {/* Reading Status Filter */}
            <div className="relative">
              <select
                value={selectedReadingStatus || ""}
                onChange={(e) => setSelectedReadingStatus(e.target.value || null)}
                className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="" className="bg-gray-800">📚 All</option>
                <option value="to-read" className="bg-gray-800">⏳ To Read</option>
                <option value="reading" className="bg-gray-800">📖 Reading</option>
                <option value="finished" className="bg-gray-800">✅ Finished</option>
              </select>
              {/* Custom Arrow */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                📋
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-lg transition-all ${viewMode === 'table'
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                🗃️
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="mb-10 flex flex-wrap gap-3">
          <button
            className={`px-4 py-2 rounded-2xl font-medium transition-all duration-200 ${selectedCategory === null
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
              : "bg-white/5 backdrop-blur-xl border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            onClick={() => setSelectedCategory(null)}
          >
            All Books
          </button>

          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-2xl font-medium transition-all duration-200 ${selectedCategory === category
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-white/5 backdrop-blur-xl border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Books Display - Grid or Table */}
        {viewMode === 'grid' ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
                category={book.category}
                reading_status={book.reading_status}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
                // 🆕 Pass progress tracking data
                progress_percentage={book.progress_percentage}
                date_started={book.date_started}
                date_finished={book.date_finished}
                reading_notes={book.reading_notes}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-gray-300">Title</th>
                  <th className="text-left p-4 text-gray-300">Author</th>
                  <th className="text-left p-4 text-gray-300">Category</th>
                  <th className="text-left p-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-medium">{book.title}</td>
                    <td className="p-4 text-gray-300">{book.author}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {book.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(book.id)}
                          className="text-green-400 hover:text-green-300 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteClick(book.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        bookTitle={bookToDelete?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Edit Book Modal */}
      <EditBookModal
        isOpen={showEditModal}
        book={bookToEdit}
        onSave={handleSaveEdit}
        onClose={handleCancelEdit}
      />
    </main>
  );
}