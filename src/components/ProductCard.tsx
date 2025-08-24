import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../utils/cn';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  return (
    <div className={cn(
      'group relative bg-white minimal-border overflow-hidden hover:border-primary-950 transition-all duration-500',
      className
    )}>
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images[0] || '/assets/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick Actions */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
          <div className="flex space-x-2">
            <Link
              to={`/products/${product.slug}`}
              className="p-2 bg-white border border-luxury-950 text-luxury-950 transition-all duration-300 hover:bg-luxury-950 hover:text-white"
            >
              <Eye size={16} />
            </Link>
            <button 
              onClick={handleAddToCart}
              className="p-2 bg-luxury-950 hover:bg-primary-950 text-white border border-luxury-950 transition-all duration-300"
              title="Добавить в корзину"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.isNew && (
            <span className="px-2 py-1 bg-primary-950 text-white text-xs font-medium font-luxury tracking-wide">
              NEW
            </span>
          )}

          {product.featured && (
            <span className="px-2 py-1 bg-luxury-950 text-white text-xs font-medium font-luxury tracking-wide">
              HIT
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

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-sans text-base font-semibold text-luxury-950 group-hover:text-primary-950 transition-colors duration-300 line-clamp-2">
            <Link to={`/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
          {product.shortDescription && (
            <p className="text-luxury-600 text-sm mt-1 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
          {product.category && (
            <p className="text-primary-950 text-xs mt-2 font-medium font-luxury tracking-wider uppercase">
              {product.category.name}
            </p>
          )}
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