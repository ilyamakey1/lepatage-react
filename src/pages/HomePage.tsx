import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils/cn';

export const HomePage: React.FC = () => {
  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: featuredProducts } = trpc.products.getFeatured.useQuery({ limit: 6 });

  // Category sections data
  const categorySections = [
    {
      categories: ['corsets'],
      title: 'Корсеты',
      data: categories?.filter(cat => ['corsets'].includes(cat.slug))
    },
    {
      categories: ['bags'],
      title: 'Сумки',
      data: categories?.filter(cat => ['bags'].includes(cat.slug))
    },
    {
      categories: ['accessories'],
      title: 'Аксессуары',
      data: categories?.filter(cat => ['accessories'].includes(cat.slug))
    }
  ];

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

      {/* Category Sections */}
      {categorySections.map((section, sectionIndex) => (
        <section key={sectionIndex} className="min-h-screen flex flex-col lg:flex-row">
          {section.data?.map((category, index) => (
            <Link
              key={category.id}
              to={`/catalog/${category.slug}`}
              className={cn(
                'flex-1 relative overflow-hidden group transition-all duration-700 hover:flex-[1.2] min-h-[50vh] lg:min-h-screen',
                index === 0 ? 'lg:pr-1' : 'lg:pl-1'
              )}
            >
              <div className="absolute inset-0">
                <img
                  src={category.image || '/assets/placeholder.jpg'}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-950/60 via-luxury-950/20 to-luxury-950/30 group-hover:from-luxury-950/40" />
              </div>
              
              <div className="relative z-10 h-full flex items-end justify-center pb-16">
                <div className="text-center transform transition-all duration-700 group-hover:translate-y-[-20px] group-hover:scale-105">
                  <h3 className="font-display text-3xl md:text-4xl font-medium text-white mb-4 tracking-wider drop-shadow-lg">
                    {category.name}
                  </h3>
                  <div className="w-20 h-0.5 bg-white mx-auto transition-all duration-700 group-hover:w-32 group-hover:bg-primary-400" />
                </div>
              </div>
            </Link>
          ))}
        </section>
      ))}

      {/* Featured Products Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-24 px-6 lg:px-12 bg-white">
          <div className="w-full mx-auto">
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
              {featuredProducts.map((product) => (
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