interface DeleteConfirmModalProps {
    isOpen: boolean;
    bookTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteConfirmModal({
    isOpen,
    bookTitle,
    onConfirm,
    onCancel
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[9999]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={onCancel}
        >
            <div
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-semibold text-white mb-4">
                    Delete Book
                </h3>

                <p className="text-gray-300 mb-6">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-white">"{bookTitle}"</span>?
                    <br />
                    <span className="text-sm text-gray-400 mt-2 block">
                        This action cannot be undone.
                    </span>
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-gray-300 rounded-lg font-semibold hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 border border-red-500/50 shadow-lg"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}