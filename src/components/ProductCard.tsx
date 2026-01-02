import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../utils/cn';
import { useFavorites } from '../contexts/FavoritesContext';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isInFavorites, toggleFavorite } = useFavorites();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentImage = () => {
    if (product.images && product.images.length > 1 && isHovered) {
      return product.images[1];
    }
    return product.images[0] || '/assets/placeholder.jpg';
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const isFavorite = isInFavorites(product.id);

  return (
    <div 
      className={cn(
        'group relative bg-white overflow-hidden transition-all duration-300',
        'active:scale-[0.98]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-luxury-50">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-luxury-100 animate-pulse" />
          )}
          
          <img
            src={getCurrentImage()}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover object-center transition-all duration-700",
              imageLoaded ? "opacity-100" : "opacity-0",
              isHovered && "scale-105"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Favorite Button */}
          <button 
            className={cn(
              "absolute top-2 right-2 p-2 transition-all duration-300",
              "active:scale-90",
              isFavorite ? "text-red-500" : "text-luxury-950"
            )}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
          >
            <Heart 
              size={20} 
              fill={isFavorite ? "currentColor" : "none"} 
              strokeWidth={1.5}
              className="transition-transform duration-300"
            />
          </button>

          {/* Badge - только NEW */}
          {product.isNew && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 bg-luxury-950 text-white text-[10px] font-semibold tracking-wider rounded">
                NEW
              </span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <span className="text-luxury-600 font-medium text-sm tracking-wide">НЕТ В НАЛИЧИИ</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3 md:p-4">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-medium text-sm md:text-base text-luxury-950 line-clamp-2 leading-snug mb-1.5 transition-colors hover:text-luxury-700">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-luxury-950 font-bold text-sm md:text-base">
            {formatPrice(product.salePrice || product.price)}
          </span>
          {product.salePrice && product.salePrice < product.price && (
            <span className="text-luxury-400 line-through text-xs md:text-sm">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
