import { router } from './trpc.js';
import { productsRouter } from './routers/products.js';
import { categoriesRouter } from './routers/categories.js';
import { newsletterRouter } from './routers/newsletter.js';
import { authRouter } from './routers/auth.js';
import { ordersRouter } from './routers/orders.js';
import { customOrdersRouter } from './routers/customOrders.js';
import { homepageRouter } from './routers/homepage.js';

export const appRouter = router({
  products: productsRouter,
  categories: categoriesRouter,
  newsletter: newsletterRouter,
  auth: authRouter,
  orders: ordersRouter,
  customOrders: customOrdersRouter,
  homepage: homepageRouter,
});

export type AppRouter = typeof appRouter;