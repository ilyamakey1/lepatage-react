import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, User, Truck } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { useCart } from '../contexts/CartContext';

interface ShippingAddress {
  country: string;
  city: string;
  address: string;
  postalCode: string;
  region: string;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form data
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    country: 'Беларусь',
    city: '',
    address: '',
    postalCode: '',
    region: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'bepaid' | 'cash' | 'transfer'>('bepaid');
  const [currency, setCurrency] = useState<'BYN' | 'EUR' | 'USD' | 'RUB'>('BYN');
  const [notes, setNotes] = useState('');
  const [sameBilling, setSameBilling] = useState(true);

  // tRPC mutations
  const createOrderMutation = trpc.orders.create.useMutation();
  const validateAddressMutation = trpc.orders.validateAddress.useMutation();

  // If cart is empty, redirect
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-luxury-950 mb-4">Корзина пуста</h1>
          <p className="text-luxury-600 mb-6">Добавьте товары в корзину для оформления заказа</p>
          <button
            onClick={() => navigate('/catalog')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-luxury-950 text-white hover:bg-primary-950 transition-colors duration-300"
          >
            <ArrowLeft size={16} />
            <span>В каталог</span>
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    const currencySymbols = {
      BYN: 'Br',
      EUR: '€',
      USD: '$',
      RUB: '₽',
    };
    
    return `${price.toFixed(2)} ${currencySymbols[currency]}`;
  };

  const handleCustomerInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate customer info
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setCurrentStep(2);
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate address
    const validation = await validateAddressMutation.mutateAsync(shippingAddress);
    
    if (!validation.valid) {
      alert(`Ошибки в адресе: ${validation.errors.join(', ')}`);
      return;
    }
    
