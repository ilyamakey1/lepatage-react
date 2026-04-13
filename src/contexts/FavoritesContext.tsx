import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';

interface FavoritesContextType {
  favorites: Product[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: number) => void;
  isInFavorites: (productId: number) => boolean;
  toggleFavorite: (product: Product) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Product[]>([]);

  // Загружаем избранное из localStorage при инициализации
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('lepatage-favorites');
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites);
        // Убеждаемся, что это массив
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      // В случае ошибки очищаем поврежденные данные
      try {
        localStorage.removeItem('lepatage-favorites');
      } catch (e) {
        // Игнорируем ошибки при удалении
      }
    }
  }, []);

  // Сохраняем избранное в localStorage при изменении
  useEffect(() => {
    try {
      if (favorites.length > 0) {
        localStorage.setItem('lepatage-favorites', JSON.stringify(favorites));
      } else {
        // Если избранное пустое, удаляем из localStorage
        localStorage.removeItem('lepatage-favorites');
      }
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
      // Если localStorage переполнен, пытаемся очистить старые данные
      if (error instanceof DOMException && error.code === 22) {
        console.warn('LocalStorage is full, trying to clear old data');
        try {
          // Оставляем только последние 50 товаров
          const limited = favorites.slice(-50);
          localStorage.setItem('lepatage-favorites', JSON.stringify(limited));
          setFavorites(limited);
        } catch (e) {
          console.error('Failed to save limited favorites:', e);
        }
      }
    }
  }, [favorites]);

  const addToFavorites = (product: Product) => {
    setFavorites(prev => {
      // Проверяем, нет ли уже этого товара в избранном
      if (!prev.find(p => p.id === product.id)) {
        // Убеждаемся, что сохраняем полный объект товара
        const productToAdd: Product = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          salePrice: product.salePrice,
          images: product.images || [],
          colors: product.colors || [],
          sizes: product.sizes || [],
          inStock: product.inStock ?? true,
          featured: product.featured ?? false,
          isNew: product.isNew ?? false,
          onSale: product.onSale ?? false,
          tags: product.tags || [],
          createdAt: product.createdAt || new Date().toISOString(),
          category: product.category,
        };
        return [...prev, productToAdd];
      }
      return prev;
    });
  };

  const removeFromFavorites = (productId: number) => {
    setFavorites(prev => prev.filter(p => p.id !== productId));
  };

  const isInFavorites = (productId: number) => {
    return favorites.some(p => p.id === productId);
  };

  const toggleFavorite = (product: Product) => {
    if (isInFavorites(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }
  };

  const value: FavoritesContextType = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isInFavorites,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
