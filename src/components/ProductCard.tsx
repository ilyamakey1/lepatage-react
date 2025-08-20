import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../utils/cn';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleImageClick = () => {
    navigate(`/products/${product.slug}`);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const hasMultipleImages = product.images && product.images.length > 1;



  return (
    <div className="group relative bg-transparent overflow-hidden transition-all duration-500">
      {/* Product Image */}
      <div 
        className="relative aspect-[4/5] overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleImageClick}
      >
        {/* Main Image */}
        <img
          src={product.images[currentImageIndex] || '/assets/placeholder.jpg'}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isHovered && hasMultipleImages ? "opacity-0" : "opacity-100"
          )}
        />
        
        {/* Hover Image (Second Image) */}
        {hasMultipleImages && (
          <img
            src={product.images[(currentImageIndex + 1) % product.images.length] || '/assets/placeholder.jpg'}
            alt={product.name}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-500",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
        )}
        
        {/* Image Navigation - только если есть несколько изображений и при наведении */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-all duration-200"
              aria-label="Предыдущее изображение"
            >
              <ChevronLeft size={16} className="text-white drop-shadow-lg" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-all duration-200"
              aria-label="Следующее изображение"
            >
              <ChevronRight size={16} className="text-white drop-shadow-lg" />
            </button>
            
            {/* Image Dots Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Изображение ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/95 flex items-center justify-center">
            <span className="text-luxury-950 font-medium text-sm font-luxury">НЕТ В НАЛИЧИИ</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-sans text-base font-semibold text-luxury-950 group-hover:text-primary-950 transition-colors duration-300 line-clamp-2">
            <Link to={`/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>


        </div>

        {/* Price */}
        <div className="flex items-center space-x-2">
          <span className="text-luxury-950 font-bold text-base">
            {formatPrice(product.salePrice || product.price)}
          </span>
          {product.salePrice && product.salePrice < product.price && (
            <span className="text-luxury-500 line-through text-sm">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Colors */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-luxury-600 text-xs font-luxury">Цвета:</span>
            <div className="flex space-x-1">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 border border-luxury-300"
                  style={{ backgroundColor: color }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-luxury-600 text-xs ml-1">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};