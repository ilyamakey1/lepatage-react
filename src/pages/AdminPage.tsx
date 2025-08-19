import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trpc } from '../utils/trpc';
import { cn } from '../utils/cn';
import { Settings, Package, Users, ShoppingCart, LogOut, Plus, Edit, Trash2 } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { state, logout } = useAuth();
  const { user } = state;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  const { data: products, refetch: refetchProducts } = trpc.products.getAll.useQuery({
    limit: 100
  });

  const { data: orders } = trpc.orders.getAll.useQuery({ limit: 100, offset: 0 });
  const { data: users } = trpc.auth.getAllUsers.useQuery();

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      refetchProducts();
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      deleteProductMutation.mutate({ id: productId });
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
    <div className="min-h-screen bg-white pt-24">
      <div className="w-full mx-auto px-6 lg:px-12 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-luxury-950">Админ панель</h1>
            <p className="text-luxury-600">Добро пожаловать, {user.firstName} {user.lastName}</p>
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
        <div className="flex space-x-1 bg-luxury-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${
              activeTab === 'products'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <Package size={16} />
            <span>Товары</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${
              activeTab === 'orders'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <ShoppingCart size={16} />
            <span>Заказы</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-white text-primary-950 shadow-sm'
                : 'text-luxury-600 hover:text-luxury-950'
            }`}
          >
            <Users size={16} />
            <span>Пользователи</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-luxury-200">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-luxury-950">Управление товарами</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary-950 text-white hover:bg-primary-900 transition-colors duration-300 rounded">
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
                            <button className="text-primary-600 hover:text-primary-900">
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
              <div className="text-luxury-600">Функционал управления заказами в разработке</div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-luxury-950 mb-6">Пользователи</h2>
              <div className="text-luxury-600">Функционал управления пользователями в разработке</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
