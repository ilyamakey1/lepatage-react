import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';

export const HomePage: React.FC = () => {
  // Автоматический скролл вверх при загрузке страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: featuredProducts } = trpc.products.getFeatured.useQuery({ limit: 6 });

  return (
    <div className="min-h-screen bg-white text-luxury-950">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-white py-32">
        <div className="absolute inset-0">
          <img
            src="/assets/hero-woman-corset.jpg"
            alt="L'epatage Woman in Corset"
            className="w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105"
          />
        </div>
      </section>

      {/* Additional Info Blocks */}
      <section className="min-h-screen bg-white">
        <div className="h-screen grid grid-cols-1 md:grid-cols-2">
          {/* Left Block - Video */}
          <div className="relative bg-luxury-100 overflow-hidden">
            <video 
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
            >
              <source src="/assets/IMG_8424.MOV" type="video/quicktime" />
            </video>
          </div>

          {/* Right Block - Product Photo with Price Overlay */}
          <div className="relative bg-luxury-100 overflow-hidden">
            <div className="h-full relative">
              {/* Main Product Photo */}
              <img
                src="/assets/IMG_2083.JPG"
                alt="Фотография из папки майн"
                className="w-full h-full object-cover"
              />
              
              {/* Price Rectangle Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-6">
                <div className="flex items-start space-x-4">
                  {/* Small Product Photo */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                    <img
                      src="/assets/corset-avegue.jpg"
                      alt="Корсет ARMOR"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    {/* Product Name */}
                    <h3 className="text-luxury-950 font-bold text-xl mb-2">
                      Корсет ARMOR
                    </h3>
                    
                    {/* View Product Link */}
                    <Link
                      to="/product/corset-armor"
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200 hover:underline"
                    >
                      view product
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-24 px-8 lg:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-sans text-3xl md:text-4xl font-semibold text-luxury-950 mb-4 tracking-wide">
                Рекомендуемые товары
              </h2>
              <div className="w-16 h-px bg-primary-950 mx-auto mb-6" />
              <p className="text-lg text-luxury-700 max-w-xl mx-auto font-light leading-relaxed">
                Откройте для себя наши самые популярные изделия, созданные с любовью к деталям
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {featuredProducts.map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    ...product,
                    description: product.description || undefined,
                    shortDescription: product.shortDescription || undefined,
                    salePrice: product.salePrice || undefined,
                    inStock: product.inStock ?? true,
                    featured: product.featured ?? false,
                    isNew: product.isNew ?? false,
                    onSale: product.onSale ?? false,
                    createdAt: product.createdAt || new Date().toISOString(),
                    category: product.category || undefined
                  }}
                />
              ))}
            </div>

            <div className="text-center mt-16">
              <Link
                to="/catalog"
                className="inline-flex items-center space-x-2 px-6 py-3 border border-luxury-950 text-luxury-950 hover:bg-luxury-950 hover:text-white font-medium tracking-wider transition-all duration-300 group font-luxury text-sm"
              >
                <span>СМОТРЕТЬ ВСЕ ТОВАРЫ</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-24 px-8 lg:px-12 bg-luxury-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-sans text-3xl md:text-4xl font-semibold text-luxury-950 mb-4 tracking-wide">
            О бренде L'Épatage
          </h2>
          <div className="w-16 h-px bg-primary-950 mx-auto mb-8" />
          
          <div className="space-y-6 text-base md:text-lg text-luxury-700 leading-relaxed font-light">
            <p>
              L'Épatage — это бренд, который создает уникальные аксессуары для тех, 
              кто ценит качество, стиль и индивидуальность. Наши изделия сочетают в себе 
              современные тренды и классическую элегантность.
            </p>
            <p>
              Каждый продукт создается с любовью к деталям и вниманием к потребностям 
              наших клиентов. Мы используем только качественные материалы и следуем 
              последним тенденциям моды.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};