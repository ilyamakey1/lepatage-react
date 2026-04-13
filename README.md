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

**🚀 Быстрый запуск (рекомендуется):**
```bash
# Используйте новый скрипт для автоматического запуска обоих серверов
./start-dev.sh
```
Этот скрипт автоматически:
- Остановит существующие процессы на портах 3001 и 5173
- Запустит backend сервер на порту 3001
- Запустит frontend сервер на порту 5173
- Покажет статус и URL для доступа

**🛑 Остановка серверов:**
```bash
./stop-dev.sh
```

**📱 Альтернативный способ (npm scripts):**
```bash
# Запуск обоих серверов одновременно
npm run dev:full

# Или отдельно:
npm run server    # Backend на http://localhost:3001
npm run dev       # Frontend на http://localhost:5173
```

**🌐 Доступ к приложению:**

*Локальный доступ (с этого компьютера):*
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

*Доступ с других компьютеров в сети:*
После запуска скрипт автоматически покажет IP-адрес вашего компьютера в сети. Используйте этот адрес для доступа с других устройств:
- **Frontend**: http://[ВАШ_IP]:5173
- **Backend API**: http://[ВАШ_IP]:3001/api

**Важно:** Убедитесь, что:
1. Оба компьютера находятся в одной сети (Wi-Fi или локальная сеть)
2. Файрвол не блокирует порты 3001 и 5173
3. Используйте IP-адрес, который показывается в консоли при запуске

*Доступ через интернет (с любого компьютера в мире):*

Если нужно открыть сайт с компьютера, который не в вашей сети, используйте один из способов:

**Вариант 1: Localtunnel (самый простой, без регистрации)**
```bash
./start-internet.sh
```
Скрипт автоматически создаст публичный URL, который можно открыть из любой точки мира.

**Вариант 2: Ngrok (требует регистрацию, бесплатно)**
```bash
./start-public.sh
# Выберите вариант 1
```
Требует регистрацию на https://ngrok.com

**Вариант 3: Cloudflare Tunnel (бесплатно, стабильно)**
```bash
./start-public.sh
# Выберите вариант 3
```

**Вариант 4: Настройка роутера (постоянное решение)**
Настройте проброс портов на роутере (см. `PUBLIC-ACCESS.md`)

### Building for Production

```bash
# Build the frontend
npm run build

# Preview the build
npm run preview
```

## Available Scripts

- `./start-dev.sh` - 🚀 **Автоматический запуск обоих серверов** (рекомендуется)
- `./stop-dev.sh` - 🛑 **Остановка всех серверов**
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start the backend server
- `npm run dev:full` - Start both frontend and backend servers
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