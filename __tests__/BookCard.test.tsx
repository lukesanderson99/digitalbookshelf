import { render, screen, fireEvent } from '@testing-library/react'
import BookCard from '../components/BookCard'

// Mock book data for testing
const mockBook = {
    id: 'test-id-123',
    title: 'Test Book Title',
    author: 'Test Author',
    category: 'Programming',
    reading_status: 'reading' as const,
    coverUrl: 'https://example.com/cover.jpg',
    progress_percentage: 45,
    date_started: '2024-01-01',
    date_finished: null,
    reading_notes: 'This is a great book about testing!'
}

describe('BookCard Component', () => {
    // Test 1: Basic rendering
    test('renders book title and author', () => {
        render(
            <BookCard
                id={mockBook.id}
                title={mockBook.title}
                author={mockBook.author}
                category={mockBook.category}
                reading_status={mockBook.reading_status}
            />
        )

        expect(screen.getByText('Test Book Title')).toBeInTheDocument()
        expect(screen.getByText('Test Author')).toBeInTheDocument()
    })

    // Test 2: Category display
    test('displays correct category', () => {
        render(
            <BookCard
                id={mockBook.id}
                title={mockBook.title}
                author={mockBook.author}
                category={mockBook.category}
                reading_status={mockBook.reading_status}
            />
        )

        expect(screen.getByText(/Programming/)).toBeInTheDocument()
    })

    // Test 3: Reading status
    test('shows correct reading status badge', () => {
        render(
            <BookCard
                id={mockBook.id}
                title={mockBook.title}
                author={mockBook.author}
                category={mockBook.category}
                reading_status="finished"
            />
        )

        expect(screen.getByText('✅ Done')).toBeInTheDocument()
    })

    // Test 4: Progress display for reading books
    test('shows progress bar for books being read', () => {
        render(
            <BookCard
                id={mockBook.id}
                title={mockBook.title}
                author={mockBook.author}
                category={mockBook.category}
                reading_status="reading"
                progress_percentage={45}
            />
        )

        expect(screen.getByText('45%')).toBeInTheDocument()
        expect(screen.getByText('Progress')).toBeInTheDocument()
    })

    // Test 5: Button interactions
    test('calls onDelete when delete button is clicked', () => {
        const mockOnDelete = jest.fn()

        render(
            <BookCard
                id={mockBook.id}
                title={mockBook.title}
                author={mockBook.author}
                category={mockBook.category}
                reading_status={mockBook.reading_status}
                onDelete={mockOnDelete}
            />
        )

        // Need to hover first to show the buttons
        const card = screen.getByText('Test Book Title').closest('div')
        fireEvent.mouseEnter(card!)

        const deleteButton = screen.getByTitle('Delete book')
        fireEvent.click(deleteButton)

        expect(mockOnDelete).toHaveBeenCalledWith('test-id-123')
    })
})