import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Instagram, Send, ChevronDown } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { cn } from '../utils/cn';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <footer className="bg-luxury-950 text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* Mobile Accordion / Desktop Grid */}
        <div className="md:grid md:grid-cols-4 md:gap-12">
          {/* Contacts */}
          <div className="border-b border-white/10 md:border-0 pb-4 md:pb-0 mb-4 md:mb-0">
            <button 
              onClick={() => toggleSection('contacts')}
              className="w-full flex items-center justify-between py-2 md:pointer-events-none"
            >
              <h3 className="font-medium text-white tracking-wide">Контакты</h3>
              <ChevronDown 
                size={20} 
                className={cn(
                  "md:hidden transition-transform duration-300",
                  expandedSection === 'contacts' && "rotate-180"
                )} 
              />
            </button>
            <div className={cn(
              "overflow-hidden transition-all duration-300 md:overflow-visible md:max-h-none md:mt-4",
              expandedSection === 'contacts' ? "max-h-40 mt-3" : "max-h-0 md:max-h-none"
            )}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-white/50" />
                  <span className="text-white/80 text-sm">+7 (XXX) XXX-XX-XX</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-white/50" />
                  <a 
                    href="mailto:info@lepatage.com" 
                    className="text-white/80 hover:text-white transition-colors text-sm"
                  >
                    info@lepatage.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Info */}
          <div className="border-b border-white/10 md:border-0 pb-4 md:pb-0 mb-4 md:mb-0">
            <button 
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center justify-between py-2 md:pointer-events-none"
            >
              <h3 className="font-medium text-white tracking-wide">Информация</h3>
              <ChevronDown 
                size={20} 
                className={cn(
                  "md:hidden transition-transform duration-300",
                  expandedSection === 'legal' && "rotate-180"
                )} 
              />
            </button>
            <div className={cn(
              "overflow-hidden transition-all duration-300 md:overflow-visible md:max-h-none md:mt-4",
              expandedSection === 'legal' ? "max-h-48 mt-3" : "max-h-0 md:max-h-none"
            )}>
              <ul className="space-y-2">
                <li>
                  <Link to="/offer" className="text-white/80 hover:text-white transition-colors text-sm">
                    Публичная оферта
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-white/80 hover:text-white transition-colors text-sm">
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link to="/admin-login" className="text-white/80 hover:text-white transition-colors text-sm">
                    Админ-панель
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Networks */}
          <div className="border-b border-white/10 md:border-0 pb-4 md:pb-0 mb-4 md:mb-0">
            <button 
              onClick={() => toggleSection('social')}
              className="w-full flex items-center justify-between py-2 md:pointer-events-none"
            >
              <h3 className="font-medium text-white tracking-wide">Мы в соцсетях</h3>
              <ChevronDown 
                size={20} 
                className={cn(
                  "md:hidden transition-transform duration-300",
                  expandedSection === 'social' && "rotate-180"
                )} 
              />
            </button>
            <div className={cn(
              "overflow-hidden transition-all duration-300 md:overflow-visible md:max-h-none md:mt-4",
              expandedSection === 'social' ? "max-h-20 mt-3" : "max-h-0 md:max-h-none"
            )}>
              <div className="flex gap-3">
                <a 
                  href="https://www.instagram.com/lepatage.brand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Instagram size={20} className="text-white" />
                </a>
                <a 
                  href="#" 
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Send size={20} className="text-white" />
                </a>
                <a 
                  href="#" 
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <span className="text-white font-bold text-sm">VK</span>
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-medium text-white tracking-wide py-2 md:py-0 md:mb-4">
              Рассылка
            </h3>
            <form onSubmit={handleNewsletterSubmit} className="mt-3 md:mt-0 space-y-3">
              <input
                type="email"
                placeholder="Ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="w-full px-4 py-3 bg-white text-luxury-950 font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors active:scale-[0.98]"
              >
                {isSubscribing ? 'ПОДПИСКА...' : 'ПОДПИСАТЬСЯ'}
              </button>
              {message && (
                <p className={cn(
                  "text-sm",
                  newsletterMutation.data?.success ? 'text-green-400' : 'text-orange-400'
                )}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <div className="text-center text-white/50 text-sm">
            <p>&copy; 2024 L'ÉPATAGE. Все права защищены.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
