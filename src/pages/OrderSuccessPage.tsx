import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Package, CreditCard, Truck } from 'lucide-react';
import { trpc } from '../utils/trpc';

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  
  const { data: order, isLoading, error } = trpc.orders.getByNumber.useQuery(
    { orderNumber: orderNumber! },
    { enabled: !!orderNumber }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950 mx-auto mb-4"></div>
          <p className="text-luxury-600">Загрузка информации о заказе...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-luxury-950 mb-4">Заказ не найден</h1>
          <p className="text-luxury-600 mb-6">Возможно, номер заказа указан неверно</p>
          <Link
            to="/catalog"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-luxury-950 text-white hover:bg-primary-950 transition-colors duration-300"
          >
            <ArrowLeft size={16} />
            <span>В каталог</span>
          </Link>
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
    
    return `${price.toFixed(2)} ${currencySymbols[order.currency as keyof typeof currencySymbols] || 'Br'}`;
  };

  const getPaymentMethodName = (method: string) => {
    const methods = {
      bepaid: 'Онлайн оплата (bePaid)',
      transfer: 'Банковский перевод',
      cash: 'При получении',
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600',
      confirmed: 'text-blue-600',
      paid: 'text-green-600',
      shipped: 'text-purple-600',
      delivered: 'text-green-700',
      cancelled: 'text-red-600',
      failed: 'text-red-600',
      refunded: 'text-orange-600',
    };
    return colors[status as keyof typeof colors] || 'text-luxury-600';
  };

  const getStatusText = (status: string, isPayment = false) => {
    if (isPayment) {
      const statuses = {
        pending: 'Ожидает оплаты',
        paid: 'Оплачен',
        failed: 'Ошибка оплаты',
        refunded: 'Возвращен',
      };
      return statuses[status as keyof typeof statuses] || status;
    }
    
    const statuses = {
      pending: 'Обрабатывается',
      confirmed: 'Подтвержден',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменен',
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  const shouldShowPaymentButton = order.paymentMethod === 'bepaid' && order.paymentStatus === 'pending';

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="w-full mx-auto px-6 lg:px-12 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-luxury-950 mb-2">Заказ успешно оформлен!</h1>
          <p className="text-luxury-600">
            Спасибо за покупку! Мы отправили подтверждение на ваш email.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-luxury-50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Package size={32} className="text-primary-950 mx-auto mb-2" />
              <div className="font-semibold text-luxury-950">Номер заказа</div>
              <div className="text-primary-950 font-mono text-lg">{order.orderNumber}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-luxury-950">Статус заказа</div>
              <div className={`font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </div>
            </div>
            <div className="text-center">
              <CreditCard size={32} className="text-primary-950 mx-auto mb-2" />
              <div className="font-semibold text-luxury-950">Статус оплаты</div>
              <div className={`font-medium ${getStatusColor(order.paymentStatus)}`}>
                {getStatusText(order.paymentStatus, true)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Button for bePaid */}
        {shouldShowPaymentButton && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Завершите оплату</h3>
                <p className="text-blue-700">
                  Для завершения заказа необходимо произвести оплату через систему bePaid
                </p>
              </div>
              <button
                onClick={() => {
                  // Здесь будет интеграция с bePaid
                  alert('Переход к оплате через bePaid будет реализован');
                }}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 font-medium rounded"
              >
                Оплатить {formatPrice(order.total)}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Items */}
          <div>
            <h2 className="text-xl font-semibold text-luxury-950 mb-4">Состав заказа</h2>
            <div className="border border-luxury-200 rounded-lg overflow-hidden">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border-b border-luxury-200 last:border-b-0">
                  <img
                    src={item.image || '/assets/placeholder.jpg'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-luxury-950">{item.name}</div>
                    <div className="text-sm text-luxury-600">Количество: {item.quantity}</div>
                    <div className="text-sm text-luxury-600">Цена: {formatPrice(item.price)}</div>
                  </div>
                  <div className="text-lg font-semibold text-luxury-950">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Total */}
            <div className="mt-4 p-4 bg-luxury-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-luxury-600">
                  <span>Товары:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-luxury-600">
                  <span>Доставка:</span>
                  <span>{formatPrice(order.shipping)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm text-luxury-600">
                    <span>Налоги:</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold text-luxury-950 border-t border-luxury-200 pt-2">
                  <span>Итого:</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div>
            <h2 className="text-xl font-semibold text-luxury-950 mb-4">Детали заказа</h2>
            
            {/* Customer Info */}
            <div className="border border-luxury-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-luxury-950 mb-2">Контактные данные</h3>
              <div className="space-y-1 text-sm text-luxury-600">
                <div>{order.firstName} {order.lastName}</div>
                <div>{order.email}</div>
                <div>{order.phone}</div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border border-luxury-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-luxury-950 mb-2 flex items-center space-x-2">
                <Truck size={16} />
                <span>Адрес доставки</span>
              </h3>
              <div className="text-sm text-luxury-600">
                {order.shippingAddress && (
                  <>
                    <div>{order.shippingAddress.country}, {order.shippingAddress.city}</div>
                    <div>{order.shippingAddress.address}</div>
                    {order.shippingAddress.postalCode && (
                      <div>{order.shippingAddress.postalCode}</div>
                    )}
                    {order.shippingAddress.region && (
                      <div>{order.shippingAddress.region}</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="border border-luxury-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-luxury-950 mb-2">Способ оплаты</h3>
              <div className="text-sm text-luxury-600">
                {getPaymentMethodName(order.paymentMethod)}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="border border-luxury-200 rounded-lg p-4">
                <h3 className="font-semibold text-luxury-950 mb-2">Комментарий</h3>
                <div className="text-sm text-luxury-600">{order.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 text-center space-x-4">
          <Link
            to="/catalog"
            className="inline-flex items-center space-x-2 px-6 py-3 border border-luxury-950 text-luxury-950 hover:bg-luxury-950 hover:text-white transition-colors duration-300"
          >
            <ArrowLeft size={16} />
            <span>Продолжить покупки</span>
          </Link>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-luxury-950 text-white hover:bg-primary-950 transition-colors duration-300"
          >
            <Package size={16} />
            <span>Распечатать заказ</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-6 bg-luxury-50 rounded-lg">
          <h3 className="font-semibold text-luxury-950 mb-3">Что дальше?</h3>
          <div className="space-y-2 text-sm text-luxury-600">
            <div>• Мы свяжемся с вами в течение 24 часов для подтверждения заказа</div>
            <div>• Вы получите уведомление о статусе заказа на email</div>
            <div>• Среднее время доставки: 3-7 рабочих дней</div>
            <div>• По вопросам заказа обращайтесь по номеру заказа {order.orderNumber}</div>
          </div>
        </div>
      </div>
    </div>
  );
};