import { useBookStore } from '../lib/store'

const mockBook = {
    id: 'test-1',
    title: 'Test Book',
    author: 'Test Author',
    category: 'Programming',
    reading_status: 'reading' as const,
    created_at: new Date().toISOString()
}

describe('Book Store', () => {
    beforeEach(() => {
        // Reset store before each test
        useBookStore.setState({
            books: [],
            searchQuery: '',
            selectedCategory: null,
            selectedReadingStatus: null
        })
    })

    test('adds a book', () => {
        const { addBook } = useBookStore.getState()

        addBook(mockBook)

        const updatedState = useBookStore.getState()
        expect(updatedState.books).toHaveLength(1)
        expect(updatedState.books[0]).toEqual(mockBook)
    })

    test('filters books by search query', () => {
        const { addBook, setSearchQuery, getFilteredBooks } = useBookStore.getState()

        addBook(mockBook)
        addBook({ ...mockBook, id: 'test-2', title: 'JavaScript Guide', author: 'Different Author' })

        setSearchQuery('JavaScript')
        const filtered = getFilteredBooks()

        expect(filtered).toHaveLength(1)
        expect(filtered[0].title).toBe('JavaScript Guide')
    })

    test('manages modal state', () => {
        const { openAddModal, closeAddModal } = useBookStore.getState()

        expect(useBookStore.getState().showAddModal).toBe(false)

        openAddModal()
        expect(useBookStore.getState().showAddModal).toBe(true)

        closeAddModal()
        expect(useBookStore.getState().showAddModal).toBe(false)
    })
})