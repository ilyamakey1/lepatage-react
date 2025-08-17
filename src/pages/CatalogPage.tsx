import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';
import { cn } from '../utils/cn';

export const CatalogPage: React.FC = () => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    searchParams.get('order') as 'asc' | 'desc' || 'desc'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    featured: searchParams.get('featured') === 'true',
    onSale: searchParams.get('sale') === 'true',
  });

  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: category } = trpc.categories.getBySlug.useQuery(
    { slug: categorySlug! },
    { enabled: !!categorySlug }
  );

  const categoryId = useMemo(() => {
    if (!categorySlug || !categories) return undefined;
    return categories.find(cat => cat.slug === categorySlug)?.id;
  }, [categorySlug, categories]);

  const { data: products, isLoading } = trpc.products.getAll.useQuery({
    categoryId,
    featured: filters.featured || undefined,
    onSale: filters.onSale || undefined,
    sortBy: sortBy as 'name' | 'price' | 'created',
    sortOrder,
    limit: 50,
  });

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('sort', newSortBy);
    setSearchParams(newSearchParams);
  };

  const handleOrderChange = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('order', newOrder);
    setSearchParams(newSearchParams);
  };

  const handleFilterChange = (filterKey: keyof typeof filters, value: boolean) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(filterKey === 'featured' ? 'featured' : 'sale', 'true');
    } else {
      newSearchParams.delete(filterKey === 'featured' ? 'featured' : 'sale');
    }
    setSearchParams(newSearchParams);
  };

  return (
    <div className="min-h-screen bg-white text-luxury-950 pt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 border transition-all duration-300 font-luxury tracking-wider text-sm',
                showFilters 
                  ? 'bg-primary-950 border-primary-950 text-white' 
                  : 'border-luxury-300 text-luxury-700 hover:border-primary-950 hover:text-primary-950'
              )}
            >
              <Filter size={14} />
              <span>ФИЛЬТРЫ</span>
            </button>

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

          {/* Right Controls */}
          <div className="flex items-center space-x-6">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 bg-white border border-luxury-300 text-luxury-950 text-xs focus:outline-none focus:border-primary-950 font-luxury"
              >
                <option value="created">По дате</option>
                <option value="name">По названию</option>
                <option value="price">По цене</option>
              </select>
              
              <button
                onClick={handleOrderChange}
                className="p-2 text-luxury-600 hover:text-primary-950 transition-colors duration-300"
              >
                {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-1 border border-luxury-300 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-all duration-300',
                  viewMode === 'grid'
                    ? 'bg-primary-950 text-white'
                    : 'text-luxury-600 hover:text-primary-950'
                )}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-all duration-300',
                  viewMode === 'list'
                    ? 'bg-primary-950 text-white'
                    : 'text-luxury-600 hover:text-primary-950'
                )}
              >
                <List size={14} />
              </button>
            </div>

            {/* Results Count */}
            {products && (
              <span className="text-luxury-600 text-xs font-luxury tracking-wider">
                НАЙДЕНО: {products.length}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-12 p-4 bg-luxury-50 minimal-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-luxury-950 font-medium mb-3 font-sans text-sm">Особенности</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.featured}
                      onChange={(e) => handleFilterChange('featured', e.target.checked)}
                      className="form-checkbox text-primary-950 rounded"
                    />
                    <span className="text-luxury-700 font-luxury text-sm">Рекомендуемые</span>
                  </label>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-950"></div>
          </div>
        ) : products && products.length > 0 ? (
          <div className={cn(
            'mb-16',
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
              : 'space-y-8'
          )}>
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
                className={viewMode === 'list' ? 'flex' : ''}
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