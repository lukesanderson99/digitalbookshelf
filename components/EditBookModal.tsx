"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, User, Tag, Calendar, BookOpen } from 'lucide-react';
import BookCoverUpload from './BookCoverUpload';

interface EditBookModalProps {
    isOpen: boolean;
    book: Book | null;
    onSave: (id: string, updates: Partial<Book>) => void;
    onClose: () => void;
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

export default function EditBookModal({ isOpen, book, onSave, onClose }: EditBookModalProps) {
    // Form state
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [category, setCategory] = useState("");
    const [readingStatus, setReadingStatus] = useState<'to-read' | 'reading' | 'finished'>('to-read');
    const [coverUrl, setCoverUrl] = useState("");

    // Progress tracking
    const [dateStarted, setDateStarted] = useState("");
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [readingNotes, setReadingNotes] = useState("");

    // Refs for modal functionality
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close modal
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Populate form when book changes
    useEffect(() => {
        if (book) {
            setTitle(book.title);
            setAuthor(book.author);
            setCategory(book.category);
            setReadingStatus(book.reading_status);
            setCoverUrl(book.cover_url || "");
            setProgressPercentage(book.progress_percentage || 0);
            setDateStarted(book.date_started || "");
            setReadingNotes(book.reading_notes || "");
        }
    }, [book]);

    // Handle image upload
    const handleImageUpload = (url: string) => {
        setCoverUrl(url);
    };

    const handleRemoveImage = () => {
        setCoverUrl('');
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!book || !title || !author || !category) {
            alert('Please fill in all required fields');
            return;
        }

        const updates: Partial<Book> = {
            title,
            author,
            category,
            cover_url: coverUrl || null,
            reading_status: readingStatus,
            progress_percentage: readingStatus === 'reading' ? progressPercentage : readingStatus === 'finished' ? 100 : 0,
            date_started: readingStatus !== 'to-read' && dateStarted ? dateStarted : null,
            date_finished: readingStatus === 'finished' && dateStarted ? new Date().toISOString().split('T')[0] : null,
            reading_notes: readingNotes || null,
        };

        try {
            onSave(book.id, updates);
            onClose();
        } catch (error) {
            console.error('Error updating book:', error);
            alert('Error updating book. Please try again.');
        }
    };

    if (!isOpen || !book) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                ref={modalRef}
                className="bg-gray-800 border border-gray-600 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors z-10 cursor-pointer"
                >
                    <X size={16} className="text-gray-300" />
                </button>

                {/* Header - Fixed at top */}
                <div className="flex items-center gap-4 p-8 pb-6 flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Edit Book</h2>
                        <p className="text-gray-300 text-sm">Update your book details</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8">
                    <div className="space-y-6 pb-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">
                                Title *
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Start typing..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-text"
                                />
                            </div>
                        </div>

                        {/* Author and Category Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-200">
                                    Author *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="e.g. George Orwell"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-text"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-200">
                                    Category *
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Dystopian Fiction"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-text"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Book Cover Upload Section */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-200">
                                Book Cover
                            </label>
                            <BookCoverUpload
                                onImageUpload={handleImageUpload}
                                currentImage={coverUrl}
                                onRemoveImage={handleRemoveImage}
                            />
                        </div>

                        {/* Reading Status */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-200">
                                Reading Status
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'to-read', label: 'To Read', icon: '📚' },
                                    { value: 'reading', label: 'Reading', icon: '📖' },
                                    { value: 'finished', label: 'Finished', icon: '✅' }
                                ].map((status) => (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => setReadingStatus(status.value as any)}
                                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${readingStatus === status.value
                                            ? 'bg-gray-600 border-gray-500 text-white'
                                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                                            }`}
                                    >
                                        <div className="text-lg mb-1">{status.icon}</div>
                                        <div className="text-sm font-medium">{status.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Progress Tracking - Conditional */}
                        {readingStatus !== 'to-read' && (
                            <div className="space-y-4">
                                {/* Date Started */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-200">
                                        Date Started
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={dateStarted}
                                            onChange={(e) => setDateStarted(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Progress Bar - Only for reading status */}
                                {readingStatus === 'reading' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-200">
                                            Progress: {progressPercentage}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={progressPercentage}
                                            onChange={(e) => setProgressPercentage(Number(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #4b5563 ${progressPercentage}%, #4b5563 100%)`
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Reading Notes */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-200">
                                        Reading Notes
                                    </label>
                                    <textarea
                                        placeholder="Add any thoughts or notes about this book..."
                                        rows={3}
                                        value={readingNotes}
                                        onChange={(e) => setReadingNotes(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none cursor-text"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="border-t border-gray-600 bg-gray-800 px-8 py-6 flex-shrink-0 rounded-b-3xl">
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-300">
                                * Required fields
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-gray-300 rounded-lg font-semibold hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 hover:scale-105 border border-blue-500/50 shadow-lg cursor-pointer"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}