import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { cn } from '../utils/cn';
import { useFavorites } from '../contexts/FavoritesContext';

interface ProductFromDB {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  images: string[];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  onSale: boolean;
  tags: string[];
  createdAt: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isInFavorites, toggleFavorite } = useFavorites();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchRef = useRef<{ startX: number; startY: number; deltaX: number; isHorizontal: boolean | null }>({
    startX: 0, startY: 0, deltaX: 0, isHorizontal: null
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentImageIndex(0);
  }, [slug]);

  const { data: product, isLoading, error } = trpc.products.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  ) as { data: ProductFromDB | undefined; isLoading: boolean; error: any };

  // Horizontal swipe handlers - only activate for horizontal gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      deltaX: 0,
      isHorizontal: null // Will be determined on first move
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchRef.current.startX - currentX;
    const deltaY = touchRef.current.startY - currentY;
    
    // Determine direction on first significant move
    if (touchRef.current.isHorizontal === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      touchRef.current.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    // Only track horizontal swipes
    if (touchRef.current.isHorizontal) {
      touchRef.current.deltaX = deltaX;
    }
  };

  const handleTouchEnd = () => {
    if (isTransitioning || !product?.images || !touchRef.current.isHorizontal) {
      touchRef.current = { startX: 0, startY: 0, deltaX: 0, isHorizontal: null };
      return;
    }
    
    const threshold = 50;
    const deltaX = touchRef.current.deltaX;
    
    if (Math.abs(deltaX) > threshold) {
      setIsTransitioning(true);
      if (deltaX > 0 && currentImageIndex < product.images.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
      } else if (deltaX < 0 && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1);
      }
      setTimeout(() => setIsTransitioning(false), 500);
    }
    
    touchRef.current = { startX: 0, startY: 0, deltaX: 0, isHorizontal: null };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCustomOrder = () => {
    navigate('/custom-order');
  };

  const getProductForFavorites = () => {
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || undefined,
      shortDescription: product.shortDescription || undefined,
      price: product.price,
      salePrice: product.salePrice || undefined,
      images: product.images,
      colors: product.colors,
      sizes: product.sizes,
      inStock: product.inStock,
      featured: product.featured,
      isNew: product.isNew,
      onSale: product.onSale,
      tags: product.tags,
      createdAt: product.createdAt,
      category: product.category || undefined
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-luxury-200 border-t-luxury-950"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white pt-14 md:pt-16 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-luxury-950 mb-4">Товар не найден</h1>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-luxury-950 text-white rounded-lg hover:bg-luxury-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Вернуться в каталог</span>
          </Link>
        </div>
      </div>
    );
  }

  const isFavorite = isInFavorites(product.id);

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Image Gallery - Horizontal Swipe */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-[3/4] bg-luxury-100 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Images - Horizontal Stack */}
          {product.images && product.images.length > 0 && (
            <div 
              className="absolute inset-0 flex"
              style={{ 
                transform: `translateX(-${currentImageIndex * 100}%)`,
                transition: 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              {product.images.map((img, index) => (
                <div key={index} className="w-full h-full flex-shrink-0">
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-20 p-2.5 text-white drop-shadow-lg active:scale-95 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => {
              const p = getProductForFavorites();
              if (p) toggleFavorite(p);
            }}
            className={cn(
              "absolute top-4 right-4 z-20 p-2.5 drop-shadow-lg active:scale-95 transition-transform",
              isFavorite ? "text-red-500" : "text-white"
            )}
          >
            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          {/* Small Gray Dots - Bottom Center */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    index === currentImageIndex 
                      ? "bg-luxury-600" 
                      : "bg-luxury-400/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="px-4 py-6 space-y-5">
          {/* Category */}
          {product.category && (
            <Link 
              to={`/catalog/${product.category.slug}`}
              className="text-sm text-luxury-500"
            >
              {product.category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-2xl font-semibold text-luxury-950 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-luxury-950">
              {formatPrice(product.salePrice || product.price)}
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-lg text-luxury-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-luxury-600 leading-relaxed text-sm">
              {product.description}
            </p>
          )}

          {/* Size Info */}
          <div className="py-4 border-t border-luxury-100">
            <h3 className="text-sm font-medium text-luxury-950 mb-1">РАЗМЕР</h3>
            <p className="text-luxury-500 text-sm">
              Размер уточняется во время заказа
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2 pb-4 safe-bottom">
            <button
              onClick={handleCustomOrder}
              className="w-full py-4 bg-luxury-950 text-white font-medium rounded-xl transition-all hover:bg-luxury-800 active:scale-[0.98]"
            >
              ИНДИВИДУАЛЬНЫЙ ЗАКАЗ
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-2 min-h-screen">
        {/* Left - Images */}
        <div className="relative h-screen overflow-hidden">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-20 left-8 z-20 p-3 text-white drop-shadow-lg hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Images - Horizontal */}
          {product.images && product.images.length > 0 && (
            <div 
              className="h-full flex"
              style={{ 
                transform: `translateX(-${currentImageIndex * 100}%)`,
                transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            >
              {product.images.map((img, index) => (
                <div key={index} className="w-full h-full flex-shrink-0">
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Small Gray Dots - Bottom Center */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentImageIndex 
                      ? "bg-white" 
                      : "bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right - Info */}
        <div className="flex flex-col justify-center p-12 xl:p-16 max-w-xl mx-auto">
          {/* Favorite Button */}
          <button 
            onClick={() => {
              const p = getProductForFavorites();
              if (p) toggleFavorite(p);
            }}
            className={cn(
              "self-end p-3 rounded-full transition-colors mb-8",
              isFavorite ? "text-red-500" : "text-luxury-400 hover:text-luxury-600"
            )}
          >
            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          {/* Category */}
          {product.category && (
            <Link 
              to={`/catalog/${product.category.slug}`}
              className="text-sm text-luxury-500 hover:text-luxury-700 transition-colors mb-4"
            >
              {product.category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-4xl xl:text-5xl font-semibold text-luxury-950 leading-tight mb-6">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-3xl font-bold text-luxury-950">
              {formatPrice(product.salePrice || product.price)}
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-xl text-luxury-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-luxury-600 leading-relaxed mb-8 text-lg">
              {product.description}
            </p>
          )}

          {/* Size Info */}
          <div className="py-6 border-t border-b border-luxury-100 mb-8">
            <h3 className="text-sm font-medium text-luxury-950 tracking-wider mb-2">РАЗМЕР</h3>
            <p className="text-luxury-600">
              Размер уточняется во время заказа
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleCustomOrder}
            className="w-full py-5 bg-luxury-950 text-white font-medium text-lg rounded-xl transition-all hover:bg-luxury-800 active:scale-[0.99]"
          >
            ИНДИВИДУАЛЬНЫЙ ЗАКАЗ
          </button>
        </div>
      </div>
    </div>
  );
};