    setCurrentStep(3);
  };

  const handleOrderSubmit = async () => {
    setIsProcessing(true);
    
    try {
      const orderData = {
        ...customerInfo,
        shippingAddress,
        billingAddress: sameBilling ? undefined : shippingAddress,
        currency,
        paymentMethod,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        })),
        notes: notes || undefined,
      };

      const result = await createOrderMutation.mutateAsync(orderData);
      
      if (result.success) {
        // Clear cart
        clearCart();
        
        // Redirect to order confirmation or payment
        navigate(`/order-success/${result.order.orderNumber}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Ошибка при создании заказа. Пожалуйста, попробуйте снова.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-6xl mx-auto px-8 lg:px-12 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="inline-flex items-center space-x-2 text-luxury-600 hover:text-primary-950 transition-colors duration-300 text-sm font-luxury"
          >
            <ArrowLeft size={16} />
            <span>НАЗАД В КОРЗИНУ</span>
          </button>
          
          <h1 className="text-3xl font-bold text-luxury-950 mt-4">Оформление заказа</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[
              { step: 1, label: 'Контактные данные', icon: User },
              { step: 2, label: 'Доставка', icon: Truck },
              { step: 3, label: 'Оплата', icon: CreditCard },
            ].map(({ step, label, icon: Icon }) => (
              <div
                key={step}
                className={`flex items-center space-x-2 px-4 py-2 rounded ${
                  currentStep >= step
                    ? 'bg-luxury-950 text-white'
                    : 'bg-luxury-100 text-luxury-600'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Customer Information */}
            {currentStep >= 1 && (
              <div className="mb-8 p-6 border border-luxury-200 rounded">
                <h2 className="text-xl font-semibold text-luxury-950 mb-4">Контактные данные</h2>
                <form onSubmit={handleCustomerInfoSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Имя *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        required
                        disabled={currentStep > 1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        required
                        disabled={currentStep > 1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        required
                        disabled={currentStep > 1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Телефон *
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        placeholder="+375 XX XXX-XX-XX"
                        required
                        disabled={currentStep > 1}
                      />
                    </div>
                  </div>
                  {currentStep === 1 && (
                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-luxury-950 text-white hover:bg-primary-950 transition-colors duration-300"
                    >
                      Продолжить
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* Step 2: Shipping Address */}
            {currentStep >= 2 && (
              <div className="mb-8 p-6 border border-luxury-200 rounded">
                <h2 className="text-xl font-semibold text-luxury-950 mb-4 flex items-center space-x-2">
                  <MapPin size={20} />
                  <span>Адрес доставки</span>
                </h2>
                <form onSubmit={handleShippingSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Страна *
                      </label>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        disabled={currentStep > 2}
                      >
                        <option value="Беларусь">Беларусь</option>
                        <option value="Россия">Россия</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Город *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        required
                        disabled={currentStep > 2}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Адрес *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        placeholder="Улица, дом, квартира"
                        required
                        disabled={currentStep > 2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Почтовый индекс
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        disabled={currentStep > 2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-luxury-700 mb-1">
                        Область/Регион
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.region}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, region: e.target.value }))}
                        className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                        disabled={currentStep > 2}
                      />
                    </div>
                  </div>
                  {currentStep === 2 && (
                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-luxury-950 text-white hover:bg-primary-950 transition-colors duration-300"
                      disabled={validateAddressMutation.isLoading}
                    >
                      {validateAddressMutation.isLoading ? 'Проверка...' : 'Продолжить'}
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep >= 3 && (
              <div className="mb-8 p-6 border border-luxury-200 rounded">
                <h2 className="text-xl font-semibold text-luxury-950 mb-4 flex items-center space-x-2">
                  <CreditCard size={20} />
                  <span>Способ оплаты</span>
                </h2>
                
                {/* Currency Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-luxury-700 mb-2">
                    Валюта
                  </label>
                  <div className="flex space-x-4">
                    {(['BYN', 'EUR', 'USD', 'RUB'] as const).map((curr) => (
                      <label key={curr} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value={curr}
                          checked={currency === curr}
                          onChange={(e) => setCurrency(e.target.value as any)}
                          className="text-primary-700 focus:ring-primary-700"
                        />
                        <span className="text-sm text-luxury-700">{curr}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-luxury-700 mb-2">
                    Способ оплаты
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-3 border border-luxury-300 rounded cursor-pointer hover:bg-luxury-50">
                      <input
                        type="radio"
                        value="bepaid"
                        checked={paymentMethod === 'bepaid'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="text-primary-700 focus:ring-primary-700"
                      />
                      <div>
                        <div className="font-medium text-luxury-950">Онлайн оплата (bePaid)</div>
                        <div className="text-sm text-luxury-600">Банковские карты, Apple Pay, Google Pay, ЕРИП</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-luxury-300 rounded cursor-pointer hover:bg-luxury-50">
                      <input
                        type="radio"
                        value="transfer"
                        checked={paymentMethod === 'transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="text-primary-700 focus:ring-primary-700"
                      />
                      <div>
                        <div className="font-medium text-luxury-950">Банковский перевод</div>
                        <div className="text-sm text-luxury-600">Оплата по реквизитам</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-luxury-300 rounded cursor-pointer hover:bg-luxury-50">
                      <input
                        type="radio"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="text-primary-700 focus:ring-primary-700"
                      />
                      <div>
                        <div className="font-medium text-luxury-950">При получении</div>
                        <div className="text-sm text-luxury-600">Наличными курьеру</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-luxury-700 mb-1">
                    Комментарий к заказу
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                    placeholder="Дополнительная информация о заказе..."
                  />
                </div>

                <button
                  onClick={handleOrderSubmit}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-primary-950 text-white hover:bg-primary-700 transition-colors duration-300 font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Оформление заказа...' : `Оформить заказ на ${formatPrice(total)}`}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 border border-luxury-200 rounded">
              <h3 className="text-lg font-semibold text-luxury-950 mb-4">Ваш заказ</h3>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`} className="flex items-center space-x-3">
                    <img
                      src={item.image || '/assets/placeholder.jpg'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-luxury-950">{item.name}</div>
                      {item.selectedColor && (
                        <div className="text-xs text-luxury-600">Цвет: {item.selectedColor}</div>
                      )}
                      {item.selectedSize && (
                        <div className="text-xs text-luxury-600">Размер: {item.selectedSize}</div>
                      )}
                      <div className="text-xs text-luxury-600">Количество: {item.quantity}</div>
                    </div>
                    <div className="text-sm font-medium text-luxury-950">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-luxury-200 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-luxury-600">
                  <span>Товары:</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-luxury-600">
                  <span>Доставка:</span>
                  <span>{total > 100 ? 'Бесплатно' : formatPrice(10)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-luxury-950 border-t border-luxury-200 pt-2">
                  <span>Итого:</span>
                  <span>{formatPrice(total + (total > 100 ? 0 : 10))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};