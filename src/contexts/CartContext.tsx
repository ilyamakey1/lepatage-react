import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; color?: string; size?: string } }
  | { type: 'REMOVE_ITEM'; payload: number } // product ID
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, color, size } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => 
          item.product.id === product.id && 
          item.selectedColor === color && 
          item.selectedSize === size
      );

      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Увеличиваем количество существующего товара
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Добавляем новый товар
        const newItem: CartItem = {
          product,
          quantity: 1,
          selectedColor: color,
          selectedSize: size,
        };
        newItems = [...state.items, newItem];
      }

      const newTotal = newItems.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case 'REMOVE_ITEM': {
      const productId = action.payload;
      const newItems = state.items.filter(item => item.product.id !== productId);
      
      const newTotal = newItems.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Если количество 0 или меньше, удаляем товар
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: productId });
      }

      const newItems = state.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );

      const newTotal = newItems.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (product: Product, color?: string, size?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (product: Product, color?: string, size?: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, color, size } });
  };

  const removeItem = (productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}