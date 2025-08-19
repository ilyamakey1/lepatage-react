import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-white pt-24 pb-12">
        <div className="w-full mx-auto px-6 lg:px-12">
          <div className="text-center py-16">
            <h1 className="font-sans text-3xl md:text-4xl font-semibold text-luxury-950 mb-6">
              Корзина пуста
            </h1>
            <p className="text-luxury-700 text-lg mb-8">
              Добавьте товары в корзину, чтобы продолжить покупки
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center space-x-2 px-6 py-3 border border-luxury-950 text-luxury-950 hover:bg-luxury-950 hover:text-white font-medium tracking-wider transition-all duration-300 group font-luxury text-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span>ПЕРЕЙТИ В КАТАЛОГ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="w-full mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-sans text-3xl md:text-4xl font-semibold text-luxury-950">
            Корзина
          </h1>
          <button
            onClick={clearCart}
            className="text-luxury-700 hover:text-primary-950 transition-colors duration-300 text-sm font-luxury"
          >
            Очистить корзину
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {state.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex items-center space-x-4 p-6 border border-luxury-200 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.product.images[0] || '/assets/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans font-medium text-luxury-950 truncate">
                      {item.product.name}
                    </h3>
                    {item.product.category && (
                      <p className="text-xs text-luxury-600 font-luxury uppercase tracking-wider">
                        {item.product.category.name}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      {item.selectedColor && (
                        <span className="text-xs text-luxury-700">
                          Цвет: {item.selectedColor}
                        </span>
                      )}
                      {item.selectedSize && (
                        <span className="text-xs text-luxury-700">
                          Размер: {item.selectedSize}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 text-luxury-700 hover:text-primary-950 transition-colors duration-300"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-medium text-luxury-950">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 text-luxury-700 hover:text-primary-950 transition-colors duration-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="font-medium text-luxury-950">
                      {formatPrice((item.product.salePrice || item.product.price) * item.quantity)}
                    </div>
                    {item.product.salePrice && item.product.salePrice < item.product.price && (
                      <div className="text-xs text-luxury-500 line-through">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 text-luxury-700 hover:text-primary-950 transition-colors duration-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-luxury-50 p-6 rounded-lg sticky top-24">
              <h2 className="font-sans text-lg font-medium text-luxury-950 mb-4">
                Итого к оплате
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-luxury-700">
                  <span>Товары ({state.itemCount})</span>
                  <span>{formatPrice(state.total)}</span>
                </div>
                <div className="flex justify-between text-luxury-700">
                  <span>Доставка</span>
                  <span>Бесплатно</span>
                </div>
                <div className="h-px bg-luxury-200"></div>
                <div className="flex justify-between font-medium text-luxury-950 text-lg">
                  <span>Итого</span>
                  <span>{formatPrice(state.total)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-primary-950 text-white py-3 px-4 font-medium tracking-wider transition-all duration-300 hover:bg-primary-700 font-luxury text-sm text-center"
              >
                ОФОРМИТЬ ЗАКАЗ
              </Link>

              <Link
                to="/catalog"
                className="block text-center mt-4 text-luxury-700 hover:text-primary-950 transition-colors duration-300 text-sm font-luxury"
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