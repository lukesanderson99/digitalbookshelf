'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Star, Plus, X, RefreshCw } from 'lucide-react';

interface Book {
    id?: string;
    title: string;
    author: string;
    category: string;
    reading_status: string;
    progress_percentage?: number;
}

interface Recommendation {
    title: string;
    author: string;
    reason: string;
    confidence: number;
    genre: string;
    cover_url?: string | null;
}

interface RecommendationData {
    recommendations: Recommendation[];
    basedOn: {
        completedBooks: number;
        categories: string[];
        totalBooks: number;
    };
}

interface RecommendationsSectionProps {
    books: Book[];
    onAddBookFromRecommendation: (recommendationData: any) => void;
}

export default function RecommendationsSection({ books, onAddBookFromRecommendation }: RecommendationsSectionProps) {
    const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());
    const [addingToLibrary, setAddingToLibrary] = useState<string | null>(null);

    useEffect(() => {
        if (books.length >= 3) {
            fetchRecommendations();
        }
    }, [books]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ books }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }

            const data = await response.json();
            setRecommendations(data);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Failed to load recommendations. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToLibrary = (rec: Recommendation) => {
        // Call the function to open modal with pre-filled data
        onAddBookFromRecommendation({
            title: rec.title,
            author: rec.author,
            genre: rec.genre,
            reason: rec.reason,
            confidence: rec.confidence,
            cover_url: rec.cover_url // Include the cover URL
        });
    };

    const handleDismissRecommendation = (title: string) => {
        setDismissedRecommendations(prev => new Set(prev).add(title));
    };

    const handleRefreshRecommendations = () => {
        setDismissedRecommendations(new Set());
        fetchRecommendations();
    };

    if (loading) {
        return (
            <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="text-lg text-gray-300">💡</div>
                    <h2 className="text-lg font-medium text-gray-300">Getting suggestions for you...</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 animate-pulse">
                            <div className="h-24 bg-white/10 rounded mb-3"></div>
                            <div className="h-4 bg-white/10 rounded mb-2"></div>
                            <div className="h-3 bg-white/10 rounded mb-3"></div>
                            <div className="h-3 bg-white/10 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-lg text-gray-400">💡</div>
                    <h2 className="text-lg font-medium text-gray-300">Suggestions for you</h2>
                </div>
                <div className="text-center py-8 text-gray-400">
                    <p>{error}</p>
                    <button
                        onClick={fetchRecommendations}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!recommendations || recommendations.recommendations.length === 0) {
        return null;
    }

    // Filter out dismissed recommendations
    const visibleRecommendations = recommendations.recommendations.filter(
        rec => !dismissedRecommendations.has(rec.title)
    );

    if (visibleRecommendations.length === 0) {
        return (
            <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="text-lg text-gray-300">💡</div>
                        <h2 className="text-lg font-medium text-gray-300">You might also like...</h2>
                    </div>
                    <button
                        onClick={handleRefreshRecommendations}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                        <RefreshCw size={14} />
                        New Suggestions
                    </button>
                </div>
                <div className="text-center py-8 text-gray-400">
                    <p>No more recommendations to show.</p>
                    <button
                        onClick={handleRefreshRecommendations}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Get fresh recommendations
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 pt-8 border-t border-white/10">
            {/* Section Header with Refresh Button */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-lg text-gray-300">💡</div>
                    <h2 className="text-lg font-medium text-gray-300">You might also like...</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
                    <div className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                        Based on {recommendations.basedOn.totalBooks} books
                    </div>
                </div>

                <button
                    onClick={handleRefreshRecommendations}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Recommendation Cards with Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleRecommendations.map((rec, index) => (
                    <div
                        key={index}
                        className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200 relative overflow-hidden"
                    >
                        {/* Dismiss Button */}
                        <button
                            onClick={() => handleDismissRecommendation(rec.title)}
                            className="absolute top-2 right-2 w-6 h-6 bg-white/10 hover:bg-red-500/20 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors z-10"
                        >
                            <X size={12} />
                        </button>

                        {/* AI Badge */}
                        <div className="absolute top-2 left-2 bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Sparkles size={10} />
                            AI
                        </div>

                        {/* Book Cover with Real Image */}
                        <div className="w-full h-32 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg flex items-center justify-center text-3xl mb-3 group-hover:from-gray-600/50 group-hover:to-gray-700/50 transition-all mt-6 overflow-hidden">
                            {rec.cover_url ? (
                                <img
                                    src={rec.cover_url}
                                    alt={rec.title}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <div className="text-2xl">📖</div>
                            )}
                        </div>

                        {/* Book Info */}
                        <div className="space-y-2 mb-4">
                            <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-gray-100 transition-colors">
                                {rec.title}
                            </h3>
                            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                                by {rec.author}
                            </p>

                            {/* Genre Badge and Confidence */}
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
                                    {rec.genre}
                                </span>

                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Star size={10} className="text-yellow-400" />
                                    {rec.confidence}/10
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="text-xs text-gray-500 line-clamp-2 group-hover:line-clamp-none transition-all">
                                {rec.reason}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={() => handleAddToLibrary(rec)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs text-blue-300 hover:text-blue-200 transition-colors"
                            >
                                <Plus size={12} />
                                Add to Library
                            </button>

                            <button
                                onClick={() => handleDismissRecommendation(rec.title)}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                Not Interested
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}