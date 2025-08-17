import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
    });
    setMessage('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      let result;
      
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
        });
      }

      if (result.success) {
        setMessage(result.message);
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else {
        setMessage(result.message);
      }
    } catch (error: any) {
      setMessage(error.message || 'Произошла ошибка');
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border border-luxury-200 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-luxury-200">
          <h2 className="text-xl font-medium text-luxury-950 font-sans">
            {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-luxury-600 hover:text-luxury-950 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex border border-luxury-300 mb-6">
            <button
              onClick={() => handleModeChange('login')}
              className={cn(
                'flex-1 py-2 px-4 text-sm font-medium transition-all duration-200',
                mode === 'login'
                  ? 'bg-primary-950 text-white'
                  : 'bg-white text-luxury-700 hover:bg-luxury-50'
              )}
            >
              Вход
            </button>
            <button
              onClick={() => handleModeChange('register')}
              className={cn(
                'flex-1 py-2 px-4 text-sm font-medium transition-all duration-200',
                mode === 'register'
                  ? 'bg-primary-950 text-white'
                  : 'bg-white text-luxury-700 hover:bg-luxury-50'
              )}
            >
              Регистрация
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-luxury-400" size={16} />
                    <input
                      type="text"
                      placeholder="Имя"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-luxury-300 focus:border-primary-950 focus:outline-none transition-colors duration-200 text-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-luxury-400" size={16} />
                    <input
                      type="text"
                      placeholder="Фамилия"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-luxury-300 focus:border-primary-950 focus:outline-none transition-colors duration-200 text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-luxury-400" size={16} />
                  <input
                    type="tel"
                    placeholder="Телефон (необязательно)"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-luxury-300 focus:border-primary-950 focus:outline-none transition-colors duration-200 text-sm"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-luxury-400" size={16} />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-luxury-300 focus:border-primary-950 focus:outline-none transition-colors duration-200 text-sm"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-luxury-400" size={16} />
              <input
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-luxury-300 focus:border-primary-950 focus:outline-none transition-colors duration-200 text-sm"
                required
                minLength={6}
              />
            </div>

            {message && (
              <div className={cn(
                'p-3 text-sm border text-center',
                message.includes('успешно') 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              )}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary-950 hover:bg-primary-900 disabled:bg-luxury-400 text-white font-medium transition-colors duration-200 text-sm tracking-wider"
            >
              {isSubmitting 
                ? (mode === 'login' ? 'ВХОД...' : 'РЕГИСТРАЦИЯ...')
                : (mode === 'login' ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ')
              }
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-4 border-t border-luxury-200 text-center text-xs text-luxury-600">
            {mode === 'login' 
              ? 'Нет аккаунта? Переключитесь на регистрацию'
              : 'Уже есть аккаунт? Переключитесь на вход'
            }
          </div>
        </div>
      </div>
    </div>
  );
};