import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { cn } from '../utils/cn';

export const CartPage: React.FC = () => {
  const { state, updateQuantity, removeItem, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-14 md:pt-16 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-luxury-100 flex items-center justify-center">
            <ShoppingBag size={32} className="text-luxury-400" />
          </div>
          <h1 className="text-2xl font-semibold text-luxury-950 mb-3">
            Корзина пуста
          </h1>
          <p className="text-luxury-600 mb-8">
            Добавьте товары в корзину, чтобы продолжить покупки
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-luxury-950 text-white font-medium rounded-xl hover:bg-luxury-800 transition-colors active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            <span>ПЕРЕЙТИ В КАТАЛОГ</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-14 md:pt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-semibold text-luxury-950">
            Корзина
          </h1>
          <button
            onClick={clearCart}
            className="text-sm text-luxury-500 hover:text-red-500 transition-colors"
          >
            Очистить всё
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item, index) => (
              <div
                key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                className={cn(
                  "flex gap-4 p-4 bg-luxury-50 rounded-xl animate-fade-in-up",
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Product Image */}
                <Link 
                  to={`/products/${item.product.slug}`}
                  className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-white"
                >
                  <img
                    src={item.product.images[0] || '/assets/placeholder.jpg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <Link 
                    to={`/products/${item.product.slug}`}
                    className="font-medium text-luxury-950 line-clamp-2 hover:text-luxury-700 transition-colors"
                  >
                    {item.product.name}
                  </Link>
                  
                  {item.product.category && (
                    <span className="text-xs text-luxury-500 mt-1">
                      {item.product.category.name}
                    </span>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-white rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-2 text-luxury-600 hover:text-luxury-950 transition-colors active:scale-90"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium text-luxury-950">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-2 text-luxury-600 hover:text-luxury-950 transition-colors active:scale-90"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-luxury-950">
                          {formatPrice((item.product.salePrice || item.product.price) * item.quantity)}
                        </div>
                        {item.product.salePrice && item.product.salePrice < item.product.price && (
                          <div className="text-xs text-luxury-400 line-through">
                            {formatPrice(item.product.price * item.quantity)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 text-luxury-400 hover:text-red-500 transition-colors active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="bg-luxury-50 rounded-xl p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-luxury-950 mb-6">
                Итого
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-luxury-600">
                  <span>Товары ({state.itemCount})</span>
                  <span>{formatPrice(state.total)}</span>
                </div>
                <div className="flex justify-between text-luxury-600">
                  <span>Доставка</span>
                  <span className="text-green-600">Бесплатно</span>
                </div>
                <div className="h-px bg-luxury-200"></div>
                <div className="flex justify-between text-lg font-semibold text-luxury-950">
                  <span>К оплате</span>
                  <span>{formatPrice(state.total)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-luxury-950 text-white py-4 font-medium rounded-xl text-center hover:bg-luxury-800 transition-colors active:scale-[0.98]"
              >
                ОФОРМИТЬ ЗАКАЗ
              </Link>

              <Link
                to="/catalog"
                className="block text-center mt-4 text-luxury-600 hover:text-luxury-950 transition-colors text-sm"
              >
                Продолжить покупки
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
