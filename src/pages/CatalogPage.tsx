import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils/cn';

export const CatalogPage: React.FC = () => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  


  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: category } = trpc.categories.getBySlug.useQuery(
    { slug: categorySlug! },
    { enabled: !!categorySlug }
  );

  const categoryIds = useMemo(() => {
    if (!categorySlug || !categories) return undefined;
    
    // Для аксессуаров показываем товары из поясов, украшений и чехлов
    if (categorySlug === 'accessories') {
      const accessoryCategories = categories.filter(cat => 
        ['belts', 'jewelry', 'cases'].includes(cat.slug)
      );
      return accessoryCategories.map(cat => cat.id);
    }
    
    // Для остальных категорий показываем только товары из этой категории
    const category = categories.find(cat => cat.slug === categorySlug);
    return category ? [category.id] : undefined;
  }, [categorySlug, categories]);

  const { data: products, isLoading } = trpc.products.getAll.useQuery({
    categoryIds,
    limit: 50,
  });



  return (
    <div className="min-h-screen bg-white text-luxury-950 pt-24">
      <div className="w-full mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-2 text-sm text-luxury-600 mb-4 font-luxury">
            <span>ГЛАВНАЯ</span>
            <span>/</span>
            <span>КАТАЛОГ</span>
            {category && (
              <>
                <span>/</span>
                <span className="text-primary-600">{category.name.toUpperCase()}</span>
              </>
            )}
          </div>
          
          <h1 className="font-sans text-4xl md:text-5xl font-semibold text-luxury-950 mb-4 tracking-wide">
            {category ? category.name : 'Каталог товаров'}
          </h1>
          
          {category?.description && (
            <p className="text-xl text-luxury-700 max-w-3xl font-light leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 space-y-6 lg:space-y-0">
          {/* Left Controls */}
          <div className="flex items-center space-x-6">


            {/* Category Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (categorySlug === cat.slug) {
                      window.location.href = '/catalog';
                    } else {
                      window.location.href = `/catalog/${cat.slug}`;
                    }
                  }}
                  className={cn(
                    'px-3 py-2 text-xs transition-all duration-300 font-luxury tracking-wider border-b-2',
                    categorySlug === cat.slug
                      ? 'border-primary-950 text-primary-950'
                      : 'border-transparent text-luxury-600 hover:text-primary-950 hover:border-luxury-300'
                  )}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>



        </div>



        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-950"></div>
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
            {products.map((product) => (
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
        ) : (
          <div className="text-center py-24">
            <p className="text-luxury-600 text-lg font-luxury tracking-wider">ТОВАРЫ НЕ НАЙДЕНЫ</p>
          </div>
        )}
      </div>
    </div>
  );
};