import { create } from 'zustand'

interface Book {
    id: string
    title: string
    author: string
    category: string
    cover_url?: string | null
    reading_status: 'to-read' | 'reading' | 'finished'
    created_at: string
    progress_percentage?: number
    date_started?: string | null
    date_finished?: string | null
    reading_notes?: string | null
}

interface BookStore {
    // State
    books: Book[]
    loading: boolean
    searchQuery: string
    selectedCategory: string | null
    selectedReadingStatus: string | null
    viewMode: 'grid' | 'table'        // ← ADD THIS
    addingBook: boolean               // ← ADD THIS

    // Modal state
    showAddModal: boolean
    showEditModal: boolean
    showDeleteModal: boolean
    bookToEdit: Book | null
    bookToDelete: Book | null

    // Actions
    setBooks: (books: Book[]) => void
    setLoading: (loading: boolean) => void
    setSearchQuery: (query: string) => void
    setSelectedCategory: (category: string | null) => void
    setSelectedReadingStatus: (status: string | null) => void
    setViewMode: (mode: 'grid' | 'table') => void    // ← ADD THIS
    setAddingBook: (adding: boolean) => void         // ← ADD THIS

    // Modal actions
    openAddModal: () => void
    closeAddModal: () => void
    openEditModal: (book: Book) => void
    closeEditModal: () => void
    openDeleteModal: (book: Book) => void
    closeDeleteModal: () => void

    // Book actions
    addBook: (book: Book) => void
    updateBook: (id: string, updates: Partial<Book>) => void
    removeBook: (id: string) => void

    // Computed values
    getFilteredBooks: () => Book[]
    getCategories: () => string[]
}

export const useBookStore = create<BookStore>((set, get) => ({
    // Initial state
    books: [],
    loading: false,
    searchQuery: '',
    selectedCategory: null,
    selectedReadingStatus: null,
    viewMode: 'grid',        // ← ADD THIS
    addingBook: false,       // ← ADD THIS

    // Modal state
    showAddModal: false,
    showEditModal: false,
    showDeleteModal: false,
    bookToEdit: null,
    bookToDelete: null,

    // Basic setters
    setBooks: (books) => set({ books }),
    setLoading: (loading) => set({ loading }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
    setSelectedReadingStatus: (selectedReadingStatus) => set({ selectedReadingStatus }),
    setViewMode: (viewMode) => set({ viewMode }),        // ← ADD THIS
    setAddingBook: (addingBook) => set({ addingBook }),  // ← ADD THIS

    // Modal actions
    openAddModal: () => set({ showAddModal: true }),
    closeAddModal: () => set({ showAddModal: false }),
    openEditModal: (book) => set({ showEditModal: true, bookToEdit: book }),
    closeEditModal: () => set({ showEditModal: false, bookToEdit: null }),
    openDeleteModal: (book) => set({ showDeleteModal: true, bookToDelete: book }),
    closeDeleteModal: () => set({ showDeleteModal: false, bookToDelete: null }),

    // Book actions
    addBook: (book) => set((state) => ({
        books: [book, ...state.books]
    })),

    updateBook: (id, updates) => set((state) => ({
        books: state.books.map(book =>
            book.id === id ? { ...book, ...updates } : book
        )
    })),

    removeBook: (id) => set((state) => ({
        books: state.books.filter(book => book.id !== id)
    })),

    // Computed values
    getFilteredBooks: () => {
        const { books, searchQuery, selectedCategory, selectedReadingStatus } = get()

        return books.filter(book => {
            const matchesCategory = selectedCategory === null || book.category === selectedCategory
            const matchesSearch = searchQuery === "" ||
                book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.author.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = selectedReadingStatus === null || book.reading_status === selectedReadingStatus

            return matchesCategory && matchesSearch && matchesStatus
        })
    },

    getCategories: () => {
        const { books } = get()
        return Array.from(new Set(books.map(book => book.category)))
    }
}))