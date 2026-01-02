import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, LogOut, Heart, X, Menu, ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';
import { trpc } from '../utils/trpc';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { state: cartState } = useCart();
  const { state: authState, logout } = useAuth();
  const { favorites, removeFromFavorites } = useFavorites();
  
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const { data: _categories } = trpc.categories.getAll.useQuery();
  const { data: searchResults, isLoading: isSearchLoading } = trpc.products.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close panels on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsFavoritesOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Prevent body scroll when panels are open
  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen || isFavoritesOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isSearchOpen, isFavoritesOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Handle outside clicks (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
        setIsFavoritesOpen(false);
        setIsMobileMenuOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // На мобилке показываем фон везде кроме главной, на десктопе - только при скролле или не на главной
  const showMobileBackground = !isHomePage; // На мобилке фон на всех страницах кроме главной
  const showDesktopBackground = isScrolled || !isHomePage;
  const showBackground = isMobileMenuOpen || showDesktopBackground;
  const textColor = (showMobileBackground || showDesktopBackground) ? 'text-luxury-950' : 'text-white';

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        // Mobile: show background on all pages except home
        showMobileBackground ? "bg-white md:bg-transparent" : "bg-transparent",
        // Desktop: show background when scrolled or not on home
        showDesktopBackground && "md:bg-white/95 md:backdrop-blur-md"
      )}>
        <div className="w-full px-4 md:px-6 lg:px-8 safe-x">
          <div className="relative flex items-center justify-between h-14 md:h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn("md:hidden p-2 touch-btn transition-colors duration-200", textColor)}
              aria-label="Меню"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/catalog/corsets" className={cn("font-medium text-sm tracking-wider transition-all duration-300 hover:opacity-70", textColor)}>
                КОРСЕТЫ
              </Link>
              <Link to="/catalog/bags" className={cn("font-medium text-sm tracking-wider transition-all duration-300 hover:opacity-70", textColor)}>
                СУМКИ
              </Link>
              <Link to="/catalog/accessories" className={cn("font-medium text-sm tracking-wider transition-all duration-300 hover:opacity-70", textColor)}>
                АКСЕССУАРЫ
              </Link>
            </nav>

            {/* Logo - Center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Link to="/" className="block">
                <img
                  src="/assets/l'epatage_logo_black.png"
                  alt="L'ÉPATAGE"
                  className={cn("h-7 md:h-9 lg:h-10 w-auto transition-all duration-300", !showBackground && "brightness-0 invert")}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.src.includes('/assets/logo-center.png')) {
                      target.src = '/assets/logo-center.png';
                    }
                  }}
                />
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={cn("p-2 touch-btn transition-all duration-300", textColor)}
              >
                <Search size={20} />
              </button>

              {/* Favorites Button */}
              <button 
                onClick={() => setIsFavoritesOpen(true)}
                className={cn("relative p-2 touch-btn transition-all duration-300", textColor)}
              >
                <Heart size={20} />
                {favorites.length > 0 && (
                  <span className="absolute top-0 right-0 bg-luxury-950 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {favorites.length}
                  </span>
                )}
              </button>

              {/* Cart */}
              <Link to="/cart" className={cn("relative p-2 touch-btn transition-all duration-300", textColor)}>
                <ShoppingBag size={20} />
                {cartState.itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-luxury-950 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {cartState.itemCount}
                  </span>
                )}
              </Link>

              {/* User (Desktop) */}
              {authState.isAuthenticated ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={cn("p-2 touch-btn transition-all duration-300", textColor)}>
                    <User size={20} />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-luxury-100 overflow-hidden animate-fade-in-down z-50">
                      <div className="p-4 border-b border-luxury-100">
                        <p className="font-medium text-luxury-950">{authState.user?.firstName} {authState.user?.lastName}</p>
                        <p className="text-sm text-luxury-500">{authState.user?.email}</p>
                      </div>
                      <div className="py-2">
                        {authState.user?.isAdmin && (
                          <Link to="/admin" className="block px-4 py-2 text-luxury-700 hover:bg-luxury-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            Админ-панель
                          </Link>
                        )}
                        <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                          <LogOut size={16} />
                          <span>Выйти</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className={cn("hidden md:flex p-2 touch-btn transition-all duration-300", textColor)}>
                  <User size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== SEARCH PANEL - Full Screen on Mobile ===== */}
      <div className={cn(
        "fixed inset-0 z-[60] transition-all duration-300",
        isSearchOpen ? "visible" : "invisible pointer-events-none"
      )}>
        {/* Backdrop */}
        <div 
          className={cn("absolute inset-0 bg-black/50 transition-opacity duration-300", isSearchOpen ? "opacity-100" : "opacity-0")}
          onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
        />
        
        {/* Search Panel */}
        <div className={cn(
          "absolute inset-x-0 top-0 bg-white transition-transform duration-300 ease-out safe-top",
          "md:inset-x-auto md:right-4 md:left-auto md:top-4 md:w-[400px] md:rounded-2xl md:shadow-2xl",
          isSearchOpen ? "translate-y-0" : "-translate-y-full md:-translate-y-4 md:opacity-0"
        )}>
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="p-2 -ml-2 text-luxury-500 md:hidden"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-300" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-luxury-50 rounded-full text-luxury-950 placeholder-luxury-400 text-base border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none"
                style={{ WebkitAppearance: 'none', boxShadow: 'none' }}
              />
            </div>
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="hidden md:block p-2 text-luxury-400 hover:text-luxury-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[calc(100vh-80px)] md:max-h-[60vh] overflow-y-auto">
            {searchQuery.length >= 2 ? (
              isSearchLoading ? (
                <div className="p-8 text-center text-luxury-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-luxury-200 border-t-luxury-600 mx-auto mb-3" />
                  Поиск...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="divide-y divide-luxury-100">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      className="flex items-center gap-4 p-4 hover:bg-luxury-50 active:bg-luxury-100 transition-colors"
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                    >
                      <div className="w-16 h-16 bg-luxury-100 rounded-xl overflow-hidden flex-shrink-0">
                        {product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-luxury-950 font-medium text-base truncate">{product.name}</h4>
                        <p className="text-luxury-500 text-sm">{product.category?.name}</p>
                      </div>
                      <span className="text-luxury-950 font-semibold text-base whitespace-nowrap">
                        {product.salePrice || product.price} ₽
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-luxury-500">
                  <Search size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Ничего не найдено</p>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* ===== FAVORITES PANEL - Full Screen on Mobile ===== */}
      <div className={cn(
        "fixed inset-0 z-[60] transition-all duration-300",
        isFavoritesOpen ? "visible" : "invisible pointer-events-none"
      )}>
        {/* Backdrop */}
        <div 
          className={cn("absolute inset-0 bg-black/50 transition-opacity duration-300", isFavoritesOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setIsFavoritesOpen(false)}
        />
        
        {/* Favorites Panel */}
        <div className={cn(
          "absolute inset-y-0 right-0 w-full bg-white transition-transform duration-300 ease-out",
          "md:w-[400px] md:shadow-2xl",
          isFavoritesOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-luxury-100 safe-top">
            <button onClick={() => setIsFavoritesOpen(false)} className="p-2 -ml-2 text-luxury-600">
              <ArrowLeft size={22} />
            </button>
            <h2 className="flex-1 text-lg font-semibold text-luxury-950">
              Рекомендации ({favorites.length})
            </h2>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-64px)] overflow-y-auto safe-bottom">
            {favorites.length > 0 ? (
              <div className="divide-y divide-luxury-100">
                {favorites.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4">
                    <Link
                      to={`/products/${product.slug}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                      onClick={() => setIsFavoritesOpen(false)}
                    >
                      <div className="w-20 h-20 bg-luxury-100 rounded-xl overflow-hidden flex-shrink-0">
                        {product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-luxury-950 font-medium text-base line-clamp-2">{product.name}</h4>
                        <p className="text-luxury-600 font-semibold mt-1">{product.salePrice || product.price} ₽</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeFromFavorites(product.id)}
                      className="p-3 text-luxury-400 hover:text-red-500 active:scale-90 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Heart size={48} className="text-luxury-200 mb-4" />
                <p className="text-luxury-500 text-lg mb-2">Нет избранных товаров</p>
                <p className="text-luxury-400 text-sm">Нажмите ❤️ на товаре, чтобы добавить</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MOBILE MENU ===== */}
      <div className={cn(
        "md:hidden fixed inset-0 z-40 transition-all duration-500",
        isMobileMenuOpen ? "visible" : "invisible"
      )}>
        <div 
          className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500", isMobileMenuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        <div className={cn(
          "absolute top-0 left-0 w-4/5 max-w-sm h-full bg-white shadow-2xl transition-transform duration-500 ease-out overflow-y-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Spacer for header height */}
          <div className="h-14" />

          <nav className="p-6 space-y-1">
            {[
              { to: '/catalog/corsets', label: 'КОРСЕТЫ' },
              { to: '/catalog/bags', label: 'СУМКИ' },
              { to: '/catalog/accessories', label: 'АКСЕССУАРЫ' },
            ].map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className="block py-4 text-lg font-medium text-luxury-950 border-b border-luxury-100 transition-all duration-300 hover:text-luxury-600 hover:pl-2 animate-fade-in-left opacity-0"
                style={{ animationDelay: `${index * 0.05 + 0.1}s`, animationFillMode: 'forwards' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-6 border-t border-luxury-100 mt-auto">
            {authState.isAuthenticated ? (
              <div className="space-y-3">
                <div className="text-sm text-luxury-600">{authState.user?.firstName} {authState.user?.lastName}</div>
                {authState.user?.isAdmin && (
                  <Link to="/admin" className="block py-2 text-luxury-700" onClick={() => setIsMobileMenuOpen(false)}>
                    Админ-панель
                  </Link>
                )}
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 text-red-600 py-2">
                  <LogOut size={18} />
                  <span>Выйти</span>
                </button>
              </div>
            ) : (
              <button onClick={() => { setIsMobileMenuOpen(false); setIsAuthModalOpen(true); }} className="flex items-center gap-2 text-luxury-950 py-2">
                <User size={18} />
                <span>Войти</span>
              </button>
            )}
          </div>
        </div>
      </div>
    
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
