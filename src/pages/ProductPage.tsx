import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { cn } from '../utils/cn';
import { useCart } from '../contexts/CartContext';

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { data: product, isLoading, error } = trpc.products.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };



  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    
    try {
      // Добавляем товар с выбранными опциями (если есть)
      const productForCart = {
        ...product,
        description: product.description || undefined,
        shortDescription: product.shortDescription || undefined,
        salePrice: product.salePrice || undefined,
        inStock: product.inStock ?? true,
        featured: product.featured ?? false,
        isNew: product.isNew ?? false,
        onSale: product.onSale ?? false,
        createdAt: product.createdAt || new Date().toISOString(),
        category: product.category || undefined
      };
      
      for (let i = 0; i < quantity; i++) {
        addItem(productForCart, selectedColor, selectedSize);
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
    <div className="min-h-screen bg-white pt-24">
      <div className="w-full mx-auto px-6 lg:px-12 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-luxury-600 hover:text-primary-950 transition-colors duration-300 text-sm font-luxury"
          >
            <ArrowLeft size={16} />
            <span>НАЗАД</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images - With Dots Navigation */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 ? (
              <>
                {/* Vertical Scrollable Gallery */}
                <div className="space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
                  {product.images.map((image: string, index: number) => (
                    <div
                      key={index}
                      className="relative w-full aspect-square overflow-hidden bg-luxury-50 rounded-lg"
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>


              </>
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-luxury-50 rounded-lg">
                <span className="text-luxury-500">Нет изображений</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Title and Category */}
            <div>
              {product.category && (
                <p className="text-primary-950 text-sm font-medium font-luxury tracking-wider uppercase mb-2">
                  {product.category.name}
                </p>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-luxury-950 mb-4">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-luxury-700 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="border-t border-luxury-200 pt-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-luxury-950">
                  {formatPrice(product.salePrice || product.price)}
                </span>
                {product.salePrice && product.salePrice < product.price && (
                  <span className="text-lg text-luxury-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-luxury-950 font-luxury text-sm tracking-wider">ЦВЕТ</h3>
                <div className="flex space-x-2">
                  {product.colors.map((color: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-8 h-8 border-2 transition-all duration-300',
                        selectedColor === color
                          ? 'border-primary-950 scale-110'
                          : 'border-luxury-300 hover:border-luxury-500'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-luxury-950 font-luxury text-sm tracking-wider">РАЗМЕР</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'px-4 py-2 border text-sm font-medium transition-all duration-300 font-luxury tracking-wider',
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

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-medium text-luxury-950 font-luxury text-sm tracking-wider">КОЛИЧЕСТВО</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border border-luxury-300 text-luxury-950 hover:border-primary-950 transition-colors duration-300 flex items-center justify-center"
                >
                  -
                </button>
                <span className="px-4 py-2 border border-luxury-300 min-w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 border border-luxury-300 text-luxury-950 hover:border-primary-950 transition-colors duration-300 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-luxury-200">
              <button
                onClick={handleAddToCart}
                className={cn(
                  "w-full flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-300 font-luxury tracking-wider",
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
                    <span className="text-lg">✓</span>
                    <span>ДОБАВЛЕНО!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    <span>{product.inStock ? 'ДОБАВИТЬ В КОРЗИНУ' : 'НЕТ В НАЛИЧИИ'}</span>
                  </>
                )}
              </button>
              
              <div className="flex space-x-3">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-luxury-300 text-luxury-950 hover:border-primary-950 transition-all duration-300">
                  <Heart size={16} />
                  <span className="font-luxury text-sm tracking-wider">В ИЗБРАННОЕ</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-luxury-300 text-luxury-950 hover:border-primary-950 transition-all duration-300">
                  <Share2 size={16} />
                  <span className="font-luxury text-sm tracking-wider">ПОДЕЛИТЬСЯ</span>
                </button>
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="pt-6 border-t border-luxury-200">
                <h3 className="font-medium text-luxury-950 font-luxury text-sm tracking-wider mb-3">ОПИСАНИЕ</h3>
                <p className="text-luxury-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};