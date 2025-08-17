import React, { useState } from 'react';
import { Mail, Users, Download, Trash2, RefreshCw, Shield, UserCheck, Package, Eye, Edit3, ShoppingBag, Plus } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';
import { ImageManager } from '../components/ImageManager';

export const AdminPage: React.FC = () => {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'users' | 'orders' | 'products'>('subscribers');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');
  const [orderToEdit, setOrderToEdit] = useState<any>(null);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductImages, setEditingProductImages] = useState<string[]>([]);
  
  const { state: authState } = useAuth();

  // Получаем подписчиков
  const { data: subscribers, isLoading: subscribersLoading, refetch: refetchSubscribers } = trpc.newsletter.getAllSubscribers.useQuery();
  
  // Получаем пользователей
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.auth.getAllUsers.useQuery();
  
  // Получаем заказы
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.orders.getAll.useQuery({
    limit: 50,
    offset: 0,
    status: selectedOrderStatus === 'all' ? undefined : selectedOrderStatus as any,
  });
  
  // Мутация для обновления статуса заказа
  const updateOrderMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
      setOrderToEdit(null);
    },
  });

  // Получаем товары
  const { data: allProducts, isLoading: productsLoading, refetch: refetchProducts } = trpc.products.getAll.useQuery({
    limit: 100,
  });

  // Получаем категории для выбора
  const { data: categories } = trpc.categories.getAll.useQuery();

  // Мутации для товаров
  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      refetchProducts();
      setProductToEdit(null);
      setEditingProductImages([]);
    },
  });

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      refetchProducts();
    },
  });

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      refetchProducts();
      setShowAddProduct(false);
    },
  });

  const handleSelectEmail = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (!subscribers) return;
    const activeEmails = subscribers.filter(sub => sub.isActive).map(sub => sub.email);
    setSelectedEmails(
      selectedEmails.length === activeEmails.length ? [] : activeEmails
    );
  };

  const exportEmails = () => {
    if (selectedEmails.length === 0) return;
    
    const emailList = selectedEmails.join('\n');
    const blob = new Blob([emailList], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lepatage-subscribers-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Проверяем права доступа (токен админа или авторизованный админ)
  const adminToken = localStorage.getItem('adminToken');
  const hasAdminAccess = adminToken === 'authenticated' || (authState.isAuthenticated && authState.user?.isAdmin);
  
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-semibold text-luxury-950 mb-2">Доступ запрещен</h1>
          <p className="text-luxury-700 mb-4">У вас нет прав для просмотра этой страницы</p>
          <button
            onClick={() => window.location.href = '/admin-login'}
            className="px-4 py-2 bg-primary-950 text-white hover:bg-primary-900 transition-colors duration-200"
          >
            Войти как администратор
          </button>
        </div>
      </div>
    );
  }

  if (subscribersLoading || usersLoading || ordersLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-950"></div>
      </div>
    );
  }

  const activeSubscribers = subscribers?.filter(sub => sub.isActive) || [];
  const inactiveSubscribers = subscribers?.filter(sub => !sub.isActive) || [];

  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-8 lg:px-12">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl md:text-4xl font-semibold text-luxury-950 mb-4">
              Админ-панель L'ÉPATAGE
            </h1>
            <p className="text-luxury-700">
              Управление подписчиками рассылки и пользователями сайта
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {authState.isAuthenticated && (
              <span className="text-sm text-luxury-600">
                {authState.user?.firstName} {authState.user?.lastName}
              </span>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                window.location.href = '/';
              }}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-2"
            >
              <span>Выйти</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-luxury-200 mb-8">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={cn(
              'px-6 py-3 font-medium text-sm transition-all duration-200',
              activeTab === 'subscribers'
                ? 'border-b-2 border-primary-950 text-primary-950'
                : 'text-luxury-600 hover:text-luxury-900'
            )}
          >
            <Mail className="inline mr-2" size={16} />
            Подписчики рассылки
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'px-6 py-3 font-medium text-sm transition-all duration-200',
              activeTab === 'users'
                ? 'border-b-2 border-primary-950 text-primary-950'
                : 'text-luxury-600 hover:text-luxury-900'
            )}
          >
            <UserCheck className="inline mr-2" size={16} />
            Пользователи сайта
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              'px-6 py-3 font-medium text-sm transition-all duration-200',
              activeTab === 'orders'
                ? 'border-b-2 border-primary-950 text-primary-950'
                : 'text-luxury-600 hover:text-luxury-900'
            )}
          >
            <Package className="inline mr-2" size={16} />
            Заказы
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              'px-6 py-3 font-medium text-sm transition-all duration-200',
              activeTab === 'products'
                ? 'border-b-2 border-primary-950 text-primary-950'
                : 'text-luxury-600 hover:text-luxury-900'
            )}
          >
            <ShoppingBag className="inline mr-2" size={16} />
            Товары
          </button>
        </div>

        {activeTab === 'subscribers' && (
          <>
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 p-6 rounded">
            <div className="flex items-center space-x-3">
              <Users className="text-green-600" size={24} />
              <div>
                <p className="text-green-800 font-medium">Активные подписчики</p>
                <p className="text-2xl font-bold text-green-900">{activeSubscribers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 p-6 rounded">
            <div className="flex items-center space-x-3">
              <Mail className="text-gray-600" size={24} />
              <div>
                <p className="text-gray-800 font-medium">Неактивные</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveSubscribers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-primary-50 border border-primary-200 p-6 rounded">
            <div className="flex items-center space-x-3">
              <Mail className="text-primary-700" size={24} />
              <div>
                <p className="text-primary-800 font-medium">Всего подписок</p>
                <p className="text-2xl font-bold text-primary-900">
                  {(subscribers?.length || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 border border-luxury-950 text-luxury-950 hover:bg-luxury-950 hover:text-white transition-all duration-300"
          >
            {selectedEmails.length === activeSubscribers.length ? 'Снять выделение' : 'Выбрать все'}
          </button>
          
          <button
            onClick={exportEmails}
            disabled={selectedEmails.length === 0}
            className="px-4 py-2 bg-primary-950 text-white hover:bg-primary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Экспорт ({selectedEmails.length})</span>
          </button>
          
          <button
            onClick={() => refetch()}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Обновить</span>
          </button>
        </div>

        {/* Subscribers List */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-luxury-950">
              Активные подписчики ({activeSubscribers.length})
            </h2>
          </div>
          
          {activeSubscribers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Пока нет активных подписчиков
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(subscriber.email)}
                      onChange={() => handleSelectEmail(subscriber.email)}
                      className="w-4 h-4 text-primary-950 border-gray-300 rounded focus:ring-primary-950"
                    />
                    <div>
                      <p className="font-medium text-luxury-950">{subscriber.email}</p>
                      <p className="text-sm text-gray-500">
                        Подписался: {new Date(subscriber.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Активный
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded">
          <h3 className="font-medium text-blue-900 mb-3">💡 Как использовать рассылку:</h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li><strong>1. Экспорт email-адресов:</strong> Выберите подписчиков и нажмите "Экспорт" для загрузки списка</li>
            <li><strong>2. Почтовые сервисы:</strong> Используйте MailChimp, SendGrid, или другие сервисы для отправки</li>
            <li><strong>3. Подписка на сайте:</strong> Форма подписки находится в футере сайта</li>
            <li><strong>4. Автоматические уведомления:</strong> Можно настроить уведомления о новых товарах</li>
          </ul>
        </div>
        </>
        )}

        {activeTab === 'users' && (
          <>
        {/* Users Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 p-6 rounded">
            <div className="flex items-center space-x-3">
              <UserCheck className="text-blue-600" size={24} />
              <div>
                <p className="text-blue-800 font-medium">Всего пользователей</p>
                <p className="text-2xl font-bold text-blue-900">{users?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 p-6 rounded">
            <div className="flex items-center space-x-3">
              <Shield className="text-purple-600" size={24} />
              <div>
                <p className="text-purple-800 font-medium">Администраторы</p>
                <p className="text-2xl font-bold text-purple-900">
                  {users?.filter(user => user.isAdmin).length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-6 rounded">
            <div className="flex items-center space-x-3">
              <Users className="text-green-600" size={24} />
              <div>
                <p className="text-green-800 font-medium">Обычные пользователи</p>
                <p className="text-2xl font-bold text-green-900">
                  {users?.filter(user => !user.isAdmin).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => refetchUsers()}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Обновить</span>
          </button>
        </div>

        {/* Users List */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-luxury-950">
              Пользователи сайта ({users?.length || 0})
            </h2>
          </div>
          
          {!users || users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Пока нет зарегистрированных пользователей
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-luxury-950">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-500">Телефон: {user.phone}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {user.isAdmin ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded flex items-center space-x-1">
                          <Shield size={12} />
                          <span>Админ</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          Пользователь
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users Instructions */}
        <div className="mt-8 bg-green-50 border border-green-200 p-6 rounded">
          <h3 className="font-medium text-green-900 mb-3">👥 Управление пользователями:</h3>
          <ul className="text-green-800 text-sm space-y-2">
            <li><strong>1. Регистрация:</strong> Пользователи могут зарегистрироваться через кнопку входа в header</li>
            <li><strong>2. Администраторы:</strong> Имеют доступ к этой панели и могут управлять сайтом</li>
            <li><strong>3. Авторизация:</strong> Система использует JWT токены для безопасной авторизации</li>
            <li><strong>4. Доступ к админ-панели:</strong> Только для пользователей с правами администратора</li>
          </ul>
        </div>
        </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {/* Products Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-luxury-950">Управление товарами</h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-950 text-white hover:bg-primary-700 transition-colors duration-200"
              >
                <Plus size={16} />
                <span>Добавить товар</span>
              </button>
            </div>

            {/* Products Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded">
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="text-blue-600" size={24} />
                  <div>
                    <p className="text-blue-900 font-semibold text-lg">
                      {allProducts?.length || 0}
                    </p>
                    <p className="text-blue-700 text-sm">Всего товаров</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 p-6 rounded">
                <div className="flex items-center space-x-3">
                  <Package className="text-green-600" size={24} />
                  <div>
                    <p className="text-green-900 font-semibold text-lg">
                      {allProducts?.filter(p => p.inStock).length || 0}
                    </p>
                    <p className="text-green-700 text-sm">В наличии</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-6 rounded">
                <div className="flex items-center space-x-3">
                  <Package className="text-purple-600" size={24} />
                  <div>
                    <p className="text-purple-900 font-semibold text-lg">
                      {allProducts?.filter(p => p.featured).length || 0}
                    </p>
                    <p className="text-purple-700 text-sm">Рекомендуемые</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-6 rounded">
                <div className="flex items-center space-x-3">
                  <Package className="text-orange-600" size={24} />
                  <div>
                    <p className="text-orange-900 font-semibold text-lg">
                      {allProducts?.filter(p => p.onSale).length || 0}
                    </p>
                    <p className="text-orange-700 text-sm">Со скидкой</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white border border-luxury-200 rounded overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-luxury-50 border-b border-luxury-200 text-sm font-medium text-luxury-900">
                <div className="col-span-3">Товар</div>
                <div className="col-span-2">Категория</div>
                <div className="col-span-2">Цена</div>
                <div className="col-span-2">Статус</div>
                <div className="col-span-1">Наличие</div>
                <div className="col-span-2">Действия</div>
              </div>

              {allProducts && allProducts.length > 0 ? (
                allProducts.map((product: any) => (
                  <div key={product.id} className="grid grid-cols-12 gap-4 p-4 border-b border-luxury-100 hover:bg-luxury-25 transition-colors">
                    <div className="col-span-3 flex items-center space-x-3">
                      <img
                        src={(product.images && product.images.length > 0) ? product.images[0] : '/assets/placeholder.jpg'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium text-luxury-950">{product.name}</div>
                        <div className="text-sm text-luxury-600">{product.slug}</div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-luxury-700">
                        {product.category?.name || 'Без категории'}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <div>
                        <div className="font-medium text-luxury-950">
                          {product.salePrice ? (
                            <>
                              <span className="text-red-600">{product.salePrice}₽</span>
                              <span className="text-sm text-luxury-500 line-through ml-2">{product.price}₽</span>
                            </>
                          ) : (
                            <span>{product.price}₽</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center space-x-2">
                      {product.featured && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          Рекомендуемый
                        </span>
                      )}
                      {product.isNew && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Новый
                        </span>
                      )}
                      {product.onSale && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Скидка
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center">
                      <span className={cn(
                        "px-2 py-1 text-xs rounded",
                        product.inStock
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}>
                        {product.inStock ? 'В наличии' : 'Нет в наличии'}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setProductToEdit(product);
                          setEditingProductImages(product.images || []);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Редактировать"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить этот товар?')) {
                            deleteProductMutation.mutate({ id: product.id });
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-luxury-600">
                  Товаров пока нет
                </div>
              )}
            </div>

            {/* Product Edit Modal */}
            {productToEdit && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Редактировать товар</h3>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const images = formData.get('images') as string;
                      const colors = formData.get('colors') as string;
                      const sizes = formData.get('sizes') as string;
                      
                      updateProductMutation.mutate({
                        id: productToEdit.id,
                        name: formData.get('name') as string,
                        description: formData.get('description') as string,
                        shortDescription: formData.get('shortDescription') as string,
                        price: parseFloat(formData.get('price') as string),
                        salePrice: formData.get('salePrice') ? parseFloat(formData.get('salePrice') as string) : undefined,
                        images: images ? images.split(',').map(s => s.trim()).filter(Boolean) : [],
                        colors: colors ? colors.split(',').map(s => s.trim()).filter(Boolean) : [],
                        sizes: sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
                        inStock: formData.get('inStock') === 'on',
                        featured: formData.get('featured') === 'on',
                        isNew: formData.get('isNew') === 'on',
                        onSale: formData.get('onSale') === 'on',
                      });
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Название</label>
                          <input
                            name="name"
                            type="text"
                            defaultValue={productToEdit.name}
                            className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Цена</label>
                            <input
                              name="price"
                              type="number"
                              step="0.01"
                              defaultValue={productToEdit.price}
                              className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Цена со скидкой</label>
                            <input
                              name="salePrice"
                              type="number"
                              step="0.01"
                              defaultValue={productToEdit.salePrice || ''}
                              className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Краткое описание</label>
                          <input
                            name="shortDescription"
                            type="text"
                            defaultValue={productToEdit.shortDescription || ''}
                            className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Описание</label>
                          <textarea
                            name="description"
                            rows={4}
                            defaultValue={productToEdit.description || ''}
                            className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Изображения товара</label>
                          <ImageManager
                            images={editingProductImages}
                            onImagesChange={setEditingProductImages}
                            maxImages={8}
                          />
                          {/* Hidden input for form submission */}
                          <input
                            type="hidden"
                            name="images"
                            value={editingProductImages.join(',')}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Цвета (через запятую)</label>
                            <input
                              name="colors"
                              type="text"
                              defaultValue={(productToEdit.colors || []).join(', ')}
                              className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                              placeholder="#000000, #ffffff, #ff0000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Размеры (через запятую)</label>
                            <input
                              name="sizes"
                              type="text"
                              defaultValue={(productToEdit.sizes || []).join(', ')}
                              className="w-full px-3 py-2 border border-luxury-300 rounded focus:outline-none focus:border-primary-700"
                              placeholder="XS, S, M, L, XL"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              name="inStock"
                              type="checkbox"
                              defaultChecked={productToEdit.inStock}
                              className="rounded"
                            />
                            <label className="text-sm">В наличии</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              name="featured"
                              type="checkbox"
                              defaultChecked={productToEdit.featured}
                              className="rounded"
                            />
                            <label className="text-sm">Рекомендуемый</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              name="isNew"
                              type="checkbox"
                              defaultChecked={productToEdit.isNew}
                              className="rounded"
                            />
                            <label className="text-sm">Новый</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              name="onSale"
                              type="checkbox"
                              defaultChecked={productToEdit.onSale}
                              className="rounded"
                            />
                            <label className="text-sm">Со скидкой</label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setProductToEdit(null);
                            setEditingProductImages([]);
                          }}
                          className="px-4 py-2 border border-luxury-300 text-luxury-700 hover:bg-luxury-50 transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          disabled={updateProductMutation.isLoading}
                          className="px-4 py-2 bg-primary-950 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          {updateProductMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Products Instructions */}
            <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded">
              <h3 className="font-medium text-blue-900 mb-3">🛍️ Управление товарами:</h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li><strong>1. Добавление:</strong> Нажмите "Добавить товар" для создания нового товара</li>
                <li><strong>2. Редактирование:</strong> Нажмите иконку редактирования для изменения товара</li>
                <li><strong>3. Изображения:</strong> Укажите URL изображений через запятую</li>
                <li><strong>4. Цвета:</strong> Используйте HEX коды цветов (#000000, #ffffff)</li>
                <li><strong>5. Размеры:</strong> Укажите доступные размеры через запятую</li>
                <li><strong>6. Статусы:</strong> Используйте чекбоксы для установки статусов товара</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};