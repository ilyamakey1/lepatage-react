// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  images: string[];
  colors: string[];
  sizes?: string[];
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  onSale: boolean;
  tags: string[];
  createdAt: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

// Cart types
export interface CartItem {
  id: string;
  productId: number;
  variantId?: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Search types
export interface SearchResult {
  products: Product[];
  total: number;
  query: string;
}

// Newsletter types
export interface NewsletterResponse {
  success: boolean;
  message: string;
}