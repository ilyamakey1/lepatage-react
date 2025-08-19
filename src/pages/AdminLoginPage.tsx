import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.user.isAdmin) {
        const result = await login(email, password);
        if (result.success) {
          navigate('/admin');
        } else {
          setError(result.message);
        }
      } else {
        setError('Доступ запрещен. Требуются права администратора.');
      }
    },
    onError: (error) => {
      setError(error.message || 'Ошибка входа');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex justify-center">
            <Lock className="h-12 w-12 text-primary-950" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-luxury-950">
            Вход в админ панель
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-luxury-950">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-luxury-950 shadow-sm ring-1 ring-inset ring-luxury-300 placeholder:text-luxury-400 focus:ring-2 focus:ring-inset focus:ring-primary-950 sm:text-sm sm:leading-6"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-luxury-950">
                Пароль
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-3 pr-10 text-luxury-950 shadow-sm ring-1 ring-inset ring-luxury-300 placeholder:text-luxury-400 focus:ring-2 focus:ring-inset focus:ring-primary-950 sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-luxury-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-luxury-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex w-full justify-center rounded-md bg-primary-950 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? 'Вход...' : 'Войти'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
