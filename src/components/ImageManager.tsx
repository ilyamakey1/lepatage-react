import React, { useState, useRef } from 'react';
import { Upload, X, GripVertical, Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface ImageManagerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  className,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onImagesChange([...images, result.imageUrl]);
      } else {
        const error = await response.json();
        alert(`Ошибка загрузки: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    for (const file of files) {
      if (images.length < maxImages) {
        uploadImage(file);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveImage(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400',
          images.length >= maxImages && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (images.length < maxImages && !isUploading) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={images.length >= maxImages || isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
            <p className="text-sm text-gray-600">Загрузка изображения...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Перетащите изображения сюда или нажмите для выбора
            </p>
            <p className="text-xs text-gray-500">
              Максимум {maxImages} изображений, до 10MB каждое
            </p>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Изображения товара ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image}
                className={cn(
                  'relative group bg-white border rounded-lg overflow-hidden',
                  draggedIndex === index && 'opacity-50'
                )}
                draggable
                onDragStart={() => handleImageDragStart(index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragEnd={handleImageDragEnd}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-white bg-black bg-opacity-50 rounded cursor-move" />
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Image */}
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-24 object-cover cursor-move"
                  draggable={false}
                />

                {/* Position Badge */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500">
            Перетащите изображения для изменения порядка. Первое изображение будет главным.
          </p>
        </div>
      )}
    </div>
  );
};
