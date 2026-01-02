import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../utils/cn';
import { useFavorites } from '../contexts/FavoritesContext';

interface MobileProductGridProps {
  products: Product[];
  title?: string;
}

interface MobileProductCardProps {
  product: Product;
}

const MobileProductCard: React.FC<MobileProductCardProps> = ({ product }) => {
  const { isInFavorites, toggleFavorite } = useFavorites();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <div className="flex-shrink-0 w-40 sm:w-48">
      {/* Product Image - Clickable */}
      <Link to={`/products/${product.slug}`} className="block cursor-pointer">
        <div className="relative aspect-square overflow-hidden rounded-lg mb-3 bg-luxury-50">
          <img
            src={product.images[0] || '/assets/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          
          {/* Heart Icon for Favorites */}
          <div className="absolute top-2 right-2">
            <button 
              className={cn(
                "p-1.5 transition-all duration-300 rounded-full bg-white/80 backdrop-blur-sm",
                isInFavorites(product.id) 
                  ? "text-primary-950" 
                  : "text-luxury-600 hover:text-primary-950"
              )}
              onClick={handleFavoriteClick}
            >
              <Heart size={12} fill={isInFavorites(product.id) ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Badges */}
          {product.isNew && (
            <div className="absolute top-2 left-2">
              <span className="px-1.5 py-0.5 bg-primary-950 text-white text-xs font-medium font-luxury tracking-wide rounded">
                NEW
              </span>
            </div>
          )}

          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-lg">
              <span className="text-luxury-950 font-medium text-xs font-luxury">НЕТ В НАЛИЧИИ</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="font-sans text-sm font-medium text-luxury-950 line-clamp-2 leading-tight">
          <Link to={`/products/${product.slug}`} className="hover:text-primary-950 transition-colors duration-300">
            {product.name}
          </Link>
        </h3>

        {/* Price */}
        <div className="flex items-center space-x-1">
          <span className="text-luxury-950 font-bold text-sm">
            {formatPrice(product.salePrice || product.price)}
          </span>
          {product.salePrice && product.salePrice < product.price && (
            <span className="text-luxury-500 line-through text-xs">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const MobileProductGrid: React.FC<MobileProductGridProps> = ({ 
  products, 
  title = "Товары" 
}) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-semibold text-luxury-950 font-luxury tracking-wide">
          {title}
        </h2>
        <span className="text-sm text-luxury-600">
          {products.length} товаров
        </span>
      </div>

      {/* Horizontal Scrolling Container */}
      <div className="relative">
        {/* Gradient Fade on Right */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable Products */}
        <div 
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product) => (
            <MobileProductCard 
              key={product.id} 
              product={product}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

