# L'epatage - React + Vite + tRPC + SQLite

A modern e-commerce website built with React, Vite, TypeScript, Tailwind CSS, tRPC, and SQLite.

## Features

- ⚡ **Vite** - Fast development and build
- ⚛️ **React 18** - Modern React with hooks
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🔧 **TypeScript** - Type-safe development
- 🚀 **tRPC** - End-to-end typesafe APIs
- 🗄️ **SQLite + Drizzle ORM** - Lightweight database with type-safe queries
- 🎯 **React Router** - Client-side routing
- 📱 **Responsive Design** - Mobile-first approach
- 🔍 **Real-time Search** - Instant product search
- 🛒 **Shopping Cart** - State management with React Query

## Project Structure

```
lepatage-react/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions and tRPC setup
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main App component
├── server/
│   ├── routers/          # tRPC route handlers
│   ├── trpc.ts           # tRPC configuration
│   ├── router.ts         # Main router
│   └── index.ts          # Express server
├── database/
│   ├── schema.ts         # Database schema (Drizzle)
│   ├── db.ts             # Database connection
│   ├── migrate.ts        # Migration script
│   └── seed.ts           # Seed data script
└── public/
    └── assets/           # Static assets (images, etc.)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Install Node.js and npm** (if not already installed):
   ```bash
   # Install Homebrew (if not installed)
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install Node.js
   brew install node
   ```

2. **Navigate to the project directory**:
   ```bash
   cd "/Users/ila/Desktop/lepatage website/lepatage-react"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up the database**:
   ```bash
   # Generate database migration files
   npx drizzle-kit generate:sqlite
   
   # Run migrations
   npm run db:migrate
   
   # Seed the database with sample data
   npm run db:seed
   ```

### Development

**Быстрый запуск (рекомендуется):**
```bash
npm run dev:full
```
Запустит одновременно фронтенд и API сервер.

**Отдельный запуск:**

1. **Start the backend server**:
   ```bash
   npm run server
   ```
   The API will be available at `http://localhost:3001`

2. **Start the frontend development server** (in a new terminal):
   ```bash
   npm run dev
   ```
   The website will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the frontend
npm run build

# Preview the build
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start the backend server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run lint` - Run ESLint

## Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Data fetching and caching
- **Lucide React** - Icons

### Backend
- **tRPC** - Type-safe API
- **Express** - Web server
- **Zod** - Schema validation
- **CORS** - Cross-origin resource sharing

### Database
- **SQLite** - Database
- **Drizzle ORM** - Type-safe database queries
- **Drizzle Kit** - Database migrations

## API Endpoints

The tRPC API provides the following routers:

### Products (`/api/products`)
- `getAll` - Get all products with filtering and pagination
- `getBySlug` - Get single product by slug
- `getFeatured` - Get featured products
- `search` - Search products

### Categories (`/api/categories`)
- `getAll` - Get all categories
- `getBySlug` - Get category by slug
- `getWithProductCounts` - Get categories with product counts

### Newsletter (`/api/newsletter`)
- `subscribe` - Subscribe to newsletter
- `unsubscribe` - Unsubscribe from newsletter

## Database Schema

The database includes the following main tables:
- `categories` - Product categories
- `products` - Products with details, pricing, and media
- `product_variants` - Product variations (color, size, etc.)
- `collections` - Curated product collections
- `users` - User accounts
- `carts` & `cart_items` - Shopping cart functionality
- `orders` & `order_items` - Order management
- `newsletter_subscriptions` - Email subscriptions

## Styling

The project uses Tailwind CSS with a custom design system:

### Colors
- **Primary**: Red tones (`#8b0000` to lighter variants)
- **Dark**: Black and gray tones for backgrounds
- **Text**: White and gray for content

### Typography
- **Display Font**: Playfair Display (for headings)
- **Body Font**: Inter (for content)

### Custom Animations
- Fade in animations
- Scale animations
- Hover effects
- Smooth transitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and proprietary to L'epatage.