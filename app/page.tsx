"use client";

import { useEffect, useState } from "react";
import BookCard from "../components/BookCard";
import AddBookModal from "../components/AddBookModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import EditBookModal from "../components/EditBookModal";
import AuthWrapper from "../components/AuthWrapper";
import RecommendationsSection from "../components/RecommendationsSection";
import { supabase } from "../lib/supabase";
import { useBookStore } from "../lib/store";
import { Plus } from 'lucide-react';

// No longer need custom backend API - using Supabase directly!

export default function Home() {
  // Get everything from the store
  const {
    books,
    loading,
    searchQuery,
    selectedCategory,
    selectedReadingStatus,
    viewMode,
    addingBook,
    showAddModal,
    showEditModal,
    showDeleteModal,
    bookToEdit,
    bookToDelete,

    // Actions
    setBooks,
    setLoading,
    setSearchQuery,
    setSelectedCategory,
    setSelectedReadingStatus,
    setViewMode,
    setAddingBook,

    // Modal actions
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,

    // Book actions
    addBook: addBookToStore,
    updateBook: updateBookInStore,
    removeBook,

    // Computed values
    getFilteredBooks,
    getCategories
  } = useBookStore()

  // State for pre-filled modal data from AI recommendations
  const [modalInitialData, setModalInitialData] = useState<any>(null);

  // Get filtered data
  const filteredBooks = getFilteredBooks()
  const categories = getCategories()

  // Load books from backend on mount
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);

      // Use Supabase instead of custom API
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading books:', error);
        alert(`Failed to load books: ${error.message}`);
        return;
      }

      setBooks(data || []);
      console.log(`✅ Loaded ${data?.length || 0} books from Supabase`);
    } catch (error: any) {
      console.error('Unexpected error loading books:', error);
      alert('Unexpected error loading books. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Add book from AI recommendation - opens modal with pre-filled data
  const handleAddBookFromRecommendation = (recommendationData: any) => {
    console.log('=== Page.tsx Debug ===');
    console.log('recommendationData:', recommendationData);
    console.log('recommendationData.cover_url:', recommendationData.cover_url);

    // Set the initial data for the modal
    setModalInitialData({
      title: recommendationData.title,
      author: recommendationData.author,
      category: recommendationData.genre,
      reading_notes: `AI recommended: ${recommendationData.reason}`,
      cover_url: recommendationData.cover_url, // Include the cover URL
    });

    // Open the modal
    openAddModal();
  };

  // Enhanced close modal function to clear initial data
  const handleCloseAddModal = () => {
    closeAddModal();
    setModalInitialData(null);
  };

  // Add book handler
  const handleAddBook = async (newBookData: any) => {
    try {
      setAddingBook(true);

      const bookData = {
        title: newBookData.title,
        author: newBookData.author,
        category: newBookData.category,
        cover_url: newBookData.cover_url || null,
        reading_status: newBookData.reading_status || 'to-read',
        progress_percentage: newBookData.progress_percentage || 0,
        date_started: newBookData.date_started || null,
        date_finished: newBookData.date_finished || null,
        reading_notes: newBookData.reading_notes || null,
      };

      // Use Supabase to add book
      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        addBookToStore(data);
        console.log(`✅ Added book: ${data.title}`);
      }

      closeAddModal();
    } catch (error: any) {
      console.error('Error adding book:', error);
      alert(`Error adding book: ${error.message}. Please try again.`);
    } finally {
      setAddingBook(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      openDeleteModal(book);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      // Use Supabase to delete book
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookToDelete.id);

      if (error) {
        throw new Error(error.message);
      }

      removeBook(bookToDelete.id);
      closeDeleteModal();
      console.log(`✅ Deleted book: ${bookToDelete.title}`);
    } catch (error: any) {
      console.error('Error deleting book:', error);
      alert(`Failed to delete book: ${error.message}`);
    }
  };

  // Edit handlers
  const handleEditClick = (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      openEditModal(book);
    }
  };

  const handleSaveEdit = async (id: string, updates: any) => {
    try {
      const updateData = {
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

      // Use Supabase to update book
      const { data, error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        updateBookInStore(id, data);
        console.log(`✅ Updated book: ${data.title}`);
      }

      closeEditModal();
    } catch (error: any) {
      console.error('Error updating book:', error);
      alert(`Error updating book: ${error.message}. Please try again.`);
    }
  };

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
              <div className="text-sm text-gray-400">Connecting to Supabase...</div>
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
          {/* Header with Backend Status - Localhost Only */}
          {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    Supabase Connected
                  </div>
                  <a
                    href={process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:3001/api/v1/analytics/dashboard'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full hover:bg-blue-500/30 transition-colors"
                  >
                    📊 Analytics
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={process.env.NEXT_PUBLIC_HEALTH_URL || 'http://localhost:3001/health'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full hover:bg-green-500/30 transition-colors"
                  >
                    ✅ API Status
                  </a>
                  <button
                    onClick={loadBooks}
                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full hover:bg-blue-500/30 transition-colors cursor-pointer"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-gray-400 hover:text-red-400 transition-all text-sm font-medium hover:bg-red-500/10 rounded-lg cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}

          {/* Modern Header with Stats */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                📚 Digital Bookshelf
              </h1>
            </div>

            {/* Statistics Cards Only */}
            <div className="flex gap-3">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-center min-w-[70px] hover:bg-white/10 transition-all duration-200">
                <div className="text-xl font-bold text-purple-400">{books.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total Books</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-center min-w-[70px] hover:bg-white/10 transition-all duration-200">
                <div className="text-xl font-bold text-orange-400">
                  {books.filter(book => book.reading_status === 'reading').length}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Reading</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-center min-w-[70px] hover:bg-white/10 transition-all duration-200">
                <div className="text-xl font-bold text-green-400">
                  {books.filter(book => book.reading_status === 'finished').length}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Finished</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-center min-w-[70px] hover:bg-white/10 transition-all duration-200">
                <div className="text-xl font-bold text-blue-400">
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
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Overall Progress</div>
              </div>
            </div>
          </div>

          {/* Search Bar and Controls Row */}
          <div className="flex justify-between items-center mb-8 gap-6 h-[52px]">
            <div className="flex-1 max-w-2xl relative h-full">
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-purple-400 text-xl pointer-events-none z-10">
                🔍
              </div>
              <input
                type="text"
                placeholder="Search your library by title or author..."
                className="w-full h-full pl-14 pr-6 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all relative shadow-xl text-lg font-medium cursor-text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={openAddModal}
              disabled={addingBook}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all flex items-center gap-3 text-base font-semibold shadow-lg hover:scale-105 border border-blue-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingBook ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Add Book
                </>
              )}
            </button>
          </div>

          {/* Secondary Controls Row */}
          <div className="flex justify-between items-center mb-10 gap-4">
            <div className="flex gap-3 items-center">
              <div className="relative">
                <select
                  value={selectedReadingStatus || ""}
                  onChange={(e) => setSelectedReadingStatus(e.target.value || null)}
                  className="px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all appearance-none cursor-pointer pr-10 text-sm font-medium"
                >
                  <option value="" className="bg-gray-800">📚 All Books</option>
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

              <div className="flex gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center text-sm font-medium cursor-pointer ${viewMode === 'grid'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  📋 Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center text-sm font-medium cursor-pointer ${viewMode === 'table'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  🗃️ Table
                </button>
              </div>
            </div>

            <div className="text-gray-400 text-sm font-medium">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedReadingStatus && ` • ${selectedReadingStatus.replace('-', ' ')}`}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="mb-12">
            <div className="flex items-center gap-6 mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Filter by Category</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm cursor-pointer ${selectedCategory === null
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                  }`}
                onClick={() => setSelectedCategory(null)}
              >
                All ({books.length})
              </button>

              {categories.map((category) => {
                const count = books.filter(book => book.category === category).length;
                return (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm cursor-pointer ${selectedCategory === category
                      ? "bg-white/15 text-white border border-white/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-white/10"
                      }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRIMARY CONTENT: YOUR BOOKS SECTION */}
          <div className="mb-16">
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
                                  className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(book.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
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

          {/* SECONDARY CONTENT: AI RECOMMENDATIONS (MOVED HERE!) */}
          {books.length >= 3 && (
            <RecommendationsSection
              books={books}
              onAddBookFromRecommendation={handleAddBookFromRecommendation}
            />
          )}

        </div>

        {/* Modals */}
        <AddBookModal
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          onAddBook={handleAddBook}
          initialData={modalInitialData}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          bookTitle={bookToDelete?.title || ""}
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteModal}
        />

        <EditBookModal
          isOpen={showEditModal}
          book={bookToEdit}
          onSave={handleSaveEdit}
          onClose={closeEditModal}
        />
      </main>
    </AuthWrapper>
  );
}