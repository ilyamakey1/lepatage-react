import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface HomepageImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  onRemove: () => void;
  label: string;
  placeholder?: string;
  isVideo?: boolean;
}

export const HomepageImageUpload: React.FC<HomepageImageUploadProps> = ({
  imageUrl,
  onImageChange,
  onRemove,
  label,
  placeholder,
  isVideo = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите файл изображения или видео');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Размер файла не должен превышать 50MB');
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
        onImageChange(result.imageUrl);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-luxury-950 mb-2">
        {label}
      </label>
      
      {imageUrl ? (
        <div className="relative group">
          <div className="relative w-full h-48 bg-luxury-100 rounded-lg overflow-hidden">
            {isVideo || imageUrl.endsWith('.MOV') || imageUrl.endsWith('.mov') || imageUrl.endsWith('.mp4') ? (
              <video 
                src={imageUrl} 
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />
            ) : (
              <img 
                src={imageUrl} 
                alt={label}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Remove Button */}
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* URL Input */}
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => onImageChange(e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950 text-sm"
            placeholder={placeholder}
          />
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-luxury-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary-500 hover:bg-primary-50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={isVideo ? "video/*" : "image/*"}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
              <p className="text-sm text-luxury-600">Загрузка...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="mx-auto h-8 w-8 text-luxury-400 mb-2" />
              <p className="text-sm text-luxury-600 mb-1">
                Перетащите файл сюда или нажмите для выбора
              </p>
              <p className="text-xs text-luxury-500">
                Или введите URL в поле ниже
              </p>
            </div>
          )}
          
          {/* URL Input when no image */}
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => onImageChange(e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950 text-sm"
            placeholder={placeholder || "Введите URL изображения"}
          />
        </div>
      )}
    </div>
  );
};

