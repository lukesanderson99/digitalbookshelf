"use client";

import { useState, useEffect } from "react";

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
    // Progress tracking fields
    progress_percentage?: number;
    date_started?: string | null;
    date_finished?: string | null;
    reading_notes?: string | null;
}

export default function EditBookModal({ isOpen, book, onSave, onClose }: EditBookModalProps) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [category, setCategory] = useState("");
    const [readingStatus, setReadingStatus] = useState<'to-read' | 'reading' | 'finished'>('to-read');

    // 🆕 Progress tracking state
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [dateStarted, setDateStarted] = useState("");
    const [dateFinished, setDateFinished] = useState("");
    const [readingNotes, setReadingNotes] = useState("");

    // Populate form when book changes
    useEffect(() => {
        if (book) {
            setTitle(book.title);
            setAuthor(book.author);
            setCategory(book.category);
            setReadingStatus(book.reading_status);

            // 🆕 Populate progress tracking fields
            setProgressPercentage(book.progress_percentage || 0);
            setDateStarted(book.date_started || "");
            setDateFinished(book.date_finished || "");
            setReadingNotes(book.reading_notes || "");
        }
    }, [book]);

    const handleSave = () => {
        if (!book || !title || !author || !category) return;

        const updates: Partial<Book> = {
            title,
            author,
            category,
            reading_status: readingStatus,
            // 🆕 Include progress tracking updates
            progress_percentage: readingStatus === 'reading' ? progressPercentage : readingStatus === 'finished' ? 100 : 0,
            date_started: readingStatus !== 'to-read' && dateStarted ? dateStarted : null,
            date_finished: readingStatus === 'finished' && dateFinished ? dateFinished : null,
            reading_notes: readingNotes || null,
        };

        onSave(book.id, updates);
    };

    const handleStatusChange = (newStatus: 'to-read' | 'reading' | 'finished') => {
        setReadingStatus(newStatus);

        // 🆕 Auto-set dates based on status change
        if (newStatus === 'reading' && !dateStarted) {
            setDateStarted(new Date().toISOString().split('T')[0]);
        }
        if (newStatus === 'finished' && !dateFinished) {
            setDateFinished(new Date().toISOString().split('T')[0]);
        }
        if (newStatus === 'to-read') {
            setDateStarted("");
            setDateFinished("");
            setProgressPercentage(0);
        }
    };

    if (!isOpen || !book) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            onClick={onClose}
        >
            <div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Edit Book</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Basic Book Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                        </div>

                        {/* Author */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Author
                            </label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                        </div>

                        {/* Reading Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={readingStatus}
                                onChange={(e) => handleStatusChange(e.target.value as 'to-read' | 'reading' | 'finished')}
                                className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="to-read" className="bg-gray-800">📚 To Read</option>
                                <option value="reading" className="bg-gray-800">📖 Reading</option>
                                <option value="finished" className="bg-gray-800">✅ Finished</option>
                            </select>
                        </div>
                    </div>

                    {/* 🆕 Progress Tracking Section */}
                    {(readingStatus === 'reading' || readingStatus === 'finished') && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                            <div className="text-sm font-medium text-gray-300 mb-4">
                                📊 Progress Tracking
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                {/* Date Finished - only show for finished books */}
                                {readingStatus === 'finished' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Date Finished
                                        </label>
                                        <input
                                            type="date"
                                            value={dateFinished}
                                            onChange={(e) => setDateFinished(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        />
                                    </div>
                                )}

                                {/* Progress Percentage - only for reading books */}
                                {readingStatus === 'reading' && (
                                    <div className="md:col-span-2">
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
                            </div>

                            {/* Reading Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Reading Notes
                                </label>
                                <textarea
                                    rows={4}
                                    value={readingNotes}
                                    onChange={(e) => setReadingNotes(e.target.value)}
                                    placeholder="Add your thoughts, quotes, or notes about this book..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}