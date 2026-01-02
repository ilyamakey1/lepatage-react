import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';

export const HomePage: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);

  // Автоматический скролл вверх при загрузке страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Отслеживание прогресса скролла
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const scrolled = container.scrollLeft;
      const progress = scrollWidth > 0 ? (scrolled / scrollWidth) * 100 : 0;
      setScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: featuredProducts } = trpc.products.getFeatured.useQuery({ limit: 6 });
  const { data: homepageSettings } = trpc.homepage.getSettings.useQuery();
  
  // Get hero product if specified
  const heroProductSlug = homepageSettings?.hero_product_id || 'corset-armor';
  const { data: heroProduct } = trpc.products.getBySlug.useQuery(
    { slug: heroProductSlug }
  );
  
  // Fallback to default values if settings not loaded
  const heroImage = homepageSettings?.hero_image || '/assets/hero-woman-corset.jpg';
  const gridTopLeft = homepageSettings?.grid_top_left || '/assets/IMG_8424.MOV';
  const gridTopRight = homepageSettings?.grid_top_right || '/assets/IMG_2083.JPG';
  const gridBottomLeft = homepageSettings?.grid_bottom_left || '/assets/L\'Epatage DSC07578.JPG';
  const gridBottomRight = homepageSettings?.grid_bottom_right || '/assets/IMG_6013.JPG';
  
  // Determine if top left is video or image
  const isVideo = gridTopLeft.endsWith('.MOV') || gridTopLeft.endsWith('.mov') || gridTopLeft.endsWith('.mp4');

  return (
    <div className="min-h-screen text-luxury-950 overflow-x-hidden">
      {/* Hero Section - Adaptive height */}
      <section className="relative h-hero overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="L'epatage Woman in Corset"
            className={`w-full h-full object-cover object-center transition-all duration-1000 ${
              isHeroLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
            onLoad={() => setIsHeroLoaded(true)}
          />
          {/* Gradient overlays for mobile readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 md:bg-gradient-to-r md:from-black/20 md:via-transparent md:to-transparent" />
        </div>
      </section>

      {/* 2x2 Grid Layout */}
      <section className="mb-8 md:mb-16 lg:mb-24">
        <div className="grid grid-cols-2">
          {/* Top Left - Video or Image */}
          <div className="relative">
            <div className="w-full aspect-[3/4] md:aspect-[3/4] overflow-hidden">
              {isVideo ? (
                <video 
                  src={gridTopLeft} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <img
                  src={gridTopLeft}
                  alt="L'Épatage Collection"
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              )}
            </div>
          </div>

          {/* Top Right - with Product Plaque */}
          <div className="relative">
            <div className="w-full aspect-[3/4] md:aspect-[3/4] overflow-hidden relative">
              <img
                src={gridTopRight}
                alt="L'Épatage Collection"
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
              {/* View Product Plaque - Responsive */}
              {heroProduct && (
                <Link 
                  to={`/products/${heroProduct?.slug || ''}`}
                  className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm shadow-lg active:bg-white transition-colors"
                >
                  <div className="px-3 py-3 md:px-4 md:py-4 flex items-center gap-3">
                    <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={heroProduct.images?.[0] || '/assets/corset-avegue.jpg'}
                        alt={heroProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-luxury-950 font-semibold text-sm md:text-base leading-tight line-clamp-1">
                        {heroProduct.name}
                      </h3>
                      <p className="text-luxury-700 font-medium text-sm mt-0.5">
                        {heroProduct?.salePrice ? (
                          <>
                            <span className="line-through text-luxury-400 mr-1">{heroProduct?.price} ₽</span>
                            <span>{heroProduct?.salePrice} ₽</span>
                          </>
                        ) : (
                          `${heroProduct?.price} ₽`
                        )}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-luxury-400 flex-shrink-0" />
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Bottom Left */}
          <div className="relative">
            <div className="w-full aspect-[3/4] md:aspect-[3/4] overflow-hidden">
              <img
                src={gridBottomLeft}
                alt="L'Épatage Collection"
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>

          {/* Bottom Right */}
          <div className="relative">
            <div className="w-full aspect-[3/4] md:aspect-[3/4] overflow-hidden">
              <img
                src={gridBottomRight}
                alt="L'Épatage Style"
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="relative pb-12 md:pb-20">
          {/* Section Header */}
          <div className="px-4 md:px-8 mb-6 md:mb-10">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-luxury-950 tracking-tight">
              Рекомендации
            </h2>
          </div>

          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden relative">
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto scrollbar-hide px-4 scroll-smooth snap-x-mandatory"
            >
              <div className="flex gap-3 pb-4">
                {featuredProducts?.map((product: any, index: number) => (
                  <div 
                    key={product.id}
                    className={`flex-none w-[45vw] snap-start animate-fade-in-up opacity-0`}
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
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
            </div>
            
            {/* Scroll Progress */}
            <div className="mx-4 h-0.5 bg-luxury-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-luxury-950 transition-all duration-150 ease-out rounded-full"
                style={{ width: `${Math.max(scrollProgress, 10)}%` }}
              />
            </div>
          </div>

          {/* Tablet & Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-6 md:px-8">
            {featuredProducts?.map((product: any, index: number) => (
              <div
                key={product.id}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
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

        </section>
      )}
    </div>
  );
};
