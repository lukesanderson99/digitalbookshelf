// components/BookCoverUpload.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface BookCoverUploadProps {
    onImageUpload: (url: string) => void;
    currentImage?: string;
    onRemoveImage?: () => void;
}

export default function BookCoverUpload({
    onImageUpload,
    currentImage,
    onRemoveImage
}: BookCoverUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const uploadImage = async (file: File) => {
        try {
            setUploading(true);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                return;
            }

            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `book-cover-${Math.random()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('book-covers')
                .upload(fileName, file);

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('book-covers')
                .getPublicUrl(fileName);

            onImageUpload(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadImage(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            uploadImage(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    return (
        <div className="space-y-4">
            {currentImage ? (
                // Show current image with remove option
                <div className="relative">
                    <img
                        src={currentImage}
                        alt="Book cover"
                        className="w-32 h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {onRemoveImage && (
                        <button
                            onClick={onRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            ) : (
                // Upload area
                <div
                    className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && document.getElementById('book-cover-input')?.click()}
                >
                    <input
                        id="book-cover-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-gray-600">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-2">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                            <p className="text-gray-600">
                                <span className="font-medium text-blue-600 cursor-pointer">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}