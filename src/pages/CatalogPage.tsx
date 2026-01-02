import { useMemo, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils/cn';

export const CatalogPage: React.FC = () => {
  const { categorySlug } = useParams();
  const [isLoaded, setIsLoaded] = useState(false);

  // Автоматический скролл вверх при загрузке страницы
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(false);
    // Small delay to trigger animations
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [categorySlug]);

  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: category } = trpc.categories.getBySlug.useQuery(
    { slug: categorySlug! },
    { enabled: !!categorySlug }
  );

  const categoryIds = useMemo(() => {
    if (!categorySlug || !categories) return undefined;
    const category = categories.find(cat => cat.slug === categorySlug);
    return category ? [category.id] : undefined;
  }, [categorySlug, categories]);

  const { data: products, isLoading } = trpc.products.getAll.useQuery({
    categoryIds,
    limit: 50,
  });

  // Sort categories
  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => {
      const order: Record<string, number> = { 'corsets': 1, 'bags': 2, 'accessories': 3 };
      return (order[a.slug] || 999) - (order[b.slug] || 999);
    });
  }, [categories]);

  return (
    <div className="min-h-screen bg-white text-luxury-950 pt-14 md:pt-16">
      {/* Category Tabs - Only on Mobile */}
      <div className="md:hidden sticky top-14 z-30 bg-white border-b border-luxury-100">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex px-4 py-3 gap-2">
            {sortedCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalog/${cat.slug}`}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
                  categorySlug === cat.slug 
                    ? "bg-luxury-950 text-white" 
                    : "bg-luxury-100 text-luxury-600 active:bg-luxury-200"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className={cn(
          "mb-6 md:mb-10 transition-all duration-500",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-luxury-950">
            {category ? category.name : 'Каталог'}
          </h1>
          {products && (
            <p className="text-luxury-500 mt-2 text-sm md:text-base">
              {products.length} {products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}
            </p>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-luxury-100 rounded-lg mb-3" />
                <div className="h-4 bg-luxury-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-luxury-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  "transition-all duration-500",
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${Math.min(index * 50, 400)}ms` }}
              >
                <ProductCard 
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-luxury-500 text-lg">Товары не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};
