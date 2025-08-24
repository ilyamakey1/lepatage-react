import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { cn } from '../utils/cn';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';

// Интерфейс для товара из базы данных
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
  const { addItem } = useCart();
  const { isInFavorites, toggleFavorite } = useFavorites();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { data: product, isLoading, error } = trpc.products.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  ) as { data: ProductFromDB | undefined; isLoading: boolean; error: any };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Функция для определения текущего изображения при скролле
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!product?.images) return;
    
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // Вычисляем индекс текущего изображения на основе позиции скролла
    const newIndex = Math.round(scrollTop / containerHeight);
    if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < product.images.length) {
      setCurrentImageIndex(newIndex);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    
    try {
      // Преобразуем типы из базы данных в типы для корзины
      const cartProduct = {
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
      
      // Добавляем товар с выбранными опциями (если есть)
      for (let i = 0; i < quantity; i++) {
        addItem(cartProduct, selectedColor, selectedSize);
      }
      
      // Показываем feedback на 1 секунду
      setTimeout(() => {
        setIsAdding(false);
      }, 1000);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      setIsAdding(false);
    }
  };

  // Адаптер для преобразования типов для избранного
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

  const nextImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-950"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-luxury-950 mb-4">Товар не найден</h1>
          <Link
            to="/catalog"
            className="inline-flex items-center space-x-2 px-4 py-2 border border-luxury-950 text-luxury-950 hover:bg-luxury-950 hover:text-white transition-all duration-300"
          >
            <ArrowLeft size={16} />
            <span>Вернуться в каталог</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="w-full min-h-screen">
        {/* Back Navigation */}
        <div className="absolute top-24 left-8 z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-luxury-600 hover:text-primary-950 transition-colors duration-300 text-sm font-luxury bg-white/80 px-3 py-2 rounded"
          >
            <ArrowLeft size={16} />
            <span>НАЗАД</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Product Images - Scrollable */}
          <div className="relative overflow-y-auto" onScroll={handleScroll}>
            {product.images && product.images.length > 0 ? (
              <div className="space-y-0">
                {product.images.map((image: string, index: number) => (
                  <div key={index} className="w-full h-screen overflow-hidden">
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  </div>
                ))}

                {/* Vertical Dots Navigation */}
                {product.images.length > 1 && (
                  <div className="fixed right-8 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-20">
                    {product.images.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "w-3 h-3 rounded-full transition-all duration-300",
                          index === currentImageIndex
                            ? "bg-primary-950 scale-110"
                            : "bg-luxury-300 hover:bg-luxury-400"
                        )}
                        aria-label={`Изображение ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-screen flex items-center justify-center bg-transparent">
                <span className="text-luxury-500">Нет изображений</span>
              </div>
            )}
          </div>

          {/* Product Info - Fixed Position */}
          <div className="sticky top-0 h-screen flex flex-col justify-center p-12 space-y-8 bg-transparent overflow-y-auto">
            {/* Product Title with Heart Icon */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-luxury-950 mb-6">
                  {product.name}
                </h1>
              </div>
              <button 
                onClick={() => {
                  const productForFavorites = getProductForFavorites();
                  if (productForFavorites) {
                    toggleFavorite(productForFavorites);
                  }
                }}
                className={cn(
                  "p-3 text-luxury-600 hover:text-primary-950 transition-colors duration-300",
                  isInFavorites(product.id) ? "text-primary-950" : "text-luxury-600"
                )}
              >
                <Heart size={24} fill={isInFavorites(product.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Price */}
            <div className="border-t border-luxury-200 pt-8">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-luxury-950">
                  {formatPrice(product.salePrice || product.price)}
                </span>
                {product.salePrice && product.salePrice < product.price && (
                  <span className="text-xl text-luxury-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-luxury-950 font-luxury text-sm tracking-wider">ЦВЕТ</h3>
                <div className="flex space-x-3">
                  {product.colors.map((color: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-10 h-10 border-2 transition-all duration-300',
                        selectedColor === color
                          ? 'border-primary-950 scale-110'
                          : 'border-luxury-300 hover:border-primary-500'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-luxury-950 font-luxury text-sm tracking-wider">РАЗМЕР</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'px-6 py-3 border text-sm font-medium transition-all duration-300 font-luxury tracking-wider',
                        selectedSize === size
                          ? 'border-primary-950 bg-primary-950 text-white'
                          : 'border-luxury-300 text-luxury-950 hover:border-primary-950'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button - Only Add to Cart */}
            <div className="pt-8 border-t border-luxury-200">
              <button
                onClick={handleAddToCart}
                className={cn(
                  "w-full flex items-center justify-center space-x-3 px-8 py-5 font-medium transition-all duration-300 font-luxury tracking-wider text-lg",
                  !product.inStock 
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : isAdding 
                      ? "bg-green-600 text-white"
                      : "bg-primary-950 hover:bg-primary-900 text-white"
                )}
                disabled={!product.inStock || isAdding}
              >
                {isAdding ? (
                  <>
                    <span className="text-xl">✓</span>
                    <span>ДОБАВЛЕНО!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    <span>{product.inStock ? 'ДОБАВИТЬ В КОРЗИНУ' : 'НЕТ В НАЛИЧИИ'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};