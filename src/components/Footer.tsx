import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Instagram, Send } from 'lucide-react';
import { trpc } from '../utils/trpc';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState('');

  const newsletterMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      if (data.success) {
        setEmail('');
      }
      setIsSubscribing(false);
    },
    onError: (error) => {
      setMessage(error.message);
      setIsSubscribing(false);
    }
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubscribing(true);
    setMessage('');
    newsletterMutation.mutate({ email });
  };

  return (
    <footer className="bg-luxury-950 text-white">
      <div className="max-w-6xl mx-auto px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Contacts */}
          <div className="space-y-4">
            <h3 className="font-sans text-lg font-medium text-white tracking-wide">
              Контакты
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-luxury-400" />
                <span className="text-white/80 text-sm">+7 (XXX) XXX-XX-XX</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} className="text-luxury-400" />
                <a 
                  href="mailto:info@lepatage.com" 
                  className="text-white/80 hover:text-white transition-colors duration-300 text-sm"
                >
                  info@lepatage.com
                </a>
              </div>
            </div>
          </div>

          {/* Legal Info */}
          <div className="space-y-4">
            <h3 className="font-sans text-lg font-medium text-white tracking-wide">
              Юридическая информация
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/offer" 
                  className="text-white/80 hover:text-white transition-all duration-300 font-luxury text-sm"
                >
                  Публичная оферта
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-white/80 hover:text-white transition-all duration-300 font-luxury text-sm"
                >
                  Политика обработки персональных данных
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="text-white/80 hover:text-white transition-all duration-300 font-luxury text-sm"
                >
                  Cookie-согласие
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin-login" 
                  className="text-white/80 hover:text-white transition-all duration-300 font-luxury text-sm"
                >
                  Админ-панель
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Networks */}
          <div className="space-y-4">
            <h3 className="font-sans text-lg font-medium text-white tracking-wide">
              Социальные сети
            </h3>
            <div className="flex space-x-3">
              <a 
                href="https://www.instagram.com/lepatage.brand?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 border border-luxury-600 hover:border-luxury-500 flex items-center justify-center transition-all duration-300"
                title="Перейти в Instagram L'EPATAGE"
              >
                <Instagram size={14} className="text-luxury-400 hover:text-luxury-300" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 border border-luxury-600 hover:border-luxury-500 flex items-center justify-center transition-all duration-300"
              >
                <Send size={14} className="text-luxury-400 hover:text-luxury-300" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 border border-luxury-600 hover:border-luxury-500 flex items-center justify-center transition-all duration-300"
              >
                <span className="text-luxury-400 hover:text-luxury-300 font-bold text-xs font-luxury">VK</span>
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-sans text-lg font-medium text-white tracking-wide">
              Рассылка
            </h3>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Ваш email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-luxury-600 text-white placeholder-white/50 focus:outline-none focus:border-luxury-500 transition-all duration-300 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubscribing}
                className="w-full px-4 py-2 border border-luxury-600 hover:bg-luxury-700 hover:border-luxury-500 disabled:opacity-50 text-white font-medium transition-all duration-300 font-luxury tracking-wider text-sm"
              >
                {isSubscribing ? 'ПОДПИСКА...' : 'ПОДПИСАТЬСЯ'}
              </button>
              {message && (
                <p className={`text-xs ${newsletterMutation.data?.success ? 'text-green-400' : 'text-orange-400'}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-luxury-700">
          <div className="text-center text-white/60 text-xs">
            <p className="font-luxury">&copy; 2024 L'ÉPATAGE. Все права защищены.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};