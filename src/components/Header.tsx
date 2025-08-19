import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';
import { trpc } from '../utils/trpc';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = () => {

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { state: cartState } = useCart();
  const { state: authState, logout } = useAuth();
  
  // Check if we're on homepage
  const isHomePage = location.pathname === '/';

  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: searchResults, isLoading: isSearchLoading } = trpc.products.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {

        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
      isHomePage ? (
        isScrolled ? 'bg-white/98 backdrop-blur-md minimal-border' : 'bg-transparent'
      ) : 'bg-white/98 backdrop-blur-md minimal-border',
      isScrolled && !isHomePage && 'bg-white'
    )}>
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Catalog and Navigation */}
          <div className="flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              <Link
                to="/catalog/corsets"
                className={cn(
                  "font-medium text-sm tracking-wider font-luxury transition-all duration-300",
                  isHomePage && !isScrolled 
                    ? "text-white hover:text-white/80" 
                    : "text-luxury-950 hover:text-primary-950"
                )}
              >
                КОРСЕТЫ
              </Link>
              <Link
                to="/catalog/bags"
                className={cn(
                  "font-medium text-sm tracking-wider font-luxury transition-all duration-300",
                  isHomePage && !isScrolled 
                    ? "text-white hover:text-white/80" 
                    : "text-luxury-950 hover:text-primary-950"
                )}
              >
                СУМКИ
              </Link>
              <Link
                to="/catalog/accessories"
                className={cn(
                  "font-medium text-sm tracking-wider font-luxury transition-all duration-300",
                  isHomePage && !isScrolled 
                    ? "text-white hover:text-white/80" 
                    : "text-luxury-950 hover:text-primary-950"
                )}
              >
                АКСЕССУАРЫ
              </Link>
            </nav>




          </div>

          {/* Center - Logo */}
          <div className="flex-1 flex justify-center">
            <Link to="/" className="block">
              <span 
                className={cn(
                  "font-serif text-xl font-light tracking-wide transition-all duration-300 hover:opacity-80",
                  isHomePage && !isScrolled 
                    ? "text-white" 
                    : "text-luxury-950"
                )}
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                L'ÉPATAGE
              </span>
            </Link>
          </div>

          {/* Right Side - Search, Cart, Account */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={cn(
                  "p-2 transition-all duration-300",
                  isHomePage && !isScrolled 
                    ? "text-white hover:text-white/80" 
                    : "text-luxury-950 hover:text-primary-950"
                )}
              >
                <Search size={16} />
              </button>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-1 w-72 glass-effect minimal-border rounded overflow-hidden animate-fade-in-up">
                  <div className="p-3">
                    <input
                      type="text"
                      placeholder="Поиск товаров..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-luxury-200 rounded text-luxury-950 placeholder-luxury-500 focus:outline-none focus:border-primary-950 transition-all duration-300 text-sm"
                      autoFocus
                    />
                  </div>

                  {searchQuery.length >= 2 && (
                    <div className="max-h-80 overflow-y-auto">
                      {isSearchLoading ? (
                        <div className="p-3 text-center text-luxury-500 text-sm">
                          Поиск...
                        </div>
                      ) : searchResults && searchResults.length > 0 ? (
                        <div>
                          <div className="px-3 py-2 border-b border-luxury-200 bg-luxury-50/50">
                            <p className="text-xs text-luxury-950 font-medium">
                              Найдено <span className="text-primary-950">{searchResults.length}</span> товаров
                            </p>
                          </div>
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              to={`/products/${product.slug}`}
                              className="flex items-center p-3 hover:bg-luxury-50 transition-colors duration-300 border-b border-luxury-100 last:border-b-0"
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                            >
                              <div className="w-8 h-8 bg-luxury-100 rounded flex items-center justify-center mr-2">
                                {product.images[0] ? (
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.name}
                                    className="w-6 h-6 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center">
                                    <span className="text-primary-950 text-xs">IMG</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-luxury-950 font-medium text-xs truncate">
                                  {product.name}
                                </h4>
                                <p className="text-luxury-600 text-xs">
                                  {product.category?.name}
                                </p>
                              </div>
                              <div className="text-primary-950 font-semibold text-xs">
                                ₽ {product.salePrice || product.price}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-luxury-500 text-sm">
                          Товары не найдены
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link 
              to="/cart" 
              className={cn(
                "relative p-2 transition-all duration-300",
                isHomePage && !isScrolled 
                  ? "text-white hover:text-white/80" 
                  : "text-luxury-950 hover:text-primary-950"
              )}
            >
              <ShoppingBag size={16} />
              {cartState.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-950 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium animate-scale-in">
                  {cartState.itemCount}
                </span>
              )}
            </Link>

            {authState.isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    "p-2 transition-all duration-300",
                    isHomePage && !isScrolled 
                      ? "text-white hover:text-white/80" 
                      : "text-luxury-950 hover:text-primary-950"
                  )}
                >
                  <User size={16} />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 glass-effect minimal-border overflow-hidden animate-fade-in-up">
                    <div className="p-3 border-b border-luxury-200">
                      <p className="text-sm font-medium text-luxury-950">
                        {authState.user?.firstName} {authState.user?.lastName}
                      </p>
                      <p className="text-xs text-luxury-600">{authState.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/account"
                        className="block px-3 py-2 text-sm text-luxury-700 hover:bg-luxury-50 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Мой аккаунт
                      </Link>
                      {authState.user?.isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-3 py-2 text-sm text-luxury-700 hover:bg-luxury-50 transition-colors duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Админ-панель
                        </Link>
                      )}
                      <Link
                        to="/admin-login"
                        className="block px-3 py-2 text-sm text-luxury-700 hover:bg-luxury-50 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Вход в админ-панель
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <LogOut size={14} />
                        <span>Выйти</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className={cn(
                  "p-2 transition-all duration-300",
                  isHomePage && !isScrolled 
                    ? "text-white hover:text-white/80" 
                    : "text-luxury-950 hover:text-primary-950"
                )}
              >
                <User size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
    
    {/* Auth Modal */}
    <AuthModal 
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
    />
  </>
  );
};