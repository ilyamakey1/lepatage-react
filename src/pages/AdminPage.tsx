import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trpc } from '../utils/trpc';
import { Package, Users, ShoppingCart, LogOut, Plus, Edit, Trash2, X, Home } from 'lucide-react';
import { ImageManager } from '../components/ImageManager';
import { HomepageEditor } from '../components/HomepageEditor';

export const AdminPage: React.FC = () => {
  const { state, logout } = useAuth();
  const { user } = state;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    images: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    inStock: true,
    featured: false,
    isNew: false,
    onSale: false,
    categoryId: ''
  });

  const { data: products, refetch: refetchProducts } = trpc.products.getAll.useQuery({
    limit: 100
  });

  // Загружаем заказы и пользователей для админ панели
  const { data: orders } = trpc.orders.getAll.useQuery({ limit: 100, offset: 0 });
  const { data: users } = trpc.auth.getAllUsers.useQuery();
  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: newsletterSubscriptions } = trpc.newsletter.getAllSubscribers.useQuery();
  const { data: customOrders } = trpc.customOrders.getAll.useQuery({ limit: 100, offset: 0 });
  
  

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      refetchProducts();
    },
  });

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      refetchProducts();
      setIsCreating(false);
      resetForm();
    },
  });

  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      refetchProducts();
      setIsEditing(false);
      setEditingProduct(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setProductForm({
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      price: '',
      salePrice: '',
      images: [],
      colors: [],
      sizes: [],
      inStock: true,
      featured: false,
      isNew: false,
      onSale: false,
      categoryId: ''
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      deleteProductMutation.mutate({ id: productId });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price.toString(),
      salePrice: product.salePrice ? product.salePrice.toString() : '',
      images: product.images || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      inStock: product.inStock,
      featured: product.featured,
      isNew: product.isNew,
      onSale: product.onSale,
      categoryId: product.categoryId?.toString() || ''
    });
    setIsEditing(true);
  };

  const handleCreateProduct = () => {
    setIsCreating(true);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.categoryId) {
      alert('Пожалуйста, выберите категорию');
      return;
    }

    const productData = {
      ...productForm,
      price: parseFloat(productForm.price),
      salePrice: productForm.salePrice ? parseFloat(productForm.salePrice) : undefined,
      categoryId: parseInt(productForm.categoryId)
    };

    if (isEditing && editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        ...productData
      });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-luxury-950 mb-4">Доступ запрещен</h1>
          <p className="text-luxury-600 mb-6">У вас нет прав для доступа к админ панели</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-luxury-950 text-white hover:bg-primary-950 transition-colors duration-300"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20 sm:pt-24">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-luxury-950">Админ панель</h1>
            <p className="text-luxury-600 text-sm sm:text-base">Добро пожаловать, {user.firstName} {user.lastName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors duration-300 rounded"
          >
            <LogOut size={16} />
            <span>Выйти</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-luxury-100 p-1 rounded-lg mb-6 sm:mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-300 text-sm sm:text-base ${
              activeTab === 'products'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <Package size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Товары</span>
            <span className="sm:hidden">Т</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-300 text-sm sm:text-base ${
              activeTab === 'orders'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Заказы</span>
            <span className="sm:hidden">З</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-300 text-sm sm:text-base ${
              activeTab === 'users'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <Users size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Пользователи</span>
            <span className="sm:hidden">П</span>
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-300 text-sm sm:text-base ${
              activeTab === 'newsletter'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <Package size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Подписчики</span>
            <span className="sm:hidden">Н</span>
          </button>
          <button
            onClick={() => setActiveTab('custom-orders')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-300 text-sm sm:text-base ${
              activeTab === 'custom-orders'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Индивидуальные заказы</span>
            <span className="sm:hidden">И</span>
          </button>
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-300 text-sm sm:text-base ${
              activeTab === 'homepage'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <Home size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Главная страница</span>
            <span className="sm:hidden">Г</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-luxury-200">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-luxury-950">Управление товарами</h2>
                <button 
                  onClick={handleCreateProduct}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-950 text-white hover:bg-primary-900 transition-colors duration-300 rounded"
                >
                  <Plus size={16} />
                  <span>Добавить товар</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-luxury-200">
                  <thead className="bg-luxury-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                        Товар
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                        Категория
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                        Цена
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-luxury-200">
                    {products?.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={product.images?.[0] || '/assets/placeholder.jpg'}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-luxury-950">{product.name}</div>
                              <div className="text-sm text-luxury-500">{product.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                          {product.category?.name || 'Без категории'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                          {product.price} Br
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.inStock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.inStock ? 'В наличии' : 'Нет в наличии'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-luxury-950 mb-6">Заказы</h2>
              {orders && orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-luxury-200">
                    <thead className="bg-luxury-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Номер заказа
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Клиент
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Дата
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-luxury-200">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-luxury-950">
                            {order.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                            <div>
                              <div className="font-medium">{order.firstName} {order.lastName}</div>
                              <div className="text-luxury-500">{order.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                            {order.total} {order.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'pending' ? 'Обрабатывается' :
                               order.status === 'confirmed' ? 'Подтвержден' :
                               order.status === 'shipped' ? 'Отправлен' :
                               order.status === 'delivered' ? 'Доставлен' :
                               order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-500">
                            {new Date(order.createdAt || '').toLocaleDateString('ru-RU')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-luxury-600">Заказов пока нет</div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-luxury-950 mb-6">Пользователи</h2>
              {users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-luxury-200">
                    <thead className="bg-luxury-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Пользователь
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Телефон
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Роль
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Дата регистрации
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-luxury-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-luxury-950">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-500">
                            {user.phone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isAdmin ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.isAdmin ? 'Администратор' : 'Пользователь'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-500">
                            {new Date(user.createdAt || '').toLocaleDateString('ru-RU')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-luxury-600">Пользователей пока нет</div>
              )}
            </div>
          )}

          {/* Newsletter Subscribers Tab */}
          {activeTab === 'newsletter' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-luxury-950 mb-6">Подписчики на рассылку</h2>
              {newsletterSubscriptions && newsletterSubscriptions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-luxury-200">
                    <thead className="bg-luxury-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Имя
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Источник
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Дата подписки
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-luxury-200">
                      {newsletterSubscriptions.map((subscriber) => (
                        <tr key={subscriber.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-luxury-950">
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                            {subscriber.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              subscriber.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {subscriber.isActive ? 'Активен' : 'Неактивен'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-500">
                            website
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-500">
                            {new Date(subscriber.createdAt || '').toLocaleDateString('ru-RU')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-luxury-600">Подписчиков пока нет</div>
              )}
            </div>
          )}

          {/* Custom Orders Tab */}
          {activeTab === 'custom-orders' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-luxury-950 mb-6">Индивидуальные заказы</h2>
              {customOrders && customOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-luxury-200">
                    <thead className="bg-luxury-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Номер заказа
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Клиент
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Инициалы
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Мерки
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-luxury-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-luxury-200">
                      {customOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-luxury-950">
                            {order.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                            <div>
                              <div className="font-medium">{order.name}</div>
                              <div className="text-luxury-500">{order.email}</div>
                              <div className="text-luxury-500">{order.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                            <div>
                              <div className="font-medium">{order.initials}</div>
                              <div className="text-luxury-500 capitalize">
                                {order.metalType === 'gold' ? 'Золото' : 'Серебро'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-950">
                            {order.sendMeasurementsLater ? (
                              <span className="text-blue-600">Вышлет позже</span>
                            ) : (
                              <div className="text-xs">
                                {order.bust && <div>Грудь: {order.bust}см</div>}
                                {order.waist && <div>Талия: {order.waist}см</div>}
                                {order.hips && <div>Бёдра: {order.hips}см</div>}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status === 'new' ? 'Новый' :
                               order.status === 'in_progress' ? 'В работе' :
                               order.status === 'completed' ? 'Завершен' :
                               order.status === 'cancelled' ? 'Отменен' :
                               order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-luxury-500">
                            {new Date(order.createdAt || '').toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => alert(`Детали заказа:\n\nКлиент: ${order.name}\nEmail: ${order.email}\nТелефон: ${order.phone}\n\nИнициалы: ${order.initials}\nМатериал: ${order.metalType === 'gold' ? 'Золото' : 'Серебро'}\n\nАдрес: ${order.country}, ${order.city}\n${order.address}\n\nСпособ доставки: ${order.deliveryMethod}\nЖелаемая дата: ${order.desiredDate || 'Не указана'}\n\nКомментарии: ${order.figureComments || 'Нет'}`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Подробнее
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-luxury-600">Индивидуальных заказов пока нет</div>
              )}
            </div>
          )}

          {/* Homepage Tab */}
          {activeTab === 'homepage' && (
            <div className="p-6">
              <HomepageEditor />
            </div>
          )}
        </div>

        {/* Product Form Modal */}
        {(isCreating || isEditing) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-luxury-950">
                  {isEditing ? 'Редактировать товар' : 'Создать новый товар'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="text-luxury-500 hover:text-luxury-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Название товара *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={productForm.slug}
                      onChange={(e) => setProductForm({...productForm, slug: e.target.value})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Категория *
                    </label>
                    <select
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({...productForm, categoryId: e.target.value})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Цена *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Цена со скидкой
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.salePrice}
                      onChange={(e) => setProductForm({...productForm, salePrice: e.target.value})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Краткое описание
                    </label>
                    <textarea
                      value={productForm.shortDescription}
                      onChange={(e) => setProductForm({...productForm, shortDescription: e.target.value})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Полное описание
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Изображения
                    </label>
                    <ImageManager
                      images={productForm.images}
                      onImagesChange={(images) => setProductForm({...productForm, images})}
                      maxImages={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Цвета (через запятую)
                    </label>
                    <input
                      type="text"
                      value={productForm.colors.join(', ')}
                      onChange={(e) => setProductForm({...productForm, colors: e.target.value.split(',').map(c => c.trim()).filter(c => c)})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      placeholder="#000000, #ffffff"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-luxury-950 mb-2">
                      Размеры (через запятую)
                    </label>
                    <input
                      type="text"
                      value={productForm.sizes.join(', ')}
                      onChange={(e) => setProductForm({...productForm, sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                      className="w-full px-3 py-2 border border-luxury-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-950"
                      placeholder="XS, S, M, L, XL"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm({...productForm, inStock: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-luxury-950">В наличии</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({...productForm, featured: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-luxury-950">Рекомендуемый</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.isNew}
                      onChange={(e) => setProductForm({...productForm, isNew: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-luxury-950">Новинка</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.onSale}
                      onChange={(e) => setProductForm({...productForm, onSale: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-luxury-950">Со скидкой</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-luxury-300 text-luxury-700 hover:bg-luxury-50 transition-colors duration-300 rounded"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    className="px-6 py-2 bg-primary-950 text-white hover:bg-primary-900 transition-colors duration-300 rounded disabled:opacity-50"
                  >
                    {createProductMutation.isPending || updateProductMutation.isPending 
                      ? 'Сохранение...' 
                      : (isEditing ? 'Обновить' : 'Создать')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
