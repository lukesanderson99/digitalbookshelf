type BookCardProps = {
  id: string;
  title: string;
  author: string;
  category: string;
  reading_status?: 'to-read' | 'reading' | 'finished';
  coverUrl?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  // 🆕 New progress tracking props
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
  // 🆕 New progress props
  progress_percentage = 0,
  date_started,
  date_finished,
  reading_notes
}: BookCardProps) {
  // Get category color and icon
  const getCategoryStyle = (cat: string) => {
    const styles = {
      'Programming': { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '💻' },
      'Fiction': { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: '📚' },
      'Non-Fiction': { color: 'text-green-400', bg: 'bg-green-500/20', icon: '📖' },
      'Self-Help': { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '🧠' },
      'Design': { color: 'text-pink-400', bg: 'bg-pink-500/20', icon: '🎨' },
      'History': { color: 'text-indigo-400', bg: 'bg-indigo-500/20', icon: '🌍' },
    };
    return styles[cat as keyof typeof styles] || { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '📘' };
  };

  // Get status dot color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'bg-green-500 shadow-green-500/50';
      case 'reading': return 'bg-orange-500 shadow-orange-500/50';
      case 'to-read': return 'bg-gray-500 shadow-gray-500/50';
      default: return 'bg-gray-500 shadow-gray-500/50';
    }
  };

  // 🆕 Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 🆕 Calculate reading duration
  const getReadingDuration = () => {
    if (!date_started) return null;

    const start = new Date(date_started);
    const end = date_finished ? new Date(date_finished) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
    return `${Math.round(diffDays / 365)} years`;
  };

  const categoryStyle = getCategoryStyle(category);

  return (
    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-purple-500/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
      {/* Reading Status Dot */}
      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full shadow-lg ${getStatusColor(reading_status)}`}></div>

      {/* Book Cover */}
      <div className="w-20 h-28 mb-5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="relative z-10">📖</span>
        )}
      </div>

      {/* Book Info */}
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 leading-tight">
        {title}
      </h3>

      <p className="text-gray-300 text-sm mb-4">
        by {author}
      </p>

      {/* 🆕 Progress Information */}
      {reading_status === 'reading' && (
        <div className="mb-4 space-y-2">
          {/* Progress Bar */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{progress_percentage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress_percentage}%` }}
            ></div>
          </div>
          {date_started && (
            <div className="text-xs text-gray-400">
              📅 Started {formatDate(date_started)} • {getReadingDuration()}
            </div>
          )}
        </div>
      )}

      {/* 🆕 Finished Book Info */}
      {reading_status === 'finished' && (date_started || date_finished) && (
        <div className="mb-4 text-xs text-gray-400 space-y-1">
          {date_started && (
            <div>📅 Started {formatDate(date_started)}</div>
          )}
          {date_finished && (
            <div>✅ Finished {formatDate(date_finished)}</div>
          )}
          {date_started && date_finished && (
            <div className="text-green-400">📊 Read in {getReadingDuration()}</div>
          )}
        </div>
      )}

      {/* 🆕 Reading Notes Preview */}
      {reading_notes && (
        <div className="mb-4 p-2 bg-white/5 rounded-lg border border-white/10">
          <div className="text-xs text-gray-400 mb-1">📝 Notes:</div>
          <div className="text-xs text-gray-300 line-clamp-2">
            {reading_notes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.color}`}>
          <span>{categoryStyle.icon}</span>
          {category}
        </span>

        {/* Action Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="w-8 h-8 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center hover:bg-green-500/30 transition-colors"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="w-8 h-8 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500/30 transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}