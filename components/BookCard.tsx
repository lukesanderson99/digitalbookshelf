import { useState } from 'react';
import { Edit3, Trash2, Star, Calendar, User, Tag } from 'lucide-react';

type BookCardProps = {
  id: string;
  title: string;
  author: string;
  category: string;
  reading_status?: 'to-read' | 'reading' | 'finished';
  coverUrl?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  // Progress tracking props
  progress_percentage?: number;
  date_started?: string | null;
  date_finished?: string | null;
  reading_notes?: string | null;
};

export default function BookCard({
  id,
  title,
  author,
  category,
  reading_status = 'to-read',
  coverUrl,
  onDelete,
  onEdit,
  // Progress props
  progress_percentage = 0,
  date_started,
  date_finished,
  reading_notes
}: BookCardProps) {
  // Image loading states
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get category color and icon
  const getCategoryStyle = (cat: string) => {
    const styles = {
      'Programming': { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '💻' },
      'Fiction': { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: '📚' },
      'Non-Fiction': { color: 'text-green-400', bg: 'bg-green-500/20', icon: '📖' },
      'Self-Help': { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '🧠' },
      'Design': { color: 'text-pink-400', bg: 'bg-pink-500/20', icon: '🎨' },
      'History': { color: 'text-indigo-400', bg: 'bg-indigo-500/20', icon: '🌍' },
      'Biography': { color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: '👤' },
      'Science': { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '🔬' },
      'Business': { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '💼' },
      'Philosophy': { color: 'text-violet-400', bg: 'bg-violet-500/20', icon: '🤔' },
      'Architectural design': { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '📐' },
    };
    return styles[cat as keyof typeof styles] || { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '📘' };
  };

  // Handle image loading states
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const categoryStyle = getCategoryStyle(category);

  return (
    <div
      className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-purple-500/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action Buttons - Back in the corner like before */}
      <div className={`absolute top-3 right-3 flex gap-2 z-10 transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            className="w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
            title="Edit book"
          >
            <Edit3 size={14} className="text-gray-600" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // REMOVED THE CONFIRM() CALL - Now goes directly to your custom modal
              onDelete(id);
            }}
            className="w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
            title="Delete book"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        )}
      </div>

      {/* Book Cover Section */}
      <div className="relative">
        {coverUrl && !imageError ? (
          <>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="w-full h-64 bg-gray-700 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-sm">📸</div>
              </div>
            )}

            {/* Actual image */}
            <img
              src={coverUrl}
              alt={`${title} cover`}
              className={`w-full h-64 object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          /* Fallback with category-specific styling */
          <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <span className="text-4xl">
              {categoryStyle.icon || '📖'}
            </span>
          </div>
        )}
      </div>

      {/* Book Details Section */}
      <div className="p-4 space-y-3">
        {/* Title and Author */}
        <div>
          <h3 className="font-bold text-lg text-white leading-tight mb-1" title={title}>
            {truncateText(title, 40)}
          </h3>
          <div className="flex items-center text-gray-300 text-sm">
            <User size={14} className="mr-1" />
            <span title={author}>{truncateText(author, 25)}</span>
          </div>
        </div>

        {/* Category and Reading Status Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center">
            <Tag size={14} className="mr-1 text-gray-400" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.color}`}>
              {categoryStyle.icon} {truncateText(category, 12)}
            </span>
          </div>

          {/* Reading Status Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${reading_status === 'finished' ? 'bg-green-500/20 text-green-400' :
            reading_status === 'reading' ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
            {reading_status === 'finished' ? '✅ Done' :
              reading_status === 'reading' ? '📖 Reading' :
                '📚 To Read'}
          </span>
        </div>

        {/* Progress Information for Currently Reading Books */}
        {reading_status === 'reading' && progress_percentage && progress_percentage > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span className="font-medium text-purple-400">{progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${Math.min(progress_percentage, 100)}%` }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Date Information for Finished Books */}
        {reading_status === 'finished' && (date_started || date_finished) && (
          <div className="text-xs text-gray-400 space-y-1">
            {date_started && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Started {formatDate(date_started)}</span>
              </div>
            )}
            {date_finished && (
              <div className="flex items-center gap-1 text-green-400">
                <span>✅ Finished {formatDate(date_finished)}</span>
              </div>
            )}
          </div>
        )}

        {/* Reading Notes Preview */}
        {reading_notes && reading_notes.trim() && (
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              📝 <span>Notes:</span>
            </div>
            <div className="text-xs text-gray-300 line-clamp-2" title={reading_notes}>
              {truncateText(reading_notes, 80)}
            </div>
          </div>
        )}
      </div>

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}