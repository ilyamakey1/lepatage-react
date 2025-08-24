import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './utils/trpc';
import { getApiUrl } from './utils/apiConfig';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import './index.css';

function App() {
  // Показываем лоадер только если это первое посещение за сессию
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const hasVisited = sessionStorage.getItem('lepatage-visited');
      return !hasVisited; // Показываем только если не посещали
    } catch (e) {
      return false; // Если ошибка с sessionStorage, не показываем
    }
  });

  const handleLoadingComplete = () => {
    try {
      sessionStorage.setItem('lepatage-visited', 'true');
    } catch (e) {
      console.log('SessionStorage not available');
    }
    setIsLoading(false);
  };
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      },
    },
  }));

  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getApiUrl(),
        }),
      ],
    })
  );

  return (
    <>
      {isLoading && (
        <LoadingScreen 
          onComplete={handleLoadingComplete}
          duration={2000}
        />
      )}
      
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <Router>
                  <div className="min-h-screen bg-white text-luxury-950">
                    {!isLoading && <Header />}
                    
                    <main>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/catalog/:categorySlug" element={<CatalogPage />} />
                        <Route path="/products/:slug" element={<ProductPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/admin-login" element={<AdminLoginPage />} />
                        <Route path="*" element={<div className="pt-24 min-h-screen flex items-center justify-center"><h1 className="text-luxury-950 font-sans text-3xl">Page Not Found</h1></div>} />
                      </Routes>
                    </main>
                    
                    {!isLoading && <Footer />}
                  </div>
                </Router>
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </>
  );
}

export default App;