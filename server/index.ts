import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS configuration
app.use(cors({
  origin: true, // Разрешить любые origin для deve
  // lopmen
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Static files
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// tRPC middleware
app.use('/api', createExpressMiddleware({
  router: appRouter,
  createContext: () => ({}),
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {

  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Найдем локальный IP адрес
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (ifaceList) {
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
    }
  }
  
  console.log(`🚀 Server running on:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Network: http://${localIP}:${PORT}`);
  console.log(`📡 tRPC API available at:`);
  console.log(`   ➜ Local:   http://localhost:${PORT}/api`);
  console.log(`   ➜ Network: http://${localIP}:${PORT}/api`);
});

export default app;