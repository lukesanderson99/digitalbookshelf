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
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}