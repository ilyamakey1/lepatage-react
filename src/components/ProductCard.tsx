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
      return product.images[1]; // Вторая фотография при наведении
    }
    return product.images[0] || '/assets/placeholder.jpg'; // Первая фотография по умолчанию
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <div 
      className={cn(
        'group relative bg-white overflow-hidden transition-all duration-500',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image - Clickable */}
      <Link to={`/products/${product.slug}`} className="block cursor-pointer">
        <div className="relative aspect-square overflow-hidden group-hover:bg-luxury-50 transition-colors duration-700">
          <img
            src={getCurrentImage()}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-1000"
          />
          
          {/* Heart Icon for Favorites */}
          <div className="absolute top-2 right-2">
            <button 
              className={cn(
                "p-2 transition-all duration-300 rounded-full",
                isInFavorites(product.id) 
                  ? "text-primary-950" 
                  : "text-luxury-600 hover:text-primary-950"
              )}
              onClick={handleFavoriteClick}
            >
              <Heart size={16} fill={isInFavorites(product.id) ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {product.isNew && (
              <span className="px-2 py-1 bg-primary-950 text-white text-xs font-medium font-luxury tracking-wide">
                NEW
              </span>
            )}
          </div>

          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/95 flex items-center justify-center">
              <span className="text-luxury-950 font-medium text-sm font-luxury">НЕТ В НАЛИЧИИ</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
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
      </div>
    </div>
  );
};