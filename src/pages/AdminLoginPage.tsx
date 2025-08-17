import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn';

const ADMIN_PASSWORD = 'admin123'; // Можете изменить на любой пароль

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Проверяем, не авторизован ли уже как админ
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken === 'authenticated') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Имитируем небольшую задержку для UX
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        // Сохраняем токен админа в localStorage
        localStorage.setItem('adminToken', 'authenticated');
        navigate('/admin');
      } else {
        setError('Неверный пароль администратора');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Shield className="mx-auto text-primary-950 mb-4" size={48} />
          <h1 className="text-2xl font-semibold text-luxury-950 mb-2 font-sans">
            Админ-панель L'ÉPATAGE
          </h1>
          <p className="text-luxury-600">
            Введите пароль администратора для доступа
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-luxury-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-luxury-950 mb-2">
                Пароль администратора
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-luxury-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-luxury-300 focus:border-primary-950 focus:outline-none transition-colors duration-200"
                  placeholder="Введите пароль"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-luxury-400 hover:text-luxury-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className={cn(
                "w-full py-3 font-medium tracking-wider transition-all duration-200 text-sm",
                isLoading || !password.trim()
                  ? "bg-luxury-300 text-luxury-500 cursor-not-allowed"
                  : "bg-primary-950 hover:bg-primary-900 text-white"
              )}
            >
              {isLoading ? 'ПРОВЕРКА...' : 'ВОЙТИ В АДМИН-ПАНЕЛЬ'}
            </button>
          </form>

          {/* Help */}
          <div className="mt-6 pt-4 border-t border-luxury-200 text-center">
            <p className="text-xs text-luxury-600">
              Если вы забыли пароль, обратитесь к разработчику
            </p>
          </div>
        </div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-luxury-600 hover:text-primary-950 transition-colors duration-200"
          >
            ← Вернуться на сайт
          </button>
        </div>

        {/* Password hint for development */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 text-center">
          <p className="text-xs text-yellow-800">
            <strong>Для разработки:</strong> Пароль по умолчанию: <code className="bg-yellow-100 px-1">admin123</code>
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Измените ADMIN_PASSWORD в AdminLoginPage.tsx для продакшена
          </p>
        </div>
      </div>
    </div>
  );
};