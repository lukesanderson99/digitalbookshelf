"use client";

import { useState, useEffect } from "react";
import BookCard from "../components/BookCard";
import AddBookModal from "../components/AddBookModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import EditBookModal from "../components/EditBookModal";
import AuthWrapper from "../components/AuthWrapper";
import { supabase, Book } from "../lib/supabase";
import {
  fetchBooks,
  addBook,
  deleteBook,
  updateBook,
  CreateBookData,
  UpdateBookData
} from "../lib/database";
import { Plus } from 'lucide-react';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBook, setAddingBook] = useState(false);

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedReadingStatus, setSelectedReadingStatus] = useState<string | null>(null);

  // Load books from database on mount
  useEffect(() => {
    loadBooks();
  }, []);

  // Load books using new database function
  const loadBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await fetchBooks();

      if (error) {
        console.error('Error loading books:', error);
        return;
      }

      setBooks(data || []);
    } catch (error) {
      console.error('Unexpected error loading books:', error);
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

  // Add book using new database function
  const handleAddBook = async (newBookData: Omit<Book, "id" | "created_at">) => {
    try {
      setAddingBook(true);

      // Create book data with proper typing
      const bookData: CreateBookData = {
        title: newBookData.title,
        author: newBookData.author,
        category: newBookData.category,
        cover_url: newBookData.cover_url || null,
        reading_status: newBookData.reading_status,
        progress_percentage: newBookData.progress_percentage || 0,
        date_started: newBookData.date_started || null,
        date_finished: newBookData.date_finished || null,
        reading_notes: newBookData.reading_notes || null,
      };

      const { data, error } = await addBook(bookData);

      if (error) {
        throw new Error(error);
      }

      if (data) {
        // Add the new book to the beginning of the list
        setBooks([data, ...books]);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Error adding book. Please try again.');
    } finally {
      setAddingBook(false);
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

  // Confirm deletion using new database function
  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      const { error } = await deleteBook(bookToDelete.id);

      if (error) {
        throw new Error(error);
      }

      // Remove book from local state
      setBooks(books.filter(book => book.id !== bookToDelete.id));

      // Close modal
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book. Please try again.');
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

  // Save edited book using new database function
  const handleSaveEdit = async (id: string, updates: Partial<Book>) => {
    try {
      // Create update data with proper typing
      const updateData: UpdateBookData = {
        title: updates.title,
        author: updates.author,
        category: updates.category,
        cover_url: updates.cover_url,
        reading_status: updates.reading_status,
        progress_percentage: updates.progress_percentage,
        date_started: updates.date_started,
        date_finished: updates.date_finished,
        reading_notes: updates.reading_notes,
      };

      const { data, error } = await updateBook(id, updateData);

      if (error) {
        throw new Error(error);
      }

      // Update local state with the returned data
      if (data) {
        setBooks(books.map(book =>
          book.id === id ? data : book
        ));
      }

      // Close modal
      setShowEditModal(false);
      setBookToEdit(null);
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Error updating book. Please try again.');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setBookToEdit(null);
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AuthWrapper>
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <div className="text-xl">Loading your bookshelf...</div>
            </div>
          </div>
        </main>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header with Stats and Logout */}
          <div className="flex justify-between items-center mb-10">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Digital Bookshelf
              </h1>
            </div>

            {/* Statistics Cards and Logout Button */}
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

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30 ml-4"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search Bar and Controls Row - ALL SAME HEIGHT */}
          <div className="flex justify-between items-center mb-6 gap-6 h-[48px]">
            <div className="flex-1 max-w-md relative h-full">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg pointer-events-none z-10">
                🔍
              </div>
              <input
                type="text"
                placeholder="Search books by title or author..."
                className="w-full h-full pl-12 pr-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all relative"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Controls Row */}
            <div className="flex gap-3 items-center h-full">
              {/* Reading Status Filter */}
              <div className="relative h-full">
                <select
                  value={selectedReadingStatus || ""}
                  onChange={(e) => setSelectedReadingStatus(e.target.value || null)}
                  className="h-full px-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer pr-10"
                >
                  <option value="" className="bg-gray-800">📚 All</option>
                  <option value="to-read" className="bg-gray-800">⏳ To Read</option>
                  <option value="reading" className="bg-gray-800">📖 Reading</option>
                  <option value="finished" className="bg-gray-800">✅ Finished</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1 h-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg transition-all h-full flex items-center ${viewMode === 'grid'
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  📋
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-lg transition-all h-full flex items-center ${viewMode === 'table'
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  🗃️
                </button>
              </div>

              {/* Add Book Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-blue-500 flex items-center gap-2 text-sm font-medium h-full"
              >
                <Plus size={16} />
                Add Book
              </button>
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
              All Books ({books.length})
            </button>

            {categories.map((category) => {
              const count = books.filter(book => book.category === category).length;
              return (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-2xl font-medium transition-all duration-200 ${selectedCategory === category
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                    : "bg-white/5 backdrop-blur-xl border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>

          {/* Books Display - Grid or Table */}
          {filteredBooks.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-white mb-2">
                {books.length === 0 ? 'Your library is empty' : 'No books match your filters'}
              </h3>
              <p className="text-gray-400">
                {books.length === 0
                  ? 'Click "Add Book" to get started!'
                  : 'Try adjusting your search or category filters.'
                }
              </p>
            </div>
          ) : (
            <>
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
                      coverUrl={book.cover_url || undefined}
                      onDelete={handleDeleteClick}
                      onEdit={handleEditClick}
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
                        <th className="text-left p-4 text-gray-300">Cover</th>
                        <th className="text-left p-4 text-gray-300">Title</th>
                        <th className="text-left p-4 text-gray-300">Author</th>
                        <th className="text-left p-4 text-gray-300">Category</th>
                        <th className="text-left p-4 text-gray-300">Status</th>
                        <th className="text-left p-4 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr key={book.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="w-8 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center text-xs overflow-hidden">
                              {book.cover_url ? (
                                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                              ) : (
                                '📖'
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-white font-medium">{book.title}</td>
                          <td className="p-4 text-gray-300">{book.author}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                              {book.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${book.reading_status === 'finished' ? 'bg-green-500/20 text-green-300' :
                              book.reading_status === 'reading' ? 'bg-orange-500/20 text-orange-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                              {book.reading_status === 'finished' ? '✅ Done' :
                                book.reading_status === 'reading' ? '📖 Reading' :
                                  '📚 To Read'}
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
            </>
          )}
        </div>

        {/* Add Book Modal */}
        <AddBookModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddBook={handleAddBook}
        />

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
    </AuthWrapper>
  );
}