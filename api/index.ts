import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../server/router.js';
import { initDatabase, seedDatabase } from '../database/vercel-db.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Инициализация базы данных
app.use(async (_req, _res, next) => {
  try {
    await initDatabase();
    await seedDatabase();
    next();
  } catch (error) {
    console.error('Database initialization error:', error);
    next();
  }
});

// tRPC middleware
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: () => ({}),
}));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API endpoints
app.get('/api/categories', async (_req, res) => {
  try {
    const { db } = await import('../database/vercel-db.js');
    const result = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { db } = await import('../database/vercel-db.js');
    const categoryId = req.query.categoryId;
    
    let query = 'SELECT * FROM products';
    let params: (string | number)[] = [];
    
    if (categoryId && typeof categoryId === 'string') {
      query += ' WHERE category_id = ?';
      params.push(categoryId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.execute(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const { db } = await import('../database/vercel-db.js');
    const { slug } = req.params;
    
    const result = await db.execute(
      'SELECT * FROM products WHERE slug = ?',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Newsletter subscription
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    const { db } = await import('../database/vercel-db.js');
    
    // Check if email already exists
    const existing = await db.execute(
      'SELECT * FROM newsletter_subscriptions WHERE email = ?',
      [email]
    );
    
    if (existing.rows.length > 0) {
      return res.json({ 
        success: false, 
        message: 'Этот email уже подписан на рассылку' 
      });
    }
    
    // Add new subscription
    await db.execute(
      'INSERT INTO newsletter_subscriptions (email) VALUES (?)',
      [email]
    );
    
    res.json({ 
      success: true, 
      message: 'Спасибо за подписку!' 
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Export for Vercel
export default app;
